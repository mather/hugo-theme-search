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

export type SortOption = 'stars' | 'updated' | 'name';
