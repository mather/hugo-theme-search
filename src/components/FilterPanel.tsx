import { SortOption } from '../types/theme';
import { isValidVersion } from '../utils/version';

interface ChipGroupProps {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  activeColor: 'blue' | 'violet';
  counts: Map<string, number>;
}

function ChipGroup({ label, items, selected, onToggle, activeColor, counts }: ChipGroupProps) {
  if (items.length === 0) return null;
  const activeClass =
    activeColor === 'blue'
      ? 'bg-blue-600 text-white border-blue-600'
      : 'bg-violet-600 text-white border-violet-600';
  const hoverClass =
    activeColor === 'blue'
      ? 'hover:border-blue-400 hover:text-blue-600'
      : 'hover:border-violet-400 hover:text-violet-600';

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item);
          const count = counts.get(item) ?? 0;
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? activeClass
                  : `bg-white text-gray-600 border-gray-300 ${hoverClass}`
              }`}
            >
              {item}
              <span className={`ml-1 ${active ? 'opacity-80' : 'opacity-50'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FilterPanelProps {
  searchText: string;
  onSearchChange: (v: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  tagCounts: Map<string, number>;
  selectedFeatures: string[];
  onFeatureToggle: (feature: string) => void;
  availableFeatures: string[];
  featureCounts: Map<string, number>;
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
  tagCounts,
  selectedFeatures,
  onFeatureToggle,
  availableFeatures,
  featureCounts,
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
        {/* Row 1: search + version + sort + reset */}
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

        {/* Tags section */}
        <ChipGroup
          label="Tags"
          items={availableTags}
          selected={selectedTags}
          onToggle={onTagToggle}
          activeColor="blue"
          counts={tagCounts}
        />

        {/* Features section */}
        <ChipGroup
          label="Features"
          items={availableFeatures}
          selected={selectedFeatures}
          onToggle={onFeatureToggle}
          activeColor="violet"
          counts={featureCounts}
        />
      </div>
    </div>
  );
}
