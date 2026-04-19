interface HeaderProps {
  totalCount: number;
  filteredCount: number;
  generatedAt: string | null;
}

export function Header({ totalCount, filteredCount, generatedAt }: HeaderProps) {
  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Hugo Theme Search
              </h1>
              <a
                href="https://github.com/mather/hugo-theme-search"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub repository"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            </div>
            <p className="mt-1 text-gray-400 text-sm">
              Browse and filter Hugo themes to find the perfect one for your site.
            </p>
          </div>
          <div className="text-sm text-gray-400 text-right shrink-0">
            {totalCount > 0 && (
              <p>
                <span className="text-white font-semibold">{filteredCount}</span>
                <span> / {totalCount} themes</span>
              </p>
            )}
            {formattedDate && (
              <p className="text-xs mt-0.5">Updated {formattedDate}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
