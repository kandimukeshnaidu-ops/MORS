'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { performSearch, type SearchResultItem } from '@/app/search/actions';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { EmptyState } from '@/components/ui/EmptyState';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Results' },
  { id: 'dish', label: 'Dishes' },
  { id: 'place', label: 'Places' },
  { id: 'user', label: 'People' },
  { id: 'experience', label: 'Experiences' },
  { id: 'collection', label: 'Collections' },
];

export function SearchClientView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  const initialCity = searchParams.get('city') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState(initialType);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [timingMs, setTimingMs] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // Execute search when filters or debounced query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      runSearch(query, selectedType, cityFilter);
      syncUrl(query, selectedType, cityFilter);
    }, 280);

    return () => clearTimeout(handler);
  }, [query, selectedType, cityFilter]);

  const syncUrl = (q: string, type: string, city: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (type !== 'all') params.set('type', type);
    if (city.trim()) params.set('city', city.trim());

    startTransition(() => {
      router.replace(`/search?${params.toString()}`);
    });
  };

  const runSearch = async (q: string, type: string, city: string) => {
    if (!q.trim()) {
      setResults([]);
      setTimingMs(0);
      return;
    }

    setLoading(true);
    const typesFilter = type === 'all' ? undefined : [type];
    const res = await performSearch(q, {
      types: typesFilter,
      city: city || undefined,
      limit: 40,
    });
    setResults(res.results);
    setTimingMs(res.timingMs);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Search MORS
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Explore canonical dishes, dining venues, food journals, curators, and collections.
        </p>
      </div>

      {/* Search Inputs */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes, places, people, or journals... (e.g. biryani, pista house)"
            className="w-full pl-10 pr-10 py-3 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
          <span className="absolute left-3.5 top-3.5 text-xs text-[var(--text-muted)]">
            🔍
          </span>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* City Filter (Useful for Places) */}
        {(selectedType === 'all' || selectedType === 'place') && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] shrink-0">City:</span>
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filter by city (e.g. Hyderabad, Bengaluru, Mumbai)"
              className="px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] max-w-xs"
            />
            {cityFilter && (
              <button
                type="button"
                onClick={() => setCityFilter('')}
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Clear city
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-[var(--border-subtle)]">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedType(tab.id)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors shrink-0 ${
              selectedType === tab.id
                ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]'
                : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timing and Result Counts */}
      {query.trim() && !loading && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-4 font-mono">
          <span>{results.length} {results.length === 1 ? 'match' : 'matches'} found</span>
          <span>{timingMs}ms query time</span>
        </div>
      )}

      {/* Search Results / States */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[var(--text-muted)] font-mono">
          Searching MORS archive...
        </div>
      ) : !query.trim() ? (
        <div className="py-16 text-center space-y-3">
          <div className="text-3xl">🍲</div>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Type a dish name, place, friend&apos;s username, or food memory above to search. Typo-tolerant search is enabled.
          </p>
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No results found"
          description={`No matches found for "${query}". Try checking your spelling or selecting "All Results".`}
        />
      ) : (
        <div className="space-y-2.5">
          {results.map((r) => (
            <SearchResultCard key={`${r.type}-${r.id}`} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}
