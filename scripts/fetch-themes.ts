#!/usr/bin/env tsx
/**
 * Fetches Hugo theme metadata from gohugoio/hugoThemesSiteBuilder and
 * writes the result to public/themes.json.
 *
 * Required env vars:
 *   GITHUB_TOKEN  - GitHub personal access token
 * Optional env vars:
 *   GITLAB_TOKEN  - GitLab personal access token (increases rate limit)
 */

import { Octokit } from '@octokit/rest';
import { parse as parseTOML } from 'smol-toml';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Host } from '../src/types/theme.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../public/themes.json');

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

// ---- Shared types ----

export interface Theme {
  id: string;
  host: Host;
  name: string;
  repo_url: string;
  description: string;
  demosite: string | null;
  license: string;
  tags: string[];
  features: string[];
  hugo_min_version: string | null;
  thumbnail_url: string | null;
  stars: number;
  last_updated: string;
}

export interface ThemesData {
  generated_at: string;
  total: number;
  themes: Theme[];
}

// ---- Utilities ----

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => String(v).toLowerCase().trim()))].sort();
}

function buildTheme(
  id: string,
  host: Host,
  repo_url: string,
  toml: Record<string, unknown>,
  meta: { stars: number; last_updated: string; thumbnail_url: string | null }
): Theme {
  return {
    id,
    host,
    name: String(toml['name'] ?? id.split('/').pop()),
    repo_url,
    description: String(toml['description'] ?? ''),
    demosite: toml['demosite'] ? String(toml['demosite']) : null,
    license: String(toml['license'] ?? ''),
    tags: toStringArray(toml['tags']),
    features: toStringArray(toml['features']),
    hugo_min_version: toml['min_version'] ? String(toml['min_version']) : null,
    thumbnail_url: meta.thumbnail_url,
    stars: meta.stars,
    last_updated: meta.last_updated,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- GitHub ----

async function processGitHub(owner: string, repo: string, id: string): Promise<Theme> {
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const { stargazers_count: stars, pushed_at: last_updated, default_branch: branch } = repoData;

  let toml: Record<string, unknown> = {};
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: 'theme.toml', ref: branch });
    const raw = Buffer.from((data as { content: string }).content, 'base64').toString('utf-8');
    toml = parseTOML(raw) as Record<string, unknown>;
  } catch (e: unknown) {
    if ((e as { status?: number }).status !== 404) throw e;
  }

  let thumbnail_url: string | null = null;
  for (const ext of ['png', 'jpg']) {
    try {
      await octokit.repos.getContent({ owner, repo, path: `images/tn.${ext}`, ref: branch });
      thumbnail_url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/images/tn.${ext}`;
      break;
    } catch (e: unknown) {
      if ((e as { status?: number }).status !== 404) throw e;
    }
  }

  return buildTheme(id, 'github', `https://github.com/${owner}/${repo}`, toml, {
    stars: stars ?? 0,
    last_updated: last_updated ?? new Date().toISOString(),
    thumbnail_url,
  });
}

// ---- Codeberg (Gitea API) ----

async function codebergGet(path: string): Promise<Response> {
  const res = await fetch(`https://codeberg.org/api/v1${path}`, {
    headers: { Accept: 'application/json' },
  });
  return res;
}

async function processCodeberg(owner: string, repo: string, id: string): Promise<Theme> {
  const repoRes = await codebergGet(`/repos/${owner}/${repo}`);
  if (!repoRes.ok) throw new Error(`Codeberg API ${repoRes.status}`);
  const repoData = await repoRes.json() as {
    stars_count: number;
    updated: string;
    default_branch: string;
  };
  const { stars_count: stars, updated: last_updated, default_branch: branch } = repoData;

  let toml: Record<string, unknown> = {};
  const tomlRes = await codebergGet(`/repos/${owner}/${repo}/contents/theme.toml?ref=${branch}`);
  if (tomlRes.ok) {
    const fileData = await tomlRes.json() as { content: string };
    const raw = Buffer.from(fileData.content, 'base64').toString('utf-8');
    toml = parseTOML(raw) as Record<string, unknown>;
  }

  let thumbnail_url: string | null = null;
  for (const ext of ['png', 'jpg']) {
    const tnRes = await codebergGet(`/repos/${owner}/${repo}/contents/images/tn.${ext}?ref=${branch}`);
    if (tnRes.ok) {
      thumbnail_url = `https://codeberg.org/${owner}/${repo}/raw/branch/${branch}/images/tn.${ext}`;
      break;
    }
  }

  return buildTheme(id, 'codeberg', `https://codeberg.org/${owner}/${repo}`, toml, {
    stars,
    last_updated,
    thumbnail_url,
  });
}

// ---- GitLab ----

function gitlabHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (GITLAB_TOKEN) headers['PRIVATE-TOKEN'] = GITLAB_TOKEN;
  return headers;
}

