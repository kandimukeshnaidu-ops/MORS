'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FindMode, FindSort } from '@mors/domain';
import {
  searchRestaurants,
  searchFoodDishes,
  getSearchSuggestions,
  type RestaurantResult,
  type DishResult,
  type SearchResultItem,
} from '@/app/search/actions';
import { FindModeSelector } from '@/components/search/FindModeSelector';
import { FindFilterBar } from '@/components/search/FindFilterBar';
import { RestaurantResultCard } from '@/components/search/RestaurantResultCard';
import { DishResultCard } from '@/components/search/DishResultCard';
import { SearchSkeleton } from '@/components/ui/skeletons/LayoutSkeletons';

export function SearchClientView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params
  const initialMode = (searchParams.get('mode') === 'food' ? 'food' : 'restaurants') as FindMode;
  const initialQuery = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || '';
  const initialCuisine = searchParams.get('cuisine') || '';
  const initialDietaryTag = searchParams.get('dietary') || '';
  const initialSort = (searchParams.get('sort') || 'relevance') as FindSort;

  // Local state
  const [mode, setMode] = useState<FindMode>(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [cuisine, setCuisine] = useState(initialCuisine);
  const [dietaryTag, setDietaryTag] = useState(initialDietaryTag);
  const [sort, setSort] = useState<FindSort>(initialSort);

  // Results & status
  const [restaurantResults, setRestaurantResults] = useState<RestaurantResult[]>([]);
  const [dishResults, setDishResults] = useState<DishResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timingMs, setTimingMs] = useState(0);
  const [, startTransition] = useTransition();

  // Sync URL when query or filters change
  const syncUrl = (
    currentMode: FindMode,
    q: string,
    c: string,
    cuis: string,
    diet: string,
    s: FindSort
  ) => {
    const params = new URLSearchParams();
    params.set('mode', currentMode);
    if (q.trim()) params.set('q', q.trim());
    if (c.trim()) params.set('city', c.trim());
    if (cuis.trim()) params.set('cuisine', cuis.trim());
    if (diet.trim()) params.set('dietary', diet.trim());
    if (s !== 'relevance') params.set('sort', s);

    startTransition(() => {
      router.replace(`/search?${params.toString()}`);
    });
  };

  // Debounced search runner
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch();
      syncUrl(mode, query, city, cuisine, dietaryTag, sort);
    }, 280);

    return () => clearTimeout(timer);
  }, [mode, query, city, cuisine, dietaryTag, sort]);

  // Autocomplete suggestions
  useEffect(() => {
    if (query.trim().length >= 2) {
      getSearchSuggestions(query, mode).then((res) => {
        setSuggestions(res);
      });
    } else {
      setSuggestions([]);
    }
  }, [query, mode]);

  const executeSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'restaurants') {
        const res = await searchRestaurants({
          query: query.trim() || undefined,
          city: city.trim() || undefined,
          cuisine: cuisine.trim() || undefined,
          sort,
          limit: 25,
        });

        if (res.error) {
          setError(res.error);
          setRestaurantResults([]);
        } else {
          setRestaurantResults(res.results);
          setTimingMs(res.timingMs);
        }
      } else {
        const res = await searchFoodDishes({
          query: query.trim() || undefined,
          cuisine: cuisine.trim() || undefined,
          dietary_tag: dietaryTag as any || undefined,
          sort,
          limit: 25,
        });

        if (res.error) {
          setError(res.error);
          setDishResults([]);
        } else {
          setDishResults(res.results);
          setTimingMs(res.timingMs);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setCity('');
    setCuisine('');
    setDietaryTag('');
    setSort('relevance');
  };

  const handleModeSwitch = (newMode: FindMode) => {
    setMode(newMode);
    setShowSuggestions(false);
  };

  const resultCount = mode === 'restaurants' ? restaurantResults.length : dishResults.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Find
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Explore restaurants and dishes backed by real community dining logs in Hyderabad and beyond.
        </p>
      </div>

      {/* Mode Selector */}
      <FindModeSelector mode={mode} onChange={handleModeSwitch} />

      {/* Search Input Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={
              mode === 'restaurants'
                ? 'Search restaurants, cafes, street stalls, areas... (e.g. Bawarchi, Jubilee Hills)'
                : 'Search dishes, biryani, dosas, desserts... (e.g. Haleem, Chicken Biryani)'
            }
            className="w-full pl-10 pr-10 py-3 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors shadow-sm"
          />
          <span className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear query"
              className="absolute right-3.5 p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Rapid Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl shadow-lg z-30 overflow-hidden divide-y divide-[var(--border-subtle)]">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setQuery(s.title);
                  setShowSuggestions(false);
                }}
                className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface)] transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{s.title}</span>
                  {s.subtitle && <span className="text-[var(--text-muted)]">({s.subtitle})</span>}
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--accent-primary)]">
                  {s.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <FindFilterBar
        mode={mode}
        city={city}
        onCityChange={setCity}
        cuisine={cuisine}
        onCuisineChange={setCuisine}
        dietaryTag={dietaryTag}
        onDietaryTagChange={setDietaryTag}
        sort={sort}
        onSortChange={setSort}
        onClearAll={handleClearFilters}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
        <span>
          {loading ? (
            'Searching…'
          ) : (
            <>
              Found <strong className="text-[var(--text-primary)]">{resultCount}</strong>{' '}
              {mode === 'restaurants'
                ? resultCount === 1
                  ? 'restaurant'
                  : 'restaurants'
                : resultCount === 1
                ? 'dish'
                : 'dishes'}
              {timingMs > 0 && <span className="ml-1">({timingMs}ms)</span>}
            </>
          )}
        </span>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-xl text-xs space-y-2">
          <p className="text-red-400 font-medium">{error}</p>
          <button
            type="button"
            onClick={executeSearch}
            className="px-3 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-200 rounded text-xs font-semibold transition-colors"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* Results List or Loading */}
      {loading ? (
        <SearchSkeleton />
      ) : resultCount > 0 ? (
        <div className="space-y-3.5">
          {mode === 'restaurants'
            ? restaurantResults.map((r) => <RestaurantResultCard key={r.id} restaurant={r} />)
            : dishResults.map((d) => <DishResultCard key={d.id} dish={d} />)}
        </div>
      ) : (
        /* Empty States */
        <div className="p-8 sm:p-12 text-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
            {query.trim()
              ? `No ${mode === 'restaurants' ? 'restaurants' : 'dishes'} found for "${query}"`
              : `Search ${mode === 'restaurants' ? 'Restaurants' : 'Food'}`}
          </h3>

          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {query.trim()
              ? 'Try checking for spelling variations, clearing your filters, or switching modes.'
              : mode === 'restaurants'
              ? 'Type a restaurant name, locality, or cuisine to find places verified by community diners.'
              : 'Type a dish name like "Dum Biryani", "Mirchi Bajji", or "Double Ka Meetha" to see ratings and places where it is logged.'}
          </p>

          {/* Cross-Mode Suggestion */}
          {query.trim() && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleModeSwitch(mode === 'restaurants' ? 'food' : 'restaurants')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
              >
                <span>
                  Search {mode === 'restaurants' ? 'Food & Dishes' : 'Restaurants'} for &quot;{query}&quot;
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
