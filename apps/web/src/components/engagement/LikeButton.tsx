'use client';

import React, { useState } from 'react';
import { toggleLike } from '@/app/engagement/actions';

interface LikeButtonProps {
  experienceId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'sm' | 'md';
}

export function LikeButton({
  experienceId,
  initialLiked = false,
  initialCount = 0,
  size = 'md',
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    // Optimistic toggle
    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setLiked(nextLiked);
    setCount(nextCount);
    setLoading(true);

    const result = await toggleLike(experienceId);
    setLoading(false);

    if ('error' in result) {
      // Revert on error
      setLiked(prevLiked);
      setCount(prevCount);
    } else {
      setLiked(result.liked);
      setCount(result.count);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all active:scale-95 ${
        liked
          ? 'border-[var(--semantic-error)]/40 bg-[var(--semantic-error)]/10 text-[var(--semantic-error)]'
          : 'border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
      } ${isSmall ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'}`}
      title={liked ? 'Unlike' : 'Like'}
    >
      <svg
        className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'}
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span className="font-mono font-medium">{count}</span>
    </button>
  );
}
