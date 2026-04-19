export type Host = 'github' | 'codeberg' | 'gitlab';

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

export type SortOption = 'stars' | 'updated' | 'name';
