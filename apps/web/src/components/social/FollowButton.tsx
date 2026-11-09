'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { followUser, unfollowUser } from '@/app/social/actions';

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing?: boolean;
  initialPending?: boolean;
  size?: 'sm' | 'md';
  onStateChange?: (newState: { isFollowing: boolean; isPending: boolean }) => void;
}

export function FollowButton({
  targetUserId,
  initialFollowing = false,
  initialPending = false,
  size = 'sm',
  onStateChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, setIsPending] = useState(initialPending);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = async () => {
    setLoading(true);

    if (isFollowing || isPending) {
      // Unfollow
      const res = await unfollowUser(targetUserId);
      if (res.success) {
        setIsFollowing(false);
        setIsPending(false);
        onStateChange?.({ isFollowing: false, isPending: false });
      }
    } else {
      // Follow
      const res = await followUser(targetUserId);
      if (res.success) {
        if (res.status === 'pending') {
          setIsPending(true);
          setIsFollowing(false);
          onStateChange?.({ isFollowing: false, isPending: true });
        } else {
          setIsFollowing(true);
          setIsPending(false);
          onStateChange?.({ isFollowing: true, isPending: false });
        }
      }
    }

    setLoading(false);
  };

  if (isPending) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleToggle}
        isLoading={loading}
        className="border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--semantic-error)] hover:text-[var(--semantic-error)]"
      >
        Requested
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant="secondary"
        size={size}
        onClick={handleToggle}
        isLoading={loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={isHovered ? 'border-[var(--semantic-error)]/40 text-[var(--semantic-error)]' : ''}
      >
        {isHovered ? 'Unfollow' : 'Following'}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      onClick={handleToggle}
      isLoading={loading}
    >
      Follow
    </Button>
  );
}
