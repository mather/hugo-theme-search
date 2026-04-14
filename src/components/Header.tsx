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
            <h1 className="text-2xl font-bold tracking-tight">
              Hugo Theme Search
            </h1>
            <p className="mt-1 text-gray-400 text-sm">
              Browse and filter Hugo themes to find the perfect one for your
              site.
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
