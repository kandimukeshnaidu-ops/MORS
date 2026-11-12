'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { ExperienceCard } from '@/components/ui/ExperienceCard';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { LogModal } from '@/components/log/LogModal';
import { PeopleToFollow } from '@/components/social/PeopleToFollow';
import { FOOD_CATEGORIES } from '@mors/domain';
import {
  getHomeFeed,
  getTasteAlignedProfiles,
  type FeedItem,
  type SuggestedProfile,
} from '@/app/social/actions';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Live Feed & Suggestions State
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<{ publishedAt: string; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestedProfiles, setSuggestedProfiles] = useState<SuggestedProfile[]>([]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const res = await getHomeFeed(null, 15);
    setFeedItems(res.items);
    setNextCursor(res.nextCursor);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed();
    getTasteAlignedProfiles(4).then(setSuggestedProfiles);
  }, [loadFeed]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);

    const res = await getHomeFeed(nextCursor, 15);
    setFeedItems((prev) => [...prev, ...res.items]);
    setNextCursor(res.nextCursor);
    setLoadingMore(false);
  };

  // Filter items by selectedCategory if active
  const filteredFeed = selectedCategory
    ? feedItems.filter((item) => item.categorySlug === selectedCategory)
    : feedItems;

  return (
    <AppShell onOpenLog={() => setIsLogModalOpen(true)}>
      <div className="space-y-6">
        {/* Editorial Sub-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Chronological Feed
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Experiences from cooks and eaters you follow. Places optional, home cooking celebrated.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dev/ui">
              <Button variant="secondary" size="sm">
                /dev/ui Gallery
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => setIsLogModalOpen(true)}>
              + Quick Log
            </Button>
          </div>
        </div>

        {/* Filter Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Chip
            label="All"
            selected={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
          />
          {FOOD_CATEGORIES.map((cat) => (
            <Chip
              key={cat.slug}
              label={cat.label}
              selected={selectedCategory === cat.slug}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)
              }
            />
          ))}
        </div>

        {/* Feed Stream */}
        <div className="space-y-6 max-w-xl">
          {loading ? (
            <div className="space-y-4">
              <div className="h-48 rounded-2xl bg-[var(--bg-surface)] animate-pulse" />
              <div className="h-48 rounded-2xl bg-[var(--bg-surface)] animate-pulse" />
            </div>
          ) : filteredFeed.length > 0 ? (
            filteredFeed.map((exp) => (
              <div key={exp.id} className="relative">
                <ExperienceCard
                  id={exp.id}
                  author={{
                    username: exp.author.username,
                    displayName: exp.author.displayName || exp.author.username,
                    avatarUrl: exp.author.avatarUrl || undefined,
                  }}
                  title={exp.title || exp.dishes[0]?.name || 'Food Experience'}
                  category={exp.categorySlug}
                  placeName={exp.placeName || undefined}
                  overallRating={exp.overallRating || undefined}
                  date={new Date(exp.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  description={exp.description || undefined}
                  photos={
                    exp.primaryPhotoUrl
                      ? [{ url: exp.primaryPhotoUrl, altText: exp.title || undefined }]
                      : []
                  }
                  dishes={exp.dishes.map((d) => ({
                    name: d.name,
                    rating: d.rating || undefined,
                  }))}
                  likesCount={exp.likesCount}
                  commentsCount={exp.commentsCount}
                  isLikedByViewer={exp.isLikedByViewer}
                />
              </div>
            ))
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center space-y-3">
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  Your feed is waiting for delicious stories
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  Follow food lovers and home cooks to see their chronological meal updates here, or log your own experiences!
                </p>
                <div className="pt-2">
                  <Button variant="primary" size="sm" onClick={() => setIsLogModalOpen(true)}>
                    Log Your First Meal
                  </Button>
                </div>
              </div>

              {/* Cold-Start Recommendations */}
              {suggestedProfiles.length > 0 && (
                <PeopleToFollow profiles={suggestedProfiles} />
              )}
            </div>
          )}

          {/* Load More Button for Keyset Pagination */}
          {nextCursor && !loading && (
            <div className="pt-4 text-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadMore}
                isLoading={loadingMore}
                className="w-full sm:w-auto px-6"
              >
                Load earlier stories
              </Button>
            </div>
          )}
        </div>

        {/* Full Interactive Food Log Modal */}
        <LogModal
          isOpen={isLogModalOpen}
          onClose={() => {
            setIsLogModalOpen(false);
            loadFeed();
          }}
        />
      </div>
    </AppShell>
  );
}
