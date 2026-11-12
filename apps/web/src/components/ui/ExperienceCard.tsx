'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RatingStars } from './RatingStars';
import { Avatar } from './Avatar';
import { Chip } from './Chip';
import { LikeButton } from '@/components/engagement/LikeButton';

export interface ExperienceCardProps {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  title?: string | null;
  category: string;
  placeName?: string | null;
  overallRating?: number | null;
  description?: string | null;
  date: string;
  photos?: Array<{
    url: string;
    altText?: string;
  }>;
  dishes: Array<{
    name: string;
    rating?: number | null;
  }>;
  likesCount?: number;
  commentsCount?: number;
  isLikedByViewer?: boolean;
}

export function ExperienceCard({
  id,
  author,
  title,
  category,
  placeName,
  overallRating,
  description,
  date,
  photos = [],
  dishes = [],
  likesCount = 0,
  commentsCount = 0,
  isLikedByViewer = false,
}: ExperienceCardProps) {
  const [copied, setCopied] = useState(false);
  const primaryPhoto = photos[0];

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/e/${id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all hover:border-[var(--border-strong)] shadow-xs">
      {/* Header: Author + Meta */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <Link
          href={`/u/${author.username}`}
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
        >
          <Avatar
            src={author.avatarUrl}
            alt={author.displayName}
            size="sm"
            fallbackText={author.displayName}
          />
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              {author.displayName}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              @{author.username}
            </div>
          </div>
        </Link>
        <div className="text-right">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {date}
          </span>
        </div>
      </div>

      {/* Large Food Photography */}
      {primaryPhoto && (
        <div className="relative aspect-4/3 w-full overflow-hidden bg-[var(--bg-elevated)]">
          <img
            src={primaryPhoto.url}
            alt={primaryPhoto.altText || title || 'Food experience photo'}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-102"
            loading="lazy"
          />
          {photos.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-md bg-[var(--bg-primary)]/80 backdrop-blur-sm px-2 py-0.5 text-[11px] font-mono text-[var(--text-primary)]">
              1/{photos.length}
            </span>
          )}
        </div>
      )}

      {/* Content Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {title && (
              <h2 className="font-display text-lg font-medium text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Chip label={category} size="sm" />
              {placeName && (
                <span className="text-xs text-[var(--text-secondary)]">
                  at <span className="font-medium text-[var(--text-primary)]">{placeName}</span>
                </span>
              )}
            </div>
          </div>
          {overallRating && (
            <RatingStars value={overallRating} size="sm" label="Overall rating" />
          )}
        </div>

        {description && (
          <p className="mt-2.5 text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {/* Dishes List */}
        {dishes.length > 0 && (
          <div className="mt-3.5 space-y-1.5 border-t border-[var(--border-subtle)] pt-3">
            {dishes.map((dish, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-0.5"
              >
                <span className="font-medium text-[var(--text-primary)]">
                  {dish.name}
                </span>
                {dish.rating && (
                  <RatingStars value={dish.rating} size="sm" label={`${dish.name} rating`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Social Actions Footer */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-2.5 bg-[var(--bg-elevated)]/30">
        <div className="flex items-center gap-2">
          <LikeButton
            experienceId={id}
            initialLiked={isLikedByViewer}
            initialCount={likesCount}
            size="sm"
          />

          <Link
            href={`/e/${id}#comments`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
            title="View discussion"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.636 1.05.502 1.664l-.45 2.067a.75.75 0 00.912.885l2.42-.646a2.25 2.25 0 011.396.11c.626.262 1.28.39 1.947.39z"
              />
            </svg>
            <span className="font-mono font-medium">{commentsCount}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
            title="Share link"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.933 2.185 2.25 2.25 0 00-3.933-2.185zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>

          <Link
            href={`/e/${id}`}
            className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
            title="View full experience"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
