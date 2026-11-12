'use client';

import type { FindMode, FindSort } from '@mors/domain';

interface FindFilterBarProps {
  mode: FindMode;
  city: string;
  onCityChange: (city: string) => void;
  cuisine: string;
  onCuisineChange: (cuisine: string) => void;
  dietaryTag: string;
  onDietaryTagChange: (tag: string) => void;
  sort: FindSort;
  onSortChange: (sort: FindSort) => void;
  onClearAll: () => void;
}

const COMMON_CITIES = ['Hyderabad', 'Secunderabad', 'Bengaluru', 'Mumbai'];
const COMMON_CUISINES = ['Hyderabadi', 'South Indian', 'North Indian', 'Biryani', 'Mughlai', 'Street Food'];

export function FindFilterBar({
  mode,
  city,
  onCityChange,
  cuisine,
  onCuisineChange,
  dietaryTag,
  onDietaryTagChange,
  sort,
  onSortChange,
  onClearAll,
}: FindFilterBarProps) {
  const hasActiveFilters = Boolean(city || cuisine || dietaryTag || sort !== 'relevance');

  return (
    <div className="space-y-3 p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-[11px]">
          Filters & Sorting
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-[var(--accent-primary)] hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* City Filter (Restaurants Mode) */}
        {mode === 'restaurants' && (
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-city" className="text-[var(--text-muted)] font-medium">
              City:
            </label>
            <input
              id="filter-city"
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="e.g. Hyderabad"
              className="px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-xs w-32 sm:w-40"
            />
          </div>
        )}

        {/* Cuisine Filter */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-cuisine" className="text-[var(--text-muted)] font-medium">
            Cuisine:
          </label>
          <input
            id="filter-cuisine"
            type="text"
            value={cuisine}
            onChange={(e) => onCuisineChange(e.target.value)}
            placeholder="e.g. Hyderabadi"
            className="px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-xs w-32 sm:w-40"
          />
        </div>

        {/* Dietary Tag Filter (Food Mode) */}
        {mode === 'food' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)] font-medium">Dietary:</span>
            <div className="inline-flex rounded-lg border border-[var(--border-subtle)] p-0.5 bg-[var(--bg-surface)]">
              {(
                [
                  { id: '', label: 'All' },
                  { id: 'veg', label: 'Veg' },
                  { id: 'egg', label: 'Egg' },
                  { id: 'non_veg', label: 'Non-Veg' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onDietaryTagChange(option.id)}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    dietaryTag === option.id
                      ? 'bg-[var(--accent-primary)] text-white font-medium'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 ml-auto">
          <label htmlFor="filter-sort" className="text-[var(--text-muted)] font-medium">
            Sort:
          </label>
          <select
            id="filter-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as FindSort)}
            className="px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-xs"
          >
            <option value="relevance">Relevance</option>
            <option value="rating_score">Highest Rated</option>
            <option value="rating_count">Most Reviewed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
