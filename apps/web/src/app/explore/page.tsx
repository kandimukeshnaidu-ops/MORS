import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { FollowButton } from '@/components/social/FollowButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getExploreData } from './actions';

export const metadata: Metadata = {
  title: 'Explore | MORS — Authentic Food Experiences & Tastemakers',
  description:
    'Discover trending home cooking, beloved dining spots, and community tastemakers curated by real eating logs.',
};

export default async function ExplorePage() {
  const { trendingExperiences, spotlightCollections, suggestedTastemakers } = await getExploreData(20);

  return (
    <AppShell>
      <div className="space-y-10 max-w-4xl pb-16">
        {/* Header */}
        <header className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)]">
            Consensus & Discovery
          </span>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Explore MORS
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Time-decayed trending meals, community collections, and cook profiles.
          </p>
        </header>

        {/* 1. Trending Experiences */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Trending Experiences
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Ranked by community resonance
            </span>
          </div>

          {trendingExperiences.length === 0 ? (
            <EmptyState
              title="Explore is Warming Up"
              description="As cooks across MORS log meals, rate dishes, and discuss flavors, trending experiences will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendingExperiences.map((item) => (
                <Link
                  key={item.id}
                  href={`/e/${item.id}`}
                  className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-all hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-elevated)] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Primary Photo if available */}
                    {item.photoUrl && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--bg-elevated)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.photoUrl}
                          alt={item.title || 'Food experience photo'}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                        />
                      </div>
                    )}

                    {/* Author & Rating Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={item.author.avatarPath}
                          alt={item.author.displayName || item.author.username}
                          size="sm"
                          fallbackText={item.author.displayName || item.author.username}
                        />
                        <div className="truncate text-xs">
                          <span className="font-medium text-[var(--text-primary)]">
                            {item.author.displayName || item.author.username}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                            @{item.author.username}
                          </span>
                        </div>
                      </div>

                      {item.overallRating && (
                        <div className="flex items-center gap-1 rounded bg-[var(--bg-primary)] px-2 py-0.5 border border-[var(--border-subtle)] text-xs font-mono text-[var(--accent-primary)]">
                          <span>★</span>
                          <span>{(item.overallRating / 2).toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Title & Cuisine */}
                    <div>
                      <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                        {item.title || 'Untitled Food Experience'}
                      </h3>
                      {item.cuisine && (
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {item.cuisine}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Social Counters */}
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-[11px] text-[var(--text-muted)] font-mono">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-rose-500/80" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                        {item.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {item.commentsCount}
                      </span>
                    </div>
                    <span>{new Date(item.eatenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 2. Spotlight Collections */}
        {spotlightCollections.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Spotlight Collections
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Themed culinary archives curated by cooks.
                </p>
              </div>
              <Link
                href="/collections"
                className="text-xs text-[var(--accent-primary)] hover:underline font-mono"
              >
                Browse all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {spotlightCollections.map((col) => (
                <Link
                  key={col.id}
                  href={`/c/${col.id}`}
                  className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-all hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-elevated)] flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)]">
                      Collection
                    </span>
                    <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                      {col.name}
                    </h3>
                    {col.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                        {col.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-[11px] text-[var(--text-muted)] font-mono">
                    <span>{col.author?.username ? `@${col.author.username}` : ''}</span>
                    <span>{col.itemsCount} {col.itemsCount === 1 ? 'item' : 'items'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 3. Tastemakers to Follow */}
        {suggestedTastemakers.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-[var(--border-subtle)]">
            <div>
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Tastemakers & Cooks
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Active food diarists sharing genuine taste recommendations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestedTastemakers.map((cook) => (
                <div
                  key={cook.id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex items-center justify-between gap-3"
                >
                  <Link href={`/u/${cook.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar
                      src={cook.avatarPath}
                      alt={cook.displayName || cook.username}
                      size="md"
                      fallbackText={cook.displayName || cook.username}
                    />
                    <div className="min-w-0">
                      <h4 className="font-display text-sm font-semibold text-[var(--text-primary)] truncate hover:text-[var(--accent-primary)] transition-colors">
                        {cook.displayName || cook.username}
                      </h4>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                        @{cook.username}
                      </span>
                      {cook.bio && (
                        <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-[200px]">
                          {cook.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  <FollowButton
                    targetUserId={cook.id}
                    initialFollowing={false}
                    initialPending={false}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
