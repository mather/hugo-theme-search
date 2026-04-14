import { useEffect, useMemo, useState } from 'react';
import { Theme, ThemesData, SortOption } from './types/theme';
import { isVersionCompatible, isValidVersion } from './utils/version';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { ThemeCard } from './components/ThemeCard';

const PAGE_SIZE = 24;
const MAX_VISIBLE_TAGS = 40;

export default function App() {
  const [data, setData] = useState<ThemesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hugoVersion, setHugoVersion] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('stars');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}themes.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ThemesData>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, []);

  // All tags sorted by frequency across all themes
  const availableTags = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    data.themes.forEach((t) =>
      t.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_VISIBLE_TAGS)
      .map(([tag]) => tag);
  }, [data]);

  const filteredThemes = useMemo((): Theme[] => {
    if (!data) return [];
    let result = data.themes;

    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower)
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((t) =>
        selectedTags.every((tag) => t.tags.includes(tag))
      );
    }

    const versionToCheck = hugoVersion.trim();
    if (versionToCheck && isValidVersion(versionToCheck)) {
      result = result.filter((t) =>
        isVersionCompatible(versionToCheck, t.hugo_min_version)
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'stars') return b.stars - a.stars;
      if (sortBy === 'updated')
        return (
          new Date(b.last_updated).getTime() -
          new Date(a.last_updated).getTime()
        );
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [data, searchText, selectedTags, hugoVersion, sortBy]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchText, selectedTags, hugoVersion, sortBy]);

  const visibleThemes = filteredThemes.slice(0, displayCount);
  const hasMore = displayCount < filteredThemes.length;
  const hasActiveFilters =
    searchText !== '' || selectedTags.length > 0 || hugoVersion !== '';

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedTags([]);
    setHugoVersion('');
    setSortBy('stars');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        totalCount={data?.total ?? 0}
        filteredCount={filteredThemes.length}
        generatedAt={data?.generated_at ?? null}
      />

      <FilterPanel
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        availableTags={availableTags}
        hugoVersion={hugoVersion}
        onHugoVersionChange={setHugoVersion}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center items-center py-32 text-gray-400">
            <svg
              className="animate-spin h-8 w-8 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Loading themes...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-32">
            <p className="text-red-500 font-medium">Failed to load themes</p>
            <p className="text-gray-400 text-sm mt-2">{error}</p>
          </div>
        )}

        {!loading && !error && filteredThemes.length === 0 && (
          <div className="text-center py-32 text-gray-400">
            <p className="text-lg font-medium">No themes found</p>
            <p className="text-sm mt-2">Try adjusting your filters.</p>
          </div>
        )}

        {!loading && !error && filteredThemes.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {visibleThemes.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setDisplayCount((c) => c + PAGE_SIZE)}
                  className="px-6 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Load more ({filteredThemes.length - displayCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
