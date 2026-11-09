'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/client';
import {
  getNotifications,
  markNotificationsAsRead,
  type NotificationItem,
} from '@/app/engagement/actions';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login?redirectTo=/notifications');
      } else {
        getNotifications().then((res) => {
          setNotifications(res);
          setLoading(false);
        });
      }
    });
  }, [router]);

  const handleMarkAllRead = async () => {
    setMarking(true);
    await markNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMarking(false);
  };

  const getNotificationText = (item: NotificationItem) => {
    switch (item.type) {
      case 'like':
        return `liked your food experience "${item.experienceTitle || 'Meal'}"`;
      case 'comment':
        return `commented on your food experience "${item.experienceTitle || 'Meal'}"`;
      case 'follow_request':
        return 'requested to follow your food journal';
      case 'follow_accept':
        return 'accepted your follow request';
      default:
        return 'interacted with your food journal';
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow_request':
        return '👥';
      case 'follow_accept':
        return '✨';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Notifications
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Updates from eaters and cooks following your taste journey.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              isLoading={marking}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
            <div className="h-16 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
            <div className="h-16 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-[var(--border-subtle)] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            {notifications.map((n) => {
              const href = n.experienceId ? `/e/${n.experienceId}` : `/u/${n.actor.username}`;

              return (
                <Link
                  key={n.id}
                  href={href}
                  className={`flex items-center justify-between gap-3 p-4 hover:bg-[var(--bg-primary)] transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                    !n.isRead ? 'bg-[var(--accent-subtle)]/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base flex-shrink-0">{getNotificationIcon(n.type)}</span>

                    <Avatar
                      alt={n.actor.displayName || n.actor.username}
                      fallbackText={n.actor.displayName || n.actor.username}
                      size="sm"
                    />

                    <div className="min-w-0">
                      <p className="text-xs text-[var(--text-primary)] leading-snug truncate">
                        <strong className="font-semibold">
                          {n.actor.displayName || n.actor.username}
                        </strong>{' '}
                        {getNotificationText(n)}
                      </p>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-[var(--accent-primary)] flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="All caught up"
            description="You have no notifications right now. When people like your dishes or follow your journal, updates will appear here."
          />
        )}
      </div>
    </AppShell>
  );
}
