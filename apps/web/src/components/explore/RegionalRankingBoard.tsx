'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchRegionalRestaurantRankings,
  fetchRegionalDishRankings,
  fetchRegionalOverview,
  type RankedRestaurantItem,
  type RankedDishItem,
  type RegionalOverview,
} from '@/app/explore/ranking-actions';
import { formatDisplayRating } from '@mors/domain';

export function RegionalRankingBoard() {
  const [city, setCity] = useState('Hyderabad');
  const [tab, setTab] = useState<'restaurants' | 'dishes'>('restaurants');
  const [dimension, setDimension] = useState('overall');
  const [overview, setOverview] = useState<RegionalOverview | null>(null);
  const [restaurants, setRestaurants] = useState<RankedRestaurantItem[]>([]);
  const [dishes, setDishes] = useState<RankedDishItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [city, tab, dimension]);

  const loadData = async () => {
    setLoading(true);
    try {
      const ovRes = await fetchRegionalOverview(city);
      if (ovRes.overview) setOverview(ovRes.overview);

      if (tab === 'restaurants') {
        const res = await fetchRegionalRestaurantRankings({
          city,
          dimension,
          limit: 25,
        });
        setRestaurants(res.rankings);
      } else {
        const res = await fetchRegionalDishRankings({
          city,
          dimension: dimension === 'food_quality' ? 'taste' : dimension,
          limit: 25,
        });
        setDishes(res.rankings);
      }
    } catch {
      // Handled gracefully in empty state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 sm:p-6 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">
                Confidence-Adjusted Rankings
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">Bayesian Prior M=5</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {city} Taste Leaderboard
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="region-city-select" className="text-xs text-[var(--text-secondary)] font-medium">
              Region:
            </label>
            <select
              id="region-city-select"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-medium"
            >
              <option value="Hyderabad">Hyderabad</option>
              <option value="Secunderabad">Secunderabad</option>
              <option value="Bengaluru">Bengaluru</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
              <p className="text-[11px] text-[var(--text-muted)]">Verified Venues</p>
              <p className="text-lg font-bold font-mono text-[var(--text-primary)] mt-0.5">
                {overview.rankedVenues} <span className="text-xs text-[var(--text-muted)] font-normal">/ {overview.totalVenues}</span>
              </p>
            </div>
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
              <p className="text-[11px] text-[var(--text-muted)]">Verified Dishes</p>
              <p className="text-lg font-bold font-mono text-[var(--text-primary)] mt-0.5">
                {overview.rankedDishes} <span className="text-xs text-[var(--text-muted)] font-normal">/ {overview.totalDishes}</span>
              </p>
            </div>
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
              <p className="text-[11px] text-[var(--text-muted)]">Regional Prior</p>
              <p className="text-lg font-bold font-mono text-[var(--accent-primary)] mt-0.5">
                {overview.regionalAvgRating ? formatDisplayRating(overview.regionalAvgRating) : '3.5★'}
              </p>
            </div>
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
              <p className="text-[11px] text-[var(--text-muted)]">Ranking Gate</p>
              <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1">
                ≥ 3 distinct reviews
              </p>
            </div>
          </div>
        )}

        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          MORS regional rankings eliminate small-sample bias by shrinking scores toward the regional prior. A place with two 5-star reviews will never automatically outrank a proven favourite with dozens of strong reviews.
        </p>
      </div>

      {/* Tabs & Dimension Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Entity Switcher */}
        <div className="inline-flex p-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('restaurants');
              setDimension('overall');
            }}
            className={`px-3.5 py-1.5 font-semibold rounded-lg transition-all ${
              tab === 'restaurants'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Top Restaurants
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('dishes');
              setDimension('overall');
            }}
            className={`px-3.5 py-1.5 font-semibold rounded-lg transition-all ${
              tab === 'dishes'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Top Dishes
          </button>
        </div>

        {/* Dimension Chips */}
        <div className="inline-flex gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setDimension('overall')}
            className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
              dimension === 'overall'
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Overall Quality
          </button>
          {tab === 'restaurants' ? (
            <>
              <button
                type="button"
                onClick={() => setDimension('food_quality')}
                className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                  dimension === 'food_quality'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Food Quality
              </button>
              <button
                type="button"
                onClick={() => setDimension('value_for_money')}
                className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                  dimension === 'value_for_money'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Best Value
              </button>
              <button
                type="button"
                onClick={() => setDimension('ambience')}
                className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                  dimension === 'ambience'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Ambience
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setDimension('taste')}
                className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                  dimension === 'taste'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Best Taste
              </button>
              <button
                type="button"
                onClick={() => setDimension('value')}
                className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                  dimension === 'value'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Best Value
              </button>
            </>
          )}
        </div>
      </div>

      {/* Leaderboard List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--text-muted)]">Calculating regional rankings…</div>
      ) : tab === 'restaurants' ? (
        restaurants.length > 0 ? (
          <div className="space-y-3">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-muted)] rounded-xl transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      r.rankPosition === 1
                        ? 'bg-[var(--accent-primary)] text-white'
                        : r.rankPosition <= 3
                        ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    #{r.rankPosition}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link
                        href={r.url}
                        className="font-display text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors truncate"
                      >
                        {r.name}
                      </Link>
                      {r.isRanked ? (
                        <span className="text-[9px] uppercase font-mono font-medium tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded">
                          Ranked
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-mono tracking-wider text-[var(--text-muted)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded">
                          Emerging
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {r.placeType || 'Restaurant'} {r.address ? `· ${r.address}` : ''}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-4 flex items-center gap-3 text-right">
                  <div>
                    <p className="font-mono font-bold text-sm text-[var(--text-primary)]">
                      {r.ratingAvg ? formatDisplayRating(r.ratingAvg) : '—'}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {r.ratingCount} {r.ratingCount === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>

                  <Link
                    href={r.url}
                    className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                    aria-label={`View ${r.name}`}
                  >
                    →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-secondary)]">
            No ranked restaurants found in {city} for this dimension yet.
          </div>
        )
      ) : dishes.length > 0 ? (
        <div className="space-y-3">
          {dishes.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-muted)] rounded-xl transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                    d.rankPosition === 1
                      ? 'bg-[var(--accent-primary)] text-white'
                      : d.rankPosition <= 3
                      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  #{d.rankPosition}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={d.url}
                      className="font-display text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors truncate"
                    >
                      {d.name}
                    </Link>
                    {d.isRanked ? (
                      <span className="text-[9px] uppercase font-mono font-medium tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded">
                        Ranked
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase font-mono tracking-wider text-[var(--text-muted)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded">
                        Emerging
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {d.cuisine || 'Dish'}
                    {d.topPlaces && d.topPlaces.length > 0 && (
                      <span className="text-[var(--text-muted)]"> · Top log at {d.topPlaces[0].place_name}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-4 flex items-center gap-3 text-right">
                <div>
                  <p className="font-mono font-bold text-sm text-[var(--text-primary)]">
                    {d.ratingAvg ? formatDisplayRating(d.ratingAvg) : '—'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {d.ratingCount} {d.ratingCount === 1 ? 'rating' : 'ratings'}
                  </p>
                </div>

                <Link
                  href={d.url}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  aria-label={`View ${d.name}`}
                >
                  →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-secondary)]">
          No ranked dishes found in {city} for this dimension yet.
        </div>
      )}
    </div>
  );
}
