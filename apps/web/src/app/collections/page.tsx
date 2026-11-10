'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateCollectionModal } from '@/components/collections/CreateCollectionModal';
import { BufferingContainer } from '@/components/ui/BufferingContainer';
import { CollectionListSkeleton } from '@/components/ui/skeletons/LayoutSkeletons';
import {
  getUserCollections,
  getPublicCollections,
  type CollectionSummary,
} from '@/app/collections/actions';

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<'mine' | 'explore'>('mine');
  const [myCollections, setMyCollections] = useState<CollectionSummary[]>([]);
  const [exploreCollections, setExploreCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [mine, publicColls] = await Promise.all([
        getUserCollections(),
        getPublicCollections(),
      ]);
      setMyCollections(mine);
      setExploreCollections(publicColls);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === 'mine' ? myCollections : exploreCollections;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Collections
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Curate, order, and share thematic food journeys and wishlists.
            </p>
          </div>

          <Button onClick={() => setIsModalOpen(true)}>
            + New Collection
          </Button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[var(--border-subtle)] my-6">
          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'mine'
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            My Collections ({myCollections.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'explore'
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Explore Community ({exploreCollections.length})
          </button>
        </div>

        {/* Collections List Buffering Container */}
        <BufferingContainer
          stage={fetchError ? 'error' : loading ? 'fetching' : 'completed'}
          hasBufferedData={currentList.length > 0}
          skeleton={<CollectionListSkeleton count={4} />}
          error={fetchError}
          onRetry={loadData}
        >
          {currentList.length === 0 ? (
            <EmptyState
              icon="📚"
              title={activeTab === 'mine' ? 'No collections yet' : 'No public collections found'}
              description={
                activeTab === 'mine'
                  ? 'Create your first food collection or wishlist to save dishes, places, and experiences.'
                  : 'Be the first to create and share a public culinary collection!'
              }
              actionLabel={activeTab === 'mine' ? 'Create Collection' : undefined}
              onAction={activeTab === 'mine' ? () => setIsModalOpen(true) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentList.map((c) => (
                <Link
                  key={c.id}
                  href={`/c/${c.id}`}
                  className="group block p-5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-muted)] transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {c.isWishlist && (
                        <span className="text-xs text-[var(--accent-primary)]" title="Wishlist">
                          ★
                        </span>
                      )}
                      {c.systemKey === 'saved' && (
                        <span className="text-xs text-[var(--accent-primary)]" title="Saved Collection">
                          🔖
                        </span>
                      )}
                      <h3 className="font-display text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                        {c.name}
                      </h3>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                      {c.visibility}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border-subtle)] mt-auto">
                    <div className="flex items-center gap-3">
                      <span>{c.itemsCount} {c.itemsCount === 1 ? 'item' : 'items'}</span>
                      <span>♥ {c.likesCount}</span>
                    </div>

                    {c.author && (
                      <span className="text-[11px] truncate max-w-[120px]">
                        by @{c.author.username}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </BufferingContainer>
      </div>

      <CreateCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(id) => {
          loadData();
        }}
      />
    </AppShell>
  );
}
