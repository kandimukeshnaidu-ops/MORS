'use client';

import React from 'react';
import Link from 'next/link';
import type { DishResult } from '@/app/search/actions';
import { formatDisplayRating } from '@mors/domain';

interface DishResultCardProps {
  dish: DishResult;
}

export function DishResultCard({ dish }: DishResultCardProps) {
  const displayRating = dish.ratingAvg != null ? formatDisplayRating(dish.ratingAvg) : null;
  const tasteDisplay = dish.tasteAvg != null ? formatDisplayRating(dish.tasteAvg) : null;
  const portionDisplay = dish.portionAvg != null ? formatDisplayRating(dish.portionAvg) : null;

  return (
    <article className="group bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-muted)] rounded-xl p-4 sm:p-5 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Category & Cuisine Badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">
              Dish
            </span>
            {dish.cuisine && (
              <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] border border-[var(--border-subtle)] px-2 py-0.5 rounded">
                {dish.cuisine}
              </span>
            )}
          </div>

          {/* Dish Title */}
          <h2 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
            <Link href={dish.url} className="hover:underline">
              {dish.name}
            </Link>
          </h2>

          {/* Description */}
          {dish.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
              {dish.description}
            </p>
          )}

          {/* Ratings & Dimensions */}
          <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
            {displayRating ? (
              <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-md font-mono font-semibold text-[var(--text-primary)]">
                <svg className="w-3.5 h-3.5 text-[var(--accent-primary)] fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{displayRating}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">/ 5.0</span>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-muted)] italic">
                Awaiting community ratings
              </span>
            )}

            {dish.ratingCount > 0 && (
              <span className="text-xs text-[var(--text-secondary)]">
                {dish.ratingCount} {dish.ratingCount === 1 ? 'rating' : 'ratings'}
              </span>
            )}

            {tasteDisplay && (
              <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
                Taste: <strong className="text-[var(--text-secondary)]">{tasteDisplay}</strong>
              </span>
            )}

            {portionDisplay && (
              <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
                Portion: <strong className="text-[var(--text-secondary)]">{portionDisplay}</strong>
              </span>
            )}
          </div>

          {/* Top Places Where Logged */}
          {dish.topPlaces && dish.topPlaces.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
              <span className="text-[11px] font-medium text-[var(--text-muted)] mr-1.5">
                Logged here by the community:
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {dish.topPlaces.map((tp) => (
                  <Link
                    key={tp.place_id}
                    href={`/place/${tp.place_id}`}
                    className="inline-flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] px-2 py-0.5 rounded text-[11px] text-[var(--text-primary)] transition-colors"
                  >
                    <span>{tp.place_name}</span>
                    {tp.city && <span className="text-[var(--text-muted)]">({tp.city})</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Link */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <Link
            href={dish.url}
            className="text-xs font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1"
          >
            <span>View dish</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
