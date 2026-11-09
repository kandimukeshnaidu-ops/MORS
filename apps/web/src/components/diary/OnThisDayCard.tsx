'use client';

import 'react';
import Link from 'next/link';
import { RatingStars } from '@/components/ui/RatingStars';
import type { OnThisDayMemory } from '@/app/diary/actions';

interface OnThisDayCardProps {
  memory: OnThisDayMemory;
}

export function OnThisDayCard({ memory }: OnThisDayCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
        <span>✨</span>
        <span>On this day ({memory.yearsAgo} {memory.yearsAgo === 1 ? 'year' : 'years'} ago)</span>
      </div>

      <div className="flex items-center gap-4">
        {memory.thumbnailUrl && (
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={memory.thumbnailUrl}
              alt={memory.dishName}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <Link
            href={`/e/${memory.experienceId}`}
            className="font-display text-base font-semibold text-[var(--text-primary)] hover:underline block truncate"
          >
            {memory.title || memory.dishName}
          </Link>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
            {memory.dishName}
          </p>
          {memory.rating && (
            <div className="mt-1">
              <RatingStars value={memory.rating} size="sm" />
            </div>
          )}
        </div>

        <Link
          href={`/e/${memory.experienceId}`}
          className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
        >
          View
        </Link>
      </div>
    </div>
  );
}
