import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDishBySlug } from '../actions';
import { RatingStars } from '@/components/ui/RatingStars';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { SaveToCollectionButton } from '@/components/collections/SaveToCollectionButton';
import { DimensionBar } from '@/components/profile/DimensionBar';
import type { Metadata } from 'next';

interface DishPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DishPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dish = await getDishBySlug(slug);

  if (!dish) {
    return { title: 'Dish Not Found — MORS' };
  }

  return {
    title: `${dish.name} — Community Taste & Ratings — MORS`,
    description: dish.description || `Discover community ratings, 3-dimension taste metrics, and dining experiences of ${dish.name} on MORS.`,
  };
}

export default async function DishDetailPage({ params }: DishPageProps) {
  const { slug } = await params;
  const dish = await getDishBySlug(slug);

  if (!dish) {
    notFound();
  }

  const communityDisplayRating = dish.stats.publicRatingAvg
    ? (dish.stats.publicRatingAvg / 2).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/find?mode=dishes"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded"
          >
            <span>←</span>
            <span>Back to Discovery</span>
          </Link>

          <Link
            href={`/explore`}
            className="text-xs text-[var(--accent-primary)] hover:underline font-medium"
          >
            Regional Rankings →
          </Link>
        </div>

        {/* Dish Hero Header */}
        <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" label="CANONICAL DISH" selected />
              {dish.cuisine && (
                <Chip size="sm" label={dish.cuisine} />
              )}
            </div>

            <div className="flex items-center gap-2">
              <SaveToCollectionButton
                itemType="dish"
                targetId={dish.id}
                itemTitle={dish.name}
              />
              <Link
                href={`/e/new?dish_id=${dish.id}&dish_name=${encodeURIComponent(dish.name)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <span>+</span>
                <span>Log This Dish</span>
              </Link>
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            {dish.name}
          </h1>

          {/* Regional / Multilingual Names */}
          {dish.translations && dish.translations.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {dish.translations.map((t) => (
                <span
                  key={t.locale}
                  className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] font-medium"
                >
                  <span className="text-[10px] uppercase font-mono text-[var(--accent-primary)] mr-1.5">
                    {t.locale === 'te' ? 'Telugu' : t.locale === 'hi' ? 'Hindi' : t.locale}:
                  </span>
                  {t.name}
                </span>
              ))}
            </div>
          )}

          {dish.description && (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {dish.description}
            </p>
          )}

          {/* Regional Ranking Badge */}
          {dish.ranking && dish.ranking.isRanked && dish.ranking.rank && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-subtle)]/20 px-3 py-1.5 text-xs font-medium text-[var(--accent-primary)]">
              <span className="font-mono font-bold text-sm">#{dish.ranking.rank}</span>
              <span>Ranked in {dish.ranking.region} by Community Taste Consensus</span>
            </div>
          )}
        </header>

        {/* Community 3-Dimension Scorecard vs Personal Taste */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Community Consensus Card */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Community Ratings
              </span>
              <span className="text-[10px] font-mono text-[var(--accent-primary)] bg-[var(--accent-subtle)]/30 px-2 py-0.5 rounded">
                Strict Public Pool
              </span>
            </div>

            {dish.stats.publicRatingCount >= 3 ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl font-bold text-[var(--text-primary)]">
                    {communityDisplayRating || 'Logged'}
                  </span>
                  {communityDisplayRating && (
                    <span className="text-sm text-[var(--text-muted)] font-medium">/ 5.0</span>
                  )}
                </div>

                {dish.stats.publicRatingAvg && (
                  <RatingStars
                    value={Math.round(dish.stats.publicRatingAvg)}
                    size="md"
                    label="Community aggregate rating"
                  />
                )}

                <p className="text-xs text-[var(--text-secondary)]">
                  Based on <strong>{dish.stats.publicRatingCount}</strong> public ratings across{' '}
                  <strong>{dish.stats.publicExperienceCount}</strong> logged experiences.
                </p>

                {/* 3-Dimension Dish Scorecard */}
                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Taste & Serving Scorecard
                  </h4>
                  <DimensionBar
                    label="Taste & Flavor"
                    rating10={dish.stats.tasteAvg}
                    count={dish.stats.tasteCount}
                  />
                  <DimensionBar
                    label="Portion Size"
                    rating10={dish.stats.portionAvg}
                    count={dish.stats.portionCount}
                  />
                  <DimensionBar
                    label="Value for Money"
                    rating10={dish.stats.valueAvg}
                    count={dish.stats.valueCount}
                  />
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="font-display text-base font-medium text-[var(--text-primary)]">
                  Not Enough Ratings Yet
                </p>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                  {dish.stats.publicRatingCount === 0
                    ? 'No public ratings yet for this dish concept. Be the first to rate it in an eating experience!'
                    : `Currently has ${dish.stats.publicRatingCount} rating. At least 3 ratings are required before community consensus is displayed.`}
                </p>
              </div>
            )}
          </div>

          {/* Personal Taste History */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  Your Taste Memory
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Private to You</span>
              </div>

              {dish.viewerPersonal ? (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-4xl font-bold text-[var(--text-primary)]">
                      {dish.viewerPersonal.ratingAvg
                        ? (dish.viewerPersonal.ratingAvg / 2).toFixed(1)
                        : 'Experienced'}
                    </span>
                    {dish.viewerPersonal.ratingAvg && (
                      <span className="text-sm text-[var(--text-muted)] font-medium">
                        your average
                      </span>
                    )}
                  </div>

                  {dish.viewerPersonal.latestRating && (
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--text-muted)]">Latest score:</div>
                      <RatingStars
                        value={dish.viewerPersonal.latestRating}
                        size="md"
                        label="Your latest rating"
                      />
                    </div>
                  )}

                  <p className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                    You have logged this dish <strong>{dish.viewerPersonal.experienceCount}</strong>{' '}
                    {dish.viewerPersonal.experienceCount === 1 ? 'time' : 'times'}.
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-[var(--text-secondary)]">
                    You have not logged {dish.name} in your food journal yet.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <Link
                href={`/e/new?dish_id=${dish.id}&dish_name=${encodeURIComponent(dish.name)}`}
                className="w-full text-center block rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                {dish.viewerPersonal ? 'Log Another Taste' : 'Log This Dish'}
              </Link>
            </div>
          </div>
        </section>

        {/* "Where to Eat This Dish" (Community Logged Venues) */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              Where to Eat This Dish
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {dish.placesLogged.length} {dish.placesLogged.length === 1 ? 'venue' : 'venues'} logged
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] italic">
            Venues where the community has logged this dish. Not a guarantee of current availability.
          </p>

          {dish.placesLogged.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dish.placesLogged.map((venue) => (
                <Link
                  key={venue.placeId}
                  href={`/place/${venue.placeId}`}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:border-[var(--accent-primary)] transition-all flex flex-col justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                        {venue.placeName}
                      </h3>
                      {venue.placeRatingAvg && (
                        <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1">
                          <span className="text-[var(--accent-primary)]">★</span>
                          <span>{(venue.placeRatingAvg / 2).toFixed(1)}</span>
                        </span>
                      )}
                    </div>

                    {venue.address && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                        {venue.address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
                    <span className="text-[11px]">
                      Logged <strong>{venue.timesLogged}</strong> {venue.timesLogged === 1 ? 'time' : 'times'}
                    </span>
                    {venue.localDishRatingAvg ? (
                      <span className="font-medium text-[var(--text-secondary)]">
                        Dish: {(venue.localDishRatingAvg / 2).toFixed(1)} / 5
                      </span>
                    ) : (
                      <span className="text-[10px]">Unrated dish</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center text-xs text-[var(--text-muted)]">
              No restaurants have community logs for this dish yet. Be the first to log where you ate it!
            </div>
          )}
        </section>

        {/* Public Experiences Logged with this Dish */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              Community Experiences with {dish.name}
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {dish.recentExperiences.length} recent
            </span>
          </div>

          {dish.recentExperiences.length > 0 ? (
            <div className="space-y-4">
              {dish.recentExperiences.map((exp) => (
                <div
                  key={exp.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 hover:border-[var(--border-strong)] transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Link href={`/u/${exp.author.username}`}>
                      <Avatar
                        alt={exp.author.displayName || exp.author.username}
                        fallbackText={exp.author.displayName || exp.author.username}
                        size="md"
                      />
                    </Link>

                    <div>
                      <Link
                        href={`/u/${exp.author.username}`}
                        className="text-sm font-medium hover:underline text-[var(--text-primary)]"
                      >
                        {exp.author.displayName || exp.author.username}
                      </Link>
                      <div className="text-xs text-[var(--text-muted)]">
                        @{exp.author.username} • {new Date(exp.eatenAt).toLocaleDateString()}
                      </div>
                      {exp.place && (
                        <div className="text-xs text-[var(--accent-primary)] mt-1 font-medium">
                          Eaten at {exp.place.name} {exp.place.city ? `(${exp.place.city})` : ''}
                        </div>
                      )}
                      {exp.note && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                          &ldquo;{exp.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    {exp.rating && (
                      <RatingStars value={exp.rating} size="sm" />
                    )}

                    <Link
                      href={`/e/${exp.id}`}
                      className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center text-xs text-[var(--text-muted)]">
              No public entries for this dish yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
