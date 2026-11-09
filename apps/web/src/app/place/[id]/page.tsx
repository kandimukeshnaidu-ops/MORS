import 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlaceById } from '@/app/dish/actions';
import { RatingStars } from '@/components/ui/RatingStars';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { SaveToCollectionButton } from '@/components/collections/SaveToCollectionButton';
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
    description: `Discover community ratings and dining experiences logged at ${place.name} in ${place.city || 'India'} on MORS social food journal.`,
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>←</span>
            <span>Back to Taste Archive</span>
          </Link>
        </div>

        {/* Place Header */}
        <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" label="DINING VENUE" selected />
              {place.city && <Chip size="sm" label={place.city} />}
            </div>

            <SaveToCollectionButton
              itemType="place"
              targetId={place.id}
              itemTitle={place.name}
            />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            {place.name}
          </h1>

          {place.address && (
            <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
              <span>📍</span>
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
        </header>

        {/* Rating Breakdown: Community vs Personal */}
        <section className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Community Consensus Card */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Community Ratings
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">Public Only</span>
            </div>

            {place.stats.publicExperienceCount > 0 ? (
              <div className="space-y-2">
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

                <p className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                  Across <strong>{place.stats.publicExperienceCount}</strong> public eating occasions.
                </p>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-[var(--text-muted)]">
                  No public ratings yet for this location.
                </p>
              </div>
            )}
          </div>

          {/* Personal Visit History */}
          <div className="rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--accent-subtle)]/30 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                Your Personal History
              </span>
              <span className="text-xs font-mono text-[var(--accent-primary)]">Private to You</span>
            </div>

            {place.viewerPersonal ? (
              <div className="space-y-2">
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
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  You have not logged a meal at {place.name} yet.
                </p>
                <Link
                  href="/"
                  className="inline-block rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Log a Meal Here
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Other Branches (if any) */}
        {place.branches.length > 0 && (
          <section className="my-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
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
        <section className="my-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
            Public Experiences at {place.name} ({place.recentExperiences.length})
          </h2>

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
