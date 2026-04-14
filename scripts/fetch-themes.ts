#!/usr/bin/env tsx
/**
 * Fetches Hugo theme metadata from gohugoio/hugoThemesSiteBuilder and
 * writes the result to public/themes.json.
 *
 * Requires GITHUB_TOKEN environment variable.
 */

import { Octokit } from '@octokit/rest';
import { parse as parseTOML } from 'smol-toml';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../public/themes.json');

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export interface Theme {
  id: string;
  name: string;
  repo_url: string;
  description: string;
  demosite: string | null;
  license: string;
  tags: string[];
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
  const githubLines = lines.filter((l) => l.startsWith('github.com/'));
  console.log(
    `Found ${githubLines.length} GitHub themes out of ${lines.length} total`
  );
  return githubLines;
}

async function fetchRepoMeta(owner: string, repo: string) {
  const { data } = await octokit.repos.get({ owner, repo });
  return {
    stars: data.stargazers_count,
    last_updated: data.pushed_at ?? new Date().toISOString(),
    default_branch: data.default_branch,
  };
}

async function fetchThemeToml(
  owner: string,
  repo: string,
  branch: string
): Promise<Record<string, unknown>> {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: 'theme.toml',
    ref: branch,
  });
  const raw = Buffer.from(
    (data as { content: string }).content,
    'base64'
  ).toString('utf-8');
  return parseTOML(raw) as Record<string, unknown>;
}

async function findThumbnailUrl(
  owner: string,
  repo: string,
  branch: string
): Promise<string | null> {
  for (const ext of ['png', 'jpg']) {
    try {
      await octokit.repos.getContent({
        owner,
        repo,
        path: `images/tn.${ext}`,
        ref: branch,
      });
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/images/tn.${ext}`;
    } catch (e: unknown) {
      if ((e as { status?: number }).status !== 404) throw e;
    }
  }
  return null;
}

async function processTheme(repoPath: string): Promise<Theme | null> {
  const withoutHost = repoPath.replace('github.com/', '');
  const slashIdx = withoutHost.indexOf('/');
  if (slashIdx === -1) return null;
  const owner = withoutHost.slice(0, slashIdx);
  const repo = withoutHost.slice(slashIdx + 1);

  try {
    const { stars, last_updated, default_branch } = await fetchRepoMeta(
      owner,
      repo
    );

    let themeToml: Record<string, unknown> = {};
    try {
      themeToml = await fetchThemeToml(owner, repo, default_branch);
    } catch (e: unknown) {
      if ((e as { status?: number }).status !== 404) {
        console.warn(
          `  [WARN] theme.toml unavailable for ${repoPath}: ${(e as Error).message}`
        );
      }
    }

    const thumbnailUrl = await findThumbnailUrl(owner, repo, default_branch);

    const rawTags = Array.isArray(themeToml['tags'])
      ? (themeToml['tags'] as unknown[]).map(String)
      : [];
    const rawFeatures = Array.isArray(themeToml['features'])
      ? (themeToml['features'] as unknown[]).map(String)
      : [];
    const tags = [
      ...new Set(
        [...rawTags, ...rawFeatures].map((t) => t.toLowerCase().trim())
      ),
    ].sort();

    return {
      id: repoPath,
      name: String(themeToml['name'] ?? repo),
      repo_url: `https://github.com/${owner}/${repo}`,
      description: String(themeToml['description'] ?? ''),
      demosite: themeToml['demosite'] ? String(themeToml['demosite']) : null,
      license: String(themeToml['license'] ?? ''),
      tags,
      hugo_min_version: themeToml['min_version']
        ? String(themeToml['min_version'])
        : null,
      thumbnail_url: thumbnailUrl,
      stars,
      last_updated,
    };
  } catch (e: unknown) {
    console.warn(`[WARN] Skipping ${repoPath}: ${(e as Error).message}`);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      if (result) {
        themes.push(result);
      } else {
        failed++;
      }
      processed++;
    }

    console.log(
      `Progress: ${processed}/${themeLines.length} (success: ${themes.length}, failed: ${failed})`
    );

    if (i + BATCH_SIZE < themeLines.length) {
      await sleep(BATCH_DELAY_MS);
    }
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
