'use client';

import 'react';
import Link from 'next/link';
import { RatingStars } from '@/components/ui/RatingStars';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DiaryEntryItem } from '@/app/diary/actions';

interface TimelineViewProps {
  items: DiaryEntryItem[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onOpenLog?: () => void;
}

function formatDateHeader(isoDateStr: string): string {
  const date = new Date(isoDateStr);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (isToday) return `Today — ${formatted}`;
  if (isYesterday) return `Yesterday — ${formatted}`;

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  return `${weekday}, ${formatted}`;
}

export function TimelineView({
  items,
  hasMore,
  loadingMore,
  onLoadMore,
  onOpenLog,
}: TimelineViewProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No food entries found"
        description="Your food archive is waiting. Log meals with dish names, ratings, and optional photos to build your taste timeline."
        actionLabel="Log a Meal"
        onAction={onOpenLog}
      />
    );
  }

  // Group items by calendar day string (YYYY-MM-DD)
  const groups: Array<{ dateKey: string; header: string; entries: DiaryEntryItem[] }> = [];
  const groupMap: Record<string, DiaryEntryItem[]> = {};

  for (const item of items) {
    const dateKey = item.eatenAt.slice(0, 10);
    if (!groupMap[dateKey]) {
      groupMap[dateKey] = [];
      groups.push({
        dateKey,
        header: formatDateHeader(item.eatenAt),
        entries: groupMap[dateKey],
      });
    }
    groupMap[dateKey].push(item);
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.dateKey} className="space-y-3">
          {/* Group Date Header */}
          <div className="sticky top-14 z-20 flex items-center gap-3 bg-[var(--bg-primary)]/90 backdrop-blur-md py-2">
            <h3 className="font-display text-sm font-semibold text-[var(--accent-primary)] uppercase tracking-wider">
              {group.header}
            </h3>
            <div className="flex-1 border-t border-[var(--border-subtle)]" />
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {group.entries.length} {group.entries.length === 1 ? 'meal' : 'meals'}
            </span>
          </div>

          {/* Group Entries */}
          <div className="space-y-4">
            {group.entries.map((entry) => {
              const mealTime = new Date(entry.eatenAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <div
                  key={entry.id}
                  className="group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] transition-all shadow-sm"
                >
                  {/* Primary Photo Thumbnail */}
                  {entry.primaryPhotoUrl && (
                    <Link
                      href={`/e/${entry.id}`}
                      className="sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden bg-[var(--bg-primary)] block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.primaryPhotoUrl}
                        alt={entry.title || 'Food thumbnail'}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  )}

                  {/* Entry Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Category & Status Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Chip size="sm" label={entry.categorySlug.toUpperCase()} selected />

                        {entry.status === 'draft' && (
                          <Chip
                            size="sm"
                            label="Draft"
                            className="border-amber-500/50 text-amber-400"
                          />
                        )}

                        {entry.visibility !== 'public' && (
                          <Chip
                            size="sm"
                            label={entry.visibility === 'followers' ? '👥 Followers' : '🔒 Private'}
                          />
                        )}

                        <span className="text-xs text-[var(--text-muted)] ml-auto">
                          {mealTime}
                        </span>
                      </div>

                      {/* Title / Dish */}
                      <Link
                        href={`/e/${entry.id}`}
                        className="font-display text-lg font-bold text-[var(--text-primary)] hover:underline block"
                      >
                        {entry.title || entry.dishes[0]?.name || 'Food Experience'}
                      </Link>

                      {/* Place Name */}
                      {entry.placeName && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                          <span>📍</span>
                          <span>{entry.placeName}</span>
                        </p>
                      )}

                      {/* Dishes List */}
                      {entry.dishes.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {entry.dishes.map((dish, i) => (
                            <span
                              key={`dish-${i}`}
                              className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-primary)] px-2 py-0.5 text-xs text-[var(--text-primary)] border border-[var(--border-subtle)]"
                            >
                              <span>{dish.name}</span>
                              {dish.rating && (
                                <span className="text-[10px] text-[var(--accent-primary)] font-bold">
                                  ★ {(dish.rating / 2).toFixed(1)}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Description snippet */}
                      {entry.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2 italic">
                          &quot;{entry.description}&quot;
                        </p>
                      )}
                    </div>

                    {/* Footer rating & action */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                      {entry.overallRating ? (
                        <RatingStars value={entry.overallRating} size="sm" />
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">Unrated</span>
                      )}

                      <Link
                        href={`/e/${entry.id}`}
                        className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Keyset Pagination Load More */}
      {hasMore && (
        <div className="pt-4 text-center">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            isLoading={loadingMore}
            className="w-full sm:w-auto px-8"
          >
            Load earlier entries
          </Button>
        </div>
      )}
    </div>
  );
}