async function processGitLab(projectPath: string, id: string): Promise<Theme> {
  const encoded = encodeURIComponent(projectPath);
  const headers = gitlabHeaders();

  const repoRes = await fetch(`https://gitlab.com/api/v4/projects/${encoded}`, { headers });
  if (!repoRes.ok) throw new Error(`GitLab API ${repoRes.status}`);
  const repoData = await repoRes.json() as {
    star_count: number;
    last_activity_at: string;
    default_branch: string;
  };
  const { star_count: stars, last_activity_at: last_updated, default_branch: branch } = repoData;

  let toml: Record<string, unknown> = {};
  const tomlRes = await fetch(
    `https://gitlab.com/api/v4/projects/${encoded}/repository/files/${encodeURIComponent('theme.toml')}/raw?ref=${branch}`,
    { headers }
  );
  if (tomlRes.ok) {
    toml = parseTOML(await tomlRes.text()) as Record<string, unknown>;
  }

  let thumbnail_url: string | null = null;
  for (const ext of ['png', 'jpg']) {
    const tnRes = await fetch(
      `https://gitlab.com/api/v4/projects/${encoded}/repository/files/${encodeURIComponent(`images/tn.${ext}`)}/raw?ref=${branch}`,
      { headers }
    );
    if (tnRes.ok) {
      thumbnail_url = `https://gitlab.com/${projectPath}/-/raw/${branch}/images/tn.${ext}`;
      break;
    }
  }

  return buildTheme(id, 'gitlab', `https://gitlab.com/${projectPath}`, toml, {
    stars,
    last_updated,
    thumbnail_url,
  });
}

// ---- Routing ----

function parseRepoPath(
  repoPath: string
): { host: Host; owner: string; repo: string; projectPath: string } | null {
  let host: Host;
  let withoutHost: string;

  if (repoPath.startsWith('github.com/')) {
    host = 'github';
    withoutHost = repoPath.slice('github.com/'.length);
  } else if (repoPath.startsWith('codeberg.org/')) {
    host = 'codeberg';
    withoutHost = repoPath.slice('codeberg.org/'.length);
  } else if (repoPath.startsWith('gitlab.com/')) {
    host = 'gitlab';
    withoutHost = repoPath.slice('gitlab.com/'.length);
  } else {
    return null;
  }

  // Remove Go module major version suffix (e.g. /v2, /v3)
  // See: https://go.dev/ref/mod#major-version-suffixes
  const normalized = withoutHost.replace(/\/v\d+$/, '');
  const slashIdx = normalized.indexOf('/');
  if (slashIdx === -1) return null;

  return {
    host,
    owner: normalized.slice(0, slashIdx),
    repo: normalized.slice(slashIdx + 1),
    projectPath: normalized,
  };
}

async function processTheme(repoPath: string): Promise<Theme | null> {
  const parsed = parseRepoPath(repoPath);
  if (!parsed) return null;
  const { host, owner, repo, projectPath } = parsed;

  try {
    switch (host) {
      case 'github':   return await processGitHub(owner, repo, repoPath);
      case 'codeberg': return await processCodeberg(owner, repo, repoPath);
      case 'gitlab':   return await processGitLab(projectPath, repoPath);
    }
  } catch (e: unknown) {
    console.warn(`[WARN] Skipping ${repoPath}: ${(e as Error).message}`);
    return null;
  }
}

// ---- Main ----

async function fetchThemesList(): Promise<string[]> {
  console.log('Fetching themes.txt...');
  const { data } = await octokit.repos.getContent({
    owner: 'gohugoio',
    repo: 'hugoThemesSiteBuilder',
    path: 'themes.txt',
  });
  const content = Buffer.from(
    (data as { content: string }).content,
    'base64'
  ).toString('utf-8');
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  const supported = lines.filter(
    (l) =>
      l.startsWith('github.com/') ||
      l.startsWith('codeberg.org/') ||
      l.startsWith('gitlab.com/')
  );
  const skipped = lines.length - supported.length;
  console.log(
    `Found ${supported.length} supported themes (${skipped} unsupported hosts skipped)`
  );
  return supported;
}

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is required.');
    process.exit(1);
  }

  const themeLines = await fetchThemesList();
  const themes: Theme[] = [];
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < themeLines.length; i += BATCH_SIZE) {
    const batch = themeLines.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(processTheme));

    for (const result of results) {
      if (result) themes.push(result);
      else failed++;
      processed++;
    }

    console.log(
      `Progress: ${processed}/${themeLines.length} (success: ${themes.length}, failed: ${failed})`
    );

    if (i + BATCH_SIZE < themeLines.length) await sleep(BATCH_DELAY_MS);
  }

  themes.sort((a, b) => b.stars - a.stars);

  const output: ThemesData = {
    generated_at: new Date().toISOString(),
    total: themes.length,
    themes,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nDone! Written ${themes.length} themes to ${OUTPUT_PATH}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
