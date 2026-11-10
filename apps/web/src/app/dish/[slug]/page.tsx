import 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDishBySlug } from '../actions';
import { RatingStars } from '@/components/ui/RatingStars';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { SaveToCollectionButton } from '@/components/collections/SaveToCollectionButton';
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
    description: dish.description || `Discover community ratings, personal taste logs, and experiences of ${dish.name} on MORS.`,
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

        {/* Dish Hero Header */}
        <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" label="CANONICAL DISH" selected />
              {dish.cuisine && (
                <Chip size="sm" label={dish.cuisine} />
              )}
            </div>

            <SaveToCollectionButton
              itemType="dish"
              targetId={dish.id}
              itemTitle={dish.name}
            />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            {dish.name}
          </h1>

          {dish.description && (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {dish.description}
            </p>
          )}
        </header>

        {/* Non-Negotiable Split: Community Consensus vs Personal Taste */}
        <section className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Community Consensus Card */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Community Consensus
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">Public Only</span>
            </div>

            {dish.stats.publicRatingCount >= 3 ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl font-bold text-[var(--text-primary)]">
                    {communityDisplayRating}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] font-medium">/ 5.0</span>
                </div>

                {dish.stats.publicRatingAvg && (
                  <RatingStars
                    value={Math.round(dish.stats.publicRatingAvg)}
                    size="md"
                    label="Community aggregate rating"
                  />
                )}

                <p className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                  Based on <strong>{dish.stats.publicRatingCount}</strong> public ratings across{' '}
                  <strong>{dish.stats.publicExperienceCount}</strong> dining occasions.
                </p>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="font-display text-base font-medium text-[var(--text-primary)]">
                  Not Enough Ratings Yet
                </p>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                  {dish.stats.publicRatingCount === 0
                    ? 'No public ratings logged yet. Be the first to log and rate this dish!'
                    : `Currently has ${dish.stats.publicRatingCount} public rating. At least 3 ratings are required before community consensus is calculated to protect cook privacy.`}
                </p>
              </div>
            )}
          </div>

          {/* 2. Personal Taste Card (Never mixed with community) */}
          <div className="rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--accent-subtle)]/30 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                Your Personal Taste
              </span>
              <span className="text-xs font-mono text-[var(--accent-primary)]">Private to You</span>
            </div>

            {dish.viewerPersonal ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl font-bold text-[var(--text-primary)]">
                    {dish.viewerPersonal.latestRating
                      ? (dish.viewerPersonal.latestRating / 2).toFixed(1)
                      : 'Logged'}
                  </span>
                  {dish.viewerPersonal.latestRating && (
                    <span className="text-sm text-[var(--text-muted)] font-medium">
                      latest score
                    </span>
                  )}
                </div>

                {dish.viewerPersonal.latestRating && (
                  <RatingStars
                    value={dish.viewerPersonal.latestRating}
                    size="md"
                    label="Your latest rating"
                  />
                )}

                <p className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                  You have logged this dish{' '}
                  <strong>{dish.viewerPersonal.experienceCount}</strong>{' '}
                  {dish.viewerPersonal.experienceCount === 1 ? 'time' : 'times'} in your personal archive.
                </p>
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  You have not logged {dish.name} yet.
                </p>
                <Link
                  href="/"
                  className="inline-block rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Log This Dish
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Public Experiences Feed for This Dish */}
        <section className="my-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              Public Community Logs ({dish.recentExperiences.length})
            </h2>
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
                    </div>
                  </div>

                  {exp.note && (
                    <p className="text-xs text-[var(--text-secondary)] italic max-w-sm truncate">
                      &quot;{exp.note}&quot;
                    </p>
                  )}

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
