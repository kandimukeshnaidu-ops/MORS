'use client';

import 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { FollowButton } from './FollowButton';
import type { SuggestedProfile } from '@/app/social/actions';

interface PeopleToFollowProps {
  profiles: SuggestedProfile[];
  title?: string;
}

export function PeopleToFollow({
  profiles,
  title = 'Taste Creators to Follow',
}: PeopleToFollowProps) {
  if (profiles.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
          Hyderabad
        </span>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <Link href={`/u/${p.username}`} className="flex items-center gap-2.5 min-w-0">
              <Avatar
                alt={p.displayName || p.username}
                fallbackText={p.displayName || p.username}
                size="sm"
              />
              <div className="min-w-0">
                <span className="block truncate text-xs font-medium text-[var(--text-primary)] hover:underline">
                  {p.displayName || p.username}
                </span>
                <span className="block truncate text-[11px] text-[var(--text-muted)]">
                  @{p.username} • {p.experiencesCount} logs
                </span>
              </div>
            </Link>

            <FollowButton targetUserId={p.id} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
