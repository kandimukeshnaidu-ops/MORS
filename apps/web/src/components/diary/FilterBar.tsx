'use client';

import 'react';
import { Chip } from '@/components/ui/Chip';
import { FOOD_CATEGORIES } from '@mors/domain';

export interface FilterState {
  view: 'timeline' | 'calendar';
  category: string;
  minRating: number;
  query: string;
  status: 'all' | 'published' | 'draft';
  dateExact?: string | null;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  isOwner?: boolean;
}

export function FilterBar({ filters, onChange, isOwner = true }: FilterBarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-sm">
      {/* Top Row: Search and View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search dish names, notes, memories..."
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => onChange({ query: '' })}
              className="absolute right-3 top-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* View Switcher: Timeline vs Calendar */}
        <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChange({ view: 'timeline' })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.view === 'timeline'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <span>📜</span>
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ view: 'calendar' })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.view === 'calendar'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <span>📅</span>
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* Middle Row: Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip
          label="All Categories"
          selected={filters.category === 'all'}
          onClick={() => onChange({ category: 'all' })}
          size="sm"
        />
        {FOOD_CATEGORIES.map((cat) => {
          const slug = typeof cat === 'string' ? cat : cat.slug;
          const label = typeof cat === 'string' ? cat : cat.label;
          return (
            <Chip
              key={slug}
              label={label}
              selected={filters.category === slug}
              onClick={() => onChange({ category: slug })}
              size="sm"
            />
          );
        })}
      </div>

      {/* Bottom Row: Rating & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--text-muted)]">Minimum Rating:</label>
          <select
            value={filters.minRating}
            onChange={(e) => onChange({ minRating: Number(e.target.value) })}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
          >
            <option value={0}>Any rating</option>
            <option value={6}>3.0+ ★</option>
            <option value={7}>3.5+ ★</option>
            <option value={8}>4.0+ ★</option>
            <option value={9}>4.5+ ★</option>
            <option value={10}>5.0 ★ Only</option>
          </select>
        </div>

        {isOwner && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-[var(--text-muted)]">Status:</label>
            {(['all', 'published', 'draft'] as const).map((s) => (
              <Chip
                key={s}
                label={s.charAt(0).toUpperCase() + s.slice(1)}
                selected={filters.status === s}
                onClick={() => onChange({ status: s })}
                size="sm"
              />
            ))}
          </div>
        )}

        {filters.dateExact && (
          <div className="flex items-center gap-1 text-xs text-[var(--accent-primary)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-full">
            <span>Date: {filters.dateExact}</span>
            <button
              type="button"
              onClick={() => onChange({ dateExact: null })}
              className="hover:scale-110 ml-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
