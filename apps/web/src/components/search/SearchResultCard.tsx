'use client';

import Link from 'next/link';
import type { SearchResultItem } from '@/app/search/actions';

interface SearchResultCardProps {
  result: SearchResultItem;
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const typeIcons: Record<SearchResultItem['type'], string> = {
    dish: '🍲',
    place: '📍',
    user: '👤',
    experience: '✨',
    collection: '📚',
  };

  const typeLabels: Record<SearchResultItem['type'], string> = {
    dish: 'Dish',
    place: 'Dining Venue',
    user: 'Taste Profile',
    experience: 'Food Experience',
    collection: 'Curated Collection',
  };

  return (
    <Link
      href={result.url}
      className="group flex items-center justify-between p-4 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-muted)] transition-all"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-base">
          {typeIcons[result.type] || '🔍'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--accent-primary)]">
              {typeLabels[result.type]}
            </span>
          </div>

          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
            {result.title}
          </h3>

          {result.subtitle && (
            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
              {result.subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 ml-4 flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform">
          →
        </span>
      </div>
    </Link>
  );
}
