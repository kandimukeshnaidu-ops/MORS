'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  removeItemFromCollection,
  type CollectionItemDetail,
} from '@/app/collections/actions';

interface CollectionItemCardProps {
  item: CollectionItemDetail;
  collectionId: string;
  isOwner: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemoved?: (itemId: string) => void;
}

export function CollectionItemCard({
  item,
  collectionId,
  isOwner,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemoved,
}: CollectionItemCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleRemove = async () => {
    if (!confirm('Remove this item from the collection?')) return;
    setDeleting(true);
    const res = await removeItemFromCollection(item.id, collectionId);
    setDeleting(false);
    if (res.success) {
      onRemoved?.(item.id);
    }
  };

  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded hover:border-[var(--border-muted)] transition-colors gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-sm">
          {item.itemType === 'dish' && '🍲'}
          {item.itemType === 'place' && '📍'}
          {item.itemType === 'experience' && '✨'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[var(--accent-primary)] font-mono">
              {item.itemType}
            </span>
          </div>

          {item.itemType === 'dish' && item.dish && (
            <Link
              href={`/dish/${item.dish.slug}`}
              className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors block truncate"
            >
              {item.dish.canonicalName}
            </Link>
          )}

          {item.itemType === 'place' && item.place && (
            <Link
              href={`/place/${item.place.id}`}
              className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors block truncate"
            >
              {item.place.name}
              {item.place.city && (
                <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">
                  · {item.place.city}
                </span>
              )}
            </Link>
          )}

          {item.itemType === 'experience' && item.experience && (
            <div>
              <Link
                href={`/e/${item.experience.id}`}
                className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors block truncate"
              >
                {item.experience.title || 'Food Experience'}
              </Link>
              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                <span>by @{item.experience.author.username}</span>
                {item.experience.rating && (
                  <span>★ {(item.experience.rating / 2).toFixed(1)}</span>
                )}
              </div>
            </div>
          )}

          {item.note && (
            <p className="mt-2 text-xs italic text-[var(--text-secondary)] pl-2.5 border-l-2 border-[var(--accent-muted)]">
              &ldquo;{item.note}&rdquo;
            </p>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            aria-label="Move item up"
            className="p-1.5 text-xs rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ▲
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            aria-label="Move item down"
            className="p-1.5 text-xs rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ▼
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleRemove}
            aria-label="Remove item"
            className="p-1.5 text-xs rounded border border-transparent text-[var(--text-muted)] hover:text-[var(--danger-text)] transition-colors ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
