'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  getUserCollections,
  addItemToCollection,
  getOrCreateWishlist,
  type CollectionSummary,
} from '@/app/collections/actions';
import { CreateCollectionModal } from './CreateCollectionModal';

interface SaveToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'experience' | 'dish' | 'place';
  targetId: string;
  itemTitle: string;
}

export function SaveToCollectionModal({
  isOpen,
  onClose,
  itemType,
  targetId,
  itemTitle,
}: SaveToCollectionModalProps) {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [selectedCollId, setSelectedCollId] = useState<string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const loadCollections = async () => {
    setLoading(true);
    const userColls = await getUserCollections();
    setCollections(userColls);
    if (userColls.length > 0 && !selectedCollId) {
      setSelectedCollId(userColls[0].id);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollId) return;

    setSubmitting(true);
    setError(null);

    const res = await addItemToCollection(selectedCollId, {
      itemType,
      targetId,
      note,
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setNote('');
        onClose();
      }, 1200);
    }
  };

  const handleQuickSaveWishlist = async () => {
    setSubmitting(true);
    const resWishlist = await getOrCreateWishlist();
    if (resWishlist.error || !resWishlist.wishlistId) {
      setError(resWishlist.error || 'Failed to access wishlist');
      setSubmitting(false);
      return;
    }

    const res = await addItemToCollection(resWishlist.wishlistId, {
      itemType,
      targetId,
      note,
    });

    setSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setNote('');
        onClose();
      }, 1200);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Save to Collection">
        {saved ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-2xl">✨</div>
            <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Saved to Collection
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Added &ldquo;{itemTitle}&rdquo; successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-[var(--danger-bg)] text-[var(--danger-text)] rounded border border-[var(--border-subtle)]">
                {error}
              </div>
            )}

            <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-mono">
                  Target {itemType}
                </span>
                <p className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[220px]">
                  {itemTitle}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickSaveWishlist}
                disabled={submitting}
              >
                ★ Want to try
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Choose Collection
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="text-xs text-[var(--accent-primary)] hover:underline"
                >
                  + New Collection
                </button>
              </div>

              {loading ? (
                <div className="py-3 text-xs text-[var(--text-muted)]">Loading collections...</div>
              ) : collections.length === 0 ? (
                <div className="p-3 text-xs text-[var(--text-muted)] text-center border border-dashed border-[var(--border-subtle)] rounded">
                  No collections yet.{' '}
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(true)}
                    className="text-[var(--accent-primary)] hover:underline"
                  >
                    Create your first one!
                  </button>
                </div>
              ) : (
                <select
                  value={selectedCollId}
                  onChange={(e) => setSelectedCollId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isWishlist ? '(Wishlist)' : ''} ({c.visibility})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Personal Note (Optional)
              </label>
              <textarea
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why are you collecting this? (e.g. Try with double masala)"
                className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                disabled={!selectedCollId || collections.length === 0}
              >
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <CreateCollectionModal
        isOpen={isCreatingNew}
        onClose={() => setIsCreatingNew(false)}
        onCreated={(newId) => {
          loadCollections().then(() => setSelectedCollId(newId));
        }}
      />
    </>
  );
}
