'use client';

import type { ProfileTasteStats } from '@/app/explore/actions';

interface TasteStatsCardProps {
  stats: ProfileTasteStats;
  username: string;
  isOwner?: boolean;
}

export function TasteStatsCard({ stats, username, isOwner = false }: TasteStatsCardProps) {
  if (stats.totalMeals < 5) {
    return (
      <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center text-xs text-[var(--text-secondary)]">
        Taste statistics emerge once at least 5 meals are logged. (Currently {stats.totalMeals} {stats.totalMeals === 1 ? 'meal' : 'meals'} logged).
      </div>
    );
  }

  const maxMonthCount = Math.max(...stats.monthlyActivity.map((m) => m.count), 1);

  return (
    <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-6">
      {/* Header Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)]">
              Taste Identity
            </span>
            {!isOwner && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                From public entries
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
            Culinary Activity & Consensus
          </h3>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="block text-xl font-bold text-[var(--text-primary)] font-display">
              {stats.totalMeals}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">
              Meals Logged
            </span>
          </div>

          {stats.averageRating && (
            <div className="text-right">
              <span className="block text-xl font-bold text-[var(--accent-primary)] font-display">
                ★ {stats.averageRating}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">
                Avg Rating
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Activity Histogram with Accessible Data Table */}
      {stats.monthlyActivity.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-[var(--text-secondary)]">Logging Cadence (Last 6 Months)</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-16 pt-2" aria-hidden="true">
            {stats.monthlyActivity.map((m) => {
              const heightPercent = Math.max(10, Math.round((m.count / maxMonthCount) * 100));
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[28px] rounded-t bg-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)] transition-all"
                    title={`${m.label}: ${m.count} meals`}
                  />
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{m.label}</span>
                </div>
              );
            })}
          </div>

          {/* Accessible Table for Screen Readers */}
          <table className="sr-only">
            <caption>Monthly Meal Logging Cadence</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Meals Logged</th>
              </tr>
            </thead>
            <tbody>
              {stats.monthlyActivity.map((m) => (
                <tr key={m.label}>
                  <td>{m.label}</td>
                  <td>{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Favourite Cuisines */}
      {stats.favouriteCuisines.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-xs font-medium text-[var(--text-secondary)] block">
            Most Explored Cuisines
          </span>
          <div className="flex flex-wrap gap-2">
            {stats.favouriteCuisines.map((c) => (
              <div
                key={c.cuisine}
                className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs flex items-center gap-1.5"
              >
                <span className="font-medium text-[var(--text-primary)]">{c.cuisine}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">({c.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Rated Dishes */}
      {stats.topRatedDishes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-xs font-medium text-[var(--text-secondary)] block">
            Highest Rated Dishes (≥ 4.0 ★)
          </span>
          <div className="space-y-1.5">
            {stats.topRatedDishes.map((dish) => (
              <div
                key={dish.name}
                className="flex items-center justify-between text-xs py-1 text-[var(--text-secondary)]"
              >
                <span className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                  {dish.name}
                </span>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-[var(--accent-primary)]">★ {(dish.rating / 2).toFixed(1)}</span>
                  <span className="text-[var(--text-muted)]">×{dish.timesLogged}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
