'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { CollectionItemCard } from '@/components/collections/CollectionItemCard';
import {
  toggleCollectionLike,
  deleteCollection,
  reorderCollectionItem,
  type FullCollection,
  type CollectionItemDetail,
} from '@/app/collections/actions';

interface CollectionDetailViewProps {
  collection: FullCollection;
}

export function CollectionDetailView({ collection: initial }: CollectionDetailViewProps) {
  const router = useRouter();
  const [collection, setCollection] = useState<FullCollection>(initial);
  const [items, setItems] = useState<CollectionItemDetail[]>(initial.items);
  const [hasLiked, setHasLiked] = useState(initial.hasLiked || false);
  const [likesCount, setLikesCount] = useState(initial.likesCount);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    // Optimistic update
    const prevLiked = hasLiked;
    const prevCount = likesCount;
    setHasLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    const res = await toggleCollectionLike(collection.id);
    if (res.error) {
      setHasLiked(prevLiked);
      setLikesCount(prevCount);
    } else {
      setHasLiked(res.liked);
      setLikesCount(res.likesCount);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined'
      ? collection.visibility === 'unlisted'
        ? `${window.location.origin}/c/${collection.shareToken}`
        : window.location.href
      : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: collection.name,
          text: collection.description || `Check out ${collection.name} on MORS`,
          url,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share cancelled/rejected
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    const res = await deleteCollection(collection.id);
    if (res.success) {
      router.push('/collections');
    } else {
      alert(res.error || 'Failed to delete collection');
      setDeleting(false);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Calculate new fractional position
    let newPos: number;
    if (direction === 'up') {
      const prevPrev = targetIndex > 0 ? items[targetIndex - 1].position : items[targetIndex].position - 1.0;
      newPos = (prevPrev + items[targetIndex].position) / 2.0;
    } else {
      const nextNext = targetIndex < items.length - 1 ? items[targetIndex + 1].position : items[targetIndex].position + 1.0;
      newPos = (items[targetIndex].position + nextNext) / 2.0;
    }

    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    moved.position = newPos;
    updated.splice(targetIndex, 0, moved);
    setItems(updated);

    await reorderCollectionItem(moved.id, collection.id, newPos);
  };

  const handleRemoved = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setCollection((prev) => ({
      ...prev,
      itemsCount: Math.max(0, prev.itemsCount - 1),
    }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header Card */}
      <div className="p-6 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--accent-primary)]">
              {collection.visibility} collection
            </span>
            {collection.isWishlist && (
              <span className="text-xs text-[var(--accent-primary)] font-medium">
                ★ Wishlist
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLike}
              className={`px-3 py-1.5 rounded text-xs border font-medium flex items-center gap-1.5 transition-colors ${
                hasLiked
                  ? 'border-[var(--danger-text)] text-[var(--danger-text)] bg-[var(--danger-bg)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{hasLiked ? '♥' : '♡'}</span>
              <span>{likesCount}</span>
            </button>

            <Button variant="outline" size="sm" onClick={handleShare}>
              {copied ? '✓ Copied Link' : 'Share'}
            </Button>

            {collection.isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                isLoading={deleting}
                className="text-[var(--danger-text)] hover:bg-[var(--danger-bg)]"
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            {collection.author && (
              <Link
                href={`/u/${collection.author.username}`}
                className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors"
              >
                <Avatar
                  alt={collection.author.displayName || collection.author.username}
                  src={collection.author.avatarPath}
                  size="sm"
                />
                <span className="font-medium text-[var(--text-primary)]">
                  @{collection.author.username}
                </span>
              </Link>
            )}
          </div>

          <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-3">
        <h2 className="font-display text-base font-semibold text-[var(--text-primary)] mb-4">
          Collection Items ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="p-8 text-center rounded border border-dashed border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            This collection is currently empty.
            {collection.isOwner && (
              <p className="mt-1 text-[var(--text-muted)]">
                Save dishes, places, or experiences from their detail pages to add them here!
              </p>
            )}
          </div>
        ) : (
          items.map((item, idx) => (
            <CollectionItemCard
              key={item.id}
              item={item}
              collectionId={collection.id}
              isOwner={collection.isOwner}
              canMoveUp={idx > 0}
              canMoveDown={idx < items.length - 1}
              onMoveUp={() => handleReorder(idx, 'up')}
              onMoveDown={() => handleReorder(idx, 'down')}
              onRemoved={handleRemoved}
            />
          ))
        )}
      </div>
    </div>
  );
}
