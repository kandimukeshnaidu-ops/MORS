'use client';

import Link from 'next/link';
import type { SearchResultItem } from '@/app/search/actions';

interface SearchResultCardProps {
  result: SearchResultItem;
}

function ResultIcon({ type }: { type: SearchResultItem['type'] }) {
  const className = 'w-4 h-4 text-[var(--accent-primary)]';
  switch (type) {
    case 'dish':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'place':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
    case 'user':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    case 'experience':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case 'collection':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      );
  }
}

export function SearchResultCard({ result }: SearchResultCardProps) {
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
      className="group flex items-center justify-between p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-muted)] hover:bg-[var(--bg-surface)] transition-all"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
          <ResultIcon type={result.type} />
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
