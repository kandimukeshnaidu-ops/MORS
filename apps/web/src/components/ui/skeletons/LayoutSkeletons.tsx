'use client';

import React from 'react';
import { Skeleton } from '../Skeleton';

/**
 * Skeleton accurately matching ExperienceCard layout and dimensions.
 */
export function ExperienceCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4"
    >
      {/* Author and Metadata Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="h-9 w-9" />
          <div className="space-y-1.5">
            <Skeleton variant="text" className="h-3.5 w-28" />
            <Skeleton variant="text" className="h-2.5 w-20" />
          </div>
        </div>
        <Skeleton variant="rect" className="h-6 w-16 rounded-full" />
      </div>

      {/* Title & Description */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-3.5 w-full" />
        <Skeleton variant="text" className="h-3.5 w-4/5" />
      </div>

      {/* Photo Placeholder */}
      <Skeleton variant="rect" className="w-full aspect-[4/3] rounded-xl" />

      {/* Dishes & Tags Row */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton variant="rect" className="h-6 w-24 rounded-full" />
        <Skeleton variant="rect" className="h-6 w-20 rounded-full" />
        <Skeleton variant="rect" className="h-6 w-16 rounded-full" />
      </div>

      {/* Social Actions Row */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <Skeleton variant="text" className="h-4 w-12" />
          <Skeleton variant="text" className="h-4 w-12" />
        </div>
        <Skeleton variant="text" className="h-4 w-8" />
      </div>
    </div>
  );
}

/**
 * Feed Skeleton stream with multiple ExperienceCards.
 */
export function FeedSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-6 max-w-xl" aria-label="Loading feed items">
      {Array.from({ length: count }).map((_, i) => (
        <ExperienceCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Diary Timeline Skeleton matching keyset chronological diary view.
 */
export function DiaryTimelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6 max-w-3xl" aria-label="Loading diary timeline">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <Skeleton variant="text" className="h-4 w-32" />
            <Skeleton variant="rect" className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-start gap-4">
            <Skeleton variant="rect" className="h-20 w-20 rounded-xl flex-shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton variant="text" className="h-4 w-1/2" />
              <Skeleton variant="text" className="h-3 w-3/4" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton variant="rect" className="h-4 w-12 rounded" />
                <Skeleton variant="text" className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Collections List Skeleton matching collections grid.
 */
export function CollectionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Loading collections">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="h-5 w-36" />
            <Skeleton variant="rect" className="h-4 w-10 rounded-full" />
          </div>
          <Skeleton variant="text" className="h-3.5 w-full" />
          <Skeleton variant="text" className="h-3.5 w-2/3" />
          <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
            <Skeleton variant="text" className="h-3 w-16" />
            <Skeleton variant="text" className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Calendar Month Skeleton matching calendar month grid.
 */
export function CalendarMonthSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <Skeleton variant="text" className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton variant="rect" className="h-7 w-7 rounded-lg" />
          <Skeleton variant="rect" className="h-7 w-7 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Comments Skeleton matching post comments stream.
 */
export function CommentsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-label="Loading comments">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-surface)]">
          <Skeleton variant="circle" className="h-7 w-7 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton variant="text" className="h-3 w-24" />
              <Skeleton variant="text" className="h-2.5 w-16" />
            </div>
            <Skeleton variant="text" className="h-3.5 w-full" />
            <Skeleton variant="text" className="h-3.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Search Results Skeleton matching search page tabs and results.
 */
export function SearchSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl" aria-label="Loading search results">
      <div className="flex gap-2 border-b border-[var(--border-subtle)] pb-2">
        <Skeleton variant="rect" className="h-8 w-20 rounded-full" />
        <Skeleton variant="rect" className="h-8 w-20 rounded-full" />
        <Skeleton variant="rect" className="h-8 w-20 rounded-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
          >
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" className="h-9 w-9" />
              <div className="space-y-1.5">
                <Skeleton variant="text" className="h-4 w-32" />
                <Skeleton variant="text" className="h-3 w-24" />
              </div>
            </div>
            <Skeleton variant="rect" className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
