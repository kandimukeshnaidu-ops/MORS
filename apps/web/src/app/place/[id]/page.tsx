import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlaceById } from '@/app/dish/actions';
import { RatingStars } from '@/components/ui/RatingStars';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { SaveToCollectionButton } from '@/components/collections/SaveToCollectionButton';
import { DimensionBar } from '@/components/profile/DimensionBar';
import type { Metadata } from 'next';

interface PlacePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { id } = await params;
  const place = await getPlaceById(id);

  if (!place) {
    return { title: 'Place Not Found — MORS' };
  }

  return {
    title: `${place.name} (${place.city || 'India'}) — Community Taste — MORS`,
    description: `Discover community ratings, 5-dimension reviews, and food dishes logged at ${place.name} in ${place.city || 'India'} on MORS social food journal.`,
  };
}

export default async function PlaceDetailPage({ params }: PlacePageProps) {
  const { id } = await params;
  const place = await getPlaceById(id);

  if (!place) {
    notFound();
  }

  const communityDisplayRating = place.stats.publicRatingAvg
    ? (place.stats.publicRatingAvg / 2).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/find?mode=restaurants"
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

        {/* Place Header */}
        <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" label="DINING VENUE" selected />
              {place.city && <Chip size="sm" label={place.city} />}
            </div>

            <div className="flex items-center gap-2">
              <SaveToCollectionButton
                itemType="place"
                targetId={place.id}
                itemTitle={place.name}
              />
              <Link
                href={`/e/new?place_id=${place.id}&place_name=${encodeURIComponent(place.name)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <span>+</span>
                <span>Log Meal Here</span>
              </Link>
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            {place.name}
          </h1>

          {place.address && (
            <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[var(--accent-primary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{place.address}</span>
            </p>
          )}

          {place.parentPlace && (
            <p className="text-xs text-[var(--text-muted)]">
              Branch location of{' '}
              <Link
                href={`/place/${place.parentPlace.id}`}
                className="text-[var(--accent-primary)] hover:underline font-medium"
              >
                {place.parentPlace.name}
              </Link>
            </p>
          )}

          {/* Regional Ranking Badge */}
          {place.ranking && place.ranking.isRanked && place.ranking.rank && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-subtle)]/20 px-3 py-1.5 text-xs font-medium text-[var(--accent-primary)]">
              <span className="font-mono font-bold text-sm">#{place.ranking.rank}</span>
              <span>Ranked in {place.ranking.city} by Community Consensus</span>
            </div>
          )}
        </header>

        {/* Rating Breakdown: Community 5-Dimension Scorecard vs Personal */}
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

            {place.stats.publicRatingCount >= 3 ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl font-bold text-[var(--text-primary)]">
                    {communityDisplayRating || 'Logged'}
                  </span>
                  {communityDisplayRating && (
                    <span className="text-sm text-[var(--text-muted)] font-medium">/ 5.0</span>
                  )}
                </div>

                {place.stats.publicRatingAvg && (
                  <RatingStars
                    value={Math.round(place.stats.publicRatingAvg)}
                    size="md"
                    label="Community aggregate rating"
                  />
                )}

                <p className="text-xs text-[var(--text-secondary)]">
                  Based on <strong>{place.stats.publicRatingCount}</strong> public ratings across{' '}
                  <strong>{place.stats.publicExperienceCount}</strong> dining occasions.
                </p>

                {/* 5-Dimension Breakdown */}
                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    5-Dimension Scorecard
                  </h4>
                  <DimensionBar
                    label="Food Quality"
                    rating10={place.stats.foodQualityAvg}
                    count={place.stats.foodQualityCount}
                  />
                  <DimensionBar
                    label="Value for Money"
                    rating10={place.stats.valueForMoneyAvg}
                    count={place.stats.valueForMoneyCount}
                  />
                  <DimensionBar
                    label="Ambience"
                    rating10={place.stats.ambienceAvg}
                    count={place.stats.ambienceCount}
                  />
                  <DimensionBar
                    label="Service"
                    rating10={place.stats.serviceAvg}
                    count={place.stats.serviceCount}
                  />
                  <DimensionBar
                    label="Hygiene"
                    rating10={place.stats.hygieneAvg}
                    count={place.stats.hygieneCount}
                  />
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="font-display text-base font-medium text-[var(--text-primary)]">
                  Not Enough Ratings Yet
                </p>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                  {place.stats.publicRatingCount === 0
                    ? 'No public ratings yet for this location. Be the first to log and rate a meal here!'
                    : `Currently has ${place.stats.publicRatingCount} rating. At least 3 public ratings are required before community consensus is displayed.`}
                </p>
              </div>
            )}
          </div>

          {/* Personal Visit History */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  Your Personal History
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Private to You</span>
              </div>

              {place.viewerPersonal ? (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-4xl font-bold text-[var(--text-primary)]">
                      {place.viewerPersonal.latestRating
                        ? (place.viewerPersonal.latestRating / 2).toFixed(1)
                        : 'Visited'}
                    </span>
                    {place.viewerPersonal.latestRating && (
                      <span className="text-sm text-[var(--text-muted)] font-medium">
                        latest score
                      </span>
                    )}
                  </div>

                  {place.viewerPersonal.latestRating && (
                    <RatingStars
                      value={place.viewerPersonal.latestRating}
                      size="md"
                      label="Your latest rating"
                    />
                  )}

                  <p className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                    You have logged <strong>{place.viewerPersonal.visitCount}</strong>{' '}
                    {place.viewerPersonal.visitCount === 1 ? 'meal' : 'meals'} at this place.
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-[var(--text-secondary)]">
                    You have not logged a meal at {place.name} yet.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <Link
                href={`/e/new?place_id=${place.id}&place_name=${encodeURIComponent(place.name)}`}
                className="w-full text-center block rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                {place.viewerPersonal ? 'Log Another Meal Here' : 'Log a Meal Here'}
              </Link>
            </div>
          </div>
        </section>

        {/* "What to Order Here" (Dishes Logged at This Branch) */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              What to Order Here
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {place.dishesLogged.length} {place.dishesLogged.length === 1 ? 'dish' : 'dishes'} logged
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] italic">
            Dishes logged by the community at this location. Not an official menu.
          </p>

          {place.dishesLogged.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {place.dishesLogged.map((dish) => (
                <Link
                  key={dish.dishId}
                  href={`/dish/${dish.dishSlug}`}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:border-[var(--accent-primary)] transition-all flex flex-col justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                        {dish.dishName}
                      </h3>
                      {dish.cuisine && (
                        <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                          {dish.cuisine}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
                    <span className="text-[11px]">
                      Logged <strong>{dish.timesLogged}</strong> {dish.timesLogged === 1 ? 'time' : 'times'}
                    </span>
                    {dish.localDishRatingAvg ? (
                      <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
                        <span className="text-[var(--accent-primary)]">★</span>
                        <span>{(dish.localDishRatingAvg / 2).toFixed(1)}</span>
                      </span>
                    ) : (
                      <span className="text-[10px]">Unrated</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center text-xs text-[var(--text-muted)]">
              No specific dishes have been logged at this location yet. Be the first to log a dish!
            </div>
          )}
        </section>

        {/* Other Branches (if any) */}
        {place.branches.length > 0 && (
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Other Branches ({place.branches.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {place.branches.map((b) => (
                <Link
                  key={b.id}
                  href={`/place/${b.id}`}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                >
                  {b.name} {b.city ? `(${b.city})` : ''} →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Public Experiences Logged Here */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              Public Experiences at {place.name}
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {place.recentExperiences.length} recent
            </span>
          </div>

          {place.recentExperiences.length > 0 ? (
            <div className="space-y-4">
              {place.recentExperiences.map((exp) => (
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
                      {exp.dishesSummary && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                          Ate: {exp.dishesSummary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    {exp.overallRating && (
                      <RatingStars value={exp.overallRating} size="sm" />
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
              No public entries for this place yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
