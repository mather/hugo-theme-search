import { useState } from 'react';
import { Theme } from '../types/theme';

interface ThemeCardProps {
  theme: Theme;
}

function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function ThemeCard({ theme }: ThemeCardProps) {
  const placeholderSrc = `${import.meta.env.BASE_URL}placeholder.svg`;
  const [imgSrc, setImgSrc] = useState(theme.thumbnail_url ?? placeholderSrc);

  const handleImgError = () => {
    setImgSrc(placeholderSrc);
  };

  const handleCardClick = () => {
    window.open(theme.repo_url, '_blank', 'noopener,noreferrer');
  };

  const handleDemoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (theme.demosite) {
      window.open(theme.demosite, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
    >
      {/* Thumbnail */}
      <div className="aspect-[3/2] bg-gray-100 overflow-hidden">
        <img
          src={imgSrc}
          onError={handleImgError}
          alt={`${theme.name} screenshot`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate text-sm leading-5">
            {theme.name}
          </h3>
          {theme.stars > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 text-yellow-400 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{formatStars(theme.stars)}</span>
            </div>
          )}
        </div>

        {theme.description && (
          <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {theme.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {formatDate(theme.last_updated)}
          </span>
          {theme.demosite && (
            <button
              onClick={handleDemoClick}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Demo →
            </button>
          )}
        </div>

        {theme.hugo_min_version && (
          <div className="mt-2">
            <span className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
              Hugo ≥ {theme.hugo_min_version}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
