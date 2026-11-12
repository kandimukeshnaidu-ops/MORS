'use client';

import { useState } from 'react';
import type { PersonalTasteIdentity } from '@mors/db';
import type { ProfileTasteStats } from '@/app/explore/actions';
import { setTasteProfileSharing } from '@/app/explore/actions';
import { DimensionBar } from '@/components/profile/DimensionBar';

interface TasteStatsCardProps {
  stats?: ProfileTasteStats | null;
  identity?: PersonalTasteIdentity | null;
  username: string;
  isOwner?: boolean;
}

export function TasteStatsCard({ stats, identity, username, isOwner = false }: TasteStatsCardProps) {
  const [sharingEnabled, setSharingEnabled] = useState<boolean>(
    identity?.privacy.sharing_enabled ?? false
  );
  const [isUpdatingSharing, setIsUpdatingSharing] = useState<boolean>(false);

  const handleToggleSharing = async () => {
    if (!isOwner) return;
    try {
      setIsUpdatingSharing(true);
      const next = !sharingEnabled;
      await setTasteProfileSharing(next);
      setSharingEnabled(next);
    } catch {
      // Revert if error
    } finally {
      setIsUpdatingSharing(false);
    }
  };

  const totalMeals = identity?.food_activity.total_meals ?? stats?.totalMeals ?? 0;

  if (totalMeals < 3) {
    return (
      <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center text-xs text-[var(--text-secondary)] space-y-1">
        <p className="font-medium text-[var(--text-primary)]">Early Logging Stage</p>
        <p>
          Personal taste patterns emerge once at least 3 meals are logged. (Currently {totalMeals}{' '}
          {totalMeals === 1 ? 'meal' : 'meals'} recorded).
        </p>
      </div>
    );
  }

  // Monthly activity calculation
  const monthlyActivity = identity?.food_activity.monthly_activity ?? stats?.monthlyActivity ?? [];
  const maxMonthCount = Math.max(...monthlyActivity.map((m) => m.count), 1);

  // Preference vs Activity breakdown
  const topCuisines = identity?.taste_profile.top_cuisines ?? [];
  const topRatedDishes = identity?.taste_profile.top_rated_dishes ?? [];
  const mostLoggedDishes = identity?.food_activity.most_logged_dishes ?? [];
  const mostLoggedCuisines = identity?.food_activity.most_logged_cuisines ?? [];
  const dimensionPatterns = identity?.taste_profile.dimension_patterns;
  const temporalShifts = identity?.temporal_shifts;

  return (
    <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-8">
      {/* Header Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)] font-semibold">
              Personal Taste Identity
            </span>
            {isOwner ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                Private to you (All meals)
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                Shared Public Pool Insights
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
            {isOwner ? 'Your Culinary Profile & Preferences' : `@${username}'s Taste Identity`}
          </h3>
        </div>

        {/* Ownership Controls: Opt-in Sharing Toggle */}
        {isOwner && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={sharingEnabled}
                disabled={isUpdatingSharing}
                onChange={handleToggleSharing}
                className="rounded border-[var(--border-subtle)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] cursor-pointer"
              />
              <span>Share summary on profile</span>
            </label>
          </div>
        )}
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-3 gap-4 border-b border-[var(--border-subtle)] pb-6 text-center">
        <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <span className="block text-2xl font-bold text-[var(--text-primary)] font-display">
            {totalMeals}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">
            Meals Logged
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <span className="block text-2xl font-bold text-[var(--accent-primary)] font-display">
            {identity?.food_activity.unique_dishes ?? 0}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">
            Unique Dishes
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <span className="block text-2xl font-bold text-[var(--text-primary)] font-display">
            {identity?.food_activity.unique_places ?? 0}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">
            Dining Places
          </span>
        </div>
      </div>

      {/* SECTION 1: OBSERVED PREFERENCES (Explicit Ratings) */}
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Demonstrated Preferences (Ratings & Evidence)
          </h4>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Derived strictly from your explicit ratings. Requires at least 3 reviews to establish an early signal.
          </p>
        </div>

        {/* Highly Rated Cuisines */}
        {topCuisines.length > 0 ? (
          <div className="space-y-2">
            <span className="text-xs font-medium text-[var(--text-primary)]">Highly Rated Cuisines</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {topCuisines.map((c) => (
                <div
                  key={c.cuisine}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
                >
                  <div>
                    <span className="font-semibold text-xs text-[var(--text-primary)] block">
                      {c.cuisine}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {c.evidence_count} {c.evidence_count === 1 ? 'rating' : 'ratings'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--accent-primary)] font-mono">
                      ★ {c.average_rating.toFixed(1)}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        c.evidence_level === 'consistent_pattern'
                          ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                      }`}
                    >
                      {c.evidence_level === 'consistent_pattern' ? 'Consistent' : 'Early Signal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic">
            Not enough ratings to establish a cuisine preference pattern yet (min 3 ratings).
          </p>
        )}

        {/* Highly Rated Dishes */}
        {topRatedDishes.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              Repeated High-Rated Dishes (≥ 4.0 ★)
            </span>
            <div className="space-y-2">
              {topRatedDishes.map((dish) => (
                <div
                  key={dish.name}
                  className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[var(--bg-secondary)]/60 border border-[var(--border-subtle)]"
                >
                  <span className="font-medium text-[var(--text-primary)] truncate max-w-[220px]">
                    {dish.name}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-[var(--accent-primary)] font-bold">
                      ★ {dish.average_rating.toFixed(1)}
                    </span>
                    <span className="text-[var(--text-muted)]">×{dish.evidence_count} logged</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scorecard Dimensions */}
        {dimensionPatterns && (
          <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-medium text-[var(--text-primary)] block">
              Rating Patterns by Dimension
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Restaurant Dimensions */}
              <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-secondary)]/40 border border-[var(--border-subtle)]">
                <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] block">
                  Restaurant Dimensions
                </span>
                <DimensionBar
                  label="Food Quality"
                  rating10={dimensionPatterns.place_dimensions.food_quality.average ? dimensionPatterns.place_dimensions.food_quality.average * 2 : null}
                  count={dimensionPatterns.place_dimensions.food_quality.count}
                />
                <DimensionBar
                  label="Value for Money"
                  rating10={dimensionPatterns.place_dimensions.value_for_money.average ? dimensionPatterns.place_dimensions.value_for_money.average * 2 : null}
                  count={dimensionPatterns.place_dimensions.value_for_money.count}
                />
                <DimensionBar
                  label="Ambience"
                  rating10={dimensionPatterns.place_dimensions.ambience.average ? dimensionPatterns.place_dimensions.ambience.average * 2 : null}
                  count={dimensionPatterns.place_dimensions.ambience.count}
                />
                <DimensionBar
                  label="Service"
                  rating10={dimensionPatterns.place_dimensions.service.average ? dimensionPatterns.place_dimensions.service.average * 2 : null}
                  count={dimensionPatterns.place_dimensions.service.count}
                />
                <DimensionBar
                  label="Hygiene"
                  rating10={dimensionPatterns.place_dimensions.hygiene.average ? dimensionPatterns.place_dimensions.hygiene.average * 2 : null}
                  count={dimensionPatterns.place_dimensions.hygiene.count}
                />
              </div>

              {/* Dish Dimensions */}
              <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-secondary)]/40 border border-[var(--border-subtle)]">
                <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] block">
                  Dish Dimensions
                </span>
                <DimensionBar
                  label="Taste"
                  rating10={dimensionPatterns.dish_dimensions.taste.average ? dimensionPatterns.dish_dimensions.taste.average * 2 : null}
                  count={dimensionPatterns.dish_dimensions.taste.count}
                />
                <DimensionBar
                  label="Portion"
                  rating10={dimensionPatterns.dish_dimensions.portion.average ? dimensionPatterns.dish_dimensions.portion.average * 2 : null}
                  count={dimensionPatterns.dish_dimensions.portion.count}
                />
                <DimensionBar
                  label="Value"
                  rating10={dimensionPatterns.dish_dimensions.value.average ? dimensionPatterns.dish_dimensions.value.average * 2 : null}
                  count={dimensionPatterns.dish_dimensions.value.count}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: FOOD ACTIVITY (Behavior, Independent of Ratings) */}
      <div className="space-y-6 pt-6 border-t border-[var(--border-subtle)]">
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Food Activity & Habits (Frequency)
          </h4>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            What you log most often — distinguished from whether you rate it highly.
          </p>
        </div>

        {/* Most Logged Dishes and Cuisines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mostLoggedDishes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-[var(--text-primary)]">Most Logged Dishes</span>
              <div className="space-y-1.5">
                {mostLoggedDishes.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between text-xs py-1 text-[var(--text-secondary)]"
                  >
                    <span className="truncate max-w-[180px]">{d.name}</span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">{d.count} times</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mostLoggedCuisines.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-[var(--text-primary)]">Most Logged Cuisines</span>
              <div className="space-y-1.5">
                {mostLoggedCuisines.map((c) => (
                  <div
                    key={c.cuisine}
                    className="flex items-center justify-between text-xs py-1 text-[var(--text-secondary)]"
                  >
                    <span className="truncate max-w-[180px]">{c.cuisine}</span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">{c.count} meals</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Activity Histogram */}
        {monthlyActivity.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Logging Cadence (Last 6 Months)</span>
            <div className="flex items-end justify-between gap-2 h-16 pt-2" aria-hidden="true">
              {monthlyActivity.map((m) => {
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

            <table className="sr-only">
              <caption>Monthly Meal Logging Cadence</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Meals Logged</th>
                </tr>
              </thead>
              <tbody>
                {monthlyActivity.map((m) => (
                  <tr key={m.label}>
                    <td>{m.label}</td>
                    <td>{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Temporal Shifts (90-day comparison) */}
        {temporalShifts && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
              Recent 90-Day Activity Shift
            </span>
            {temporalShifts.has_sufficient_comparison_data ? (
              <p className="text-[var(--text-secondary)]">
                You logged <strong className="text-[var(--text-primary)]">{temporalShifts.recent_90d_meals} meals</strong>{' '}
                over the last 90 days (compared to {temporalShifts.prior_90d_meals} in the prior period).{' '}
                {temporalShifts.recent_top_cuisine && (
                  <span>
                    Your most active recent cuisine has been{' '}
                    <strong className="text-[var(--accent-primary)]">{temporalShifts.recent_top_cuisine}</strong>.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-[var(--text-muted)]">
                Not enough comparison data across both 90-day windows to detect activity shifts yet (requires ≥ 3 entries in each).
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
