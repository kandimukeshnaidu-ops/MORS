'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createCollection } from '@/app/collections/actions';
import type { CollectionVisibility } from '@mors/db';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (collectionId: string) => void;
}

export function CreateCollectionModal({
  isOpen,
  onClose,
  onCreated,
}: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<CollectionVisibility>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const res = await createCollection({
      name,
      description,
      visibility,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.id) {
      setName('');
      setDescription('');
      setVisibility('public');
      onCreated?.(res.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Collection">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-[var(--danger-bg)] text-[var(--danger-text)] rounded border border-[var(--border-subtle)]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Collection Name
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hyderabad's Quintessential Biryanis"
            className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What brings these food experiences together?"
            className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Visibility
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'public', label: 'Public', desc: 'Everyone can discover' },
              { id: 'unlisted', label: 'Unlisted', desc: 'Anyone with secret link' },
              { id: 'private', label: 'Private', desc: 'Only you can view' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVisibility(opt.id as CollectionVisibility)}
                className={`p-2.5 text-left border rounded transition-colors ${
                  visibility === opt.id
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--border-muted)]'
                }`}
              >
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  {opt.label}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-tight">
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} disabled={!name.trim()}>
            Create Collection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
