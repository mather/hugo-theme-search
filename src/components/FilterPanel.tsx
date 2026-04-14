import { SortOption } from '../types/theme';
import { isValidVersion } from '../utils/version';

interface FilterPanelProps {
  searchText: string;
  onSearchChange: (v: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  hugoVersion: string;
  onHugoVersionChange: (v: string) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FilterPanel({
  searchText,
  onSearchChange,
  selectedTags,
  onTagToggle,
  availableTags,
  hugoVersion,
  onHugoVersionChange,
  sortBy,
  onSortChange,
  onReset,
  hasActiveFilters,
}: FilterPanelProps) {
  const versionInvalid = hugoVersion !== '' && !isValidVersion(hugoVersion);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Row 1: search + sort + version */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Text search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search themes..."
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Hugo version */}
          <div className="relative">
            <input
              type="text"
              placeholder="Hugo version (e.g. 0.140.0)"
              value={hugoVersion}
              onChange={(e) => onHugoVersionChange(e.target.value)}
              className={`w-full sm:w-52 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                versionInvalid
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {versionInvalid && (
              <p className="absolute text-xs text-red-500 mt-0.5">
                Format: 0.140.0
              </p>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="stars">Sort: Stars</option>
            <option value="updated">Sort: Last Updated</option>
            <option value="name">Sort: Name</option>
          </select>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 whitespace-nowrap"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Row 2: Tag chips */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
