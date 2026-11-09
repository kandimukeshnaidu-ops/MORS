'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { FilterBar, type FilterState } from '@/components/diary/FilterBar';
import { TimelineView } from '@/components/diary/TimelineView';
import { CalendarView } from '@/components/diary/CalendarView';
import { OnThisDayCard } from '@/components/diary/OnThisDayCard';
import { LogModal } from '@/components/log/LogModal';
import { createClient } from '@/lib/supabase/client';
import {
  getDiaryEntries,
  getOnThisDayMemory,
  type DiaryEntryItem,
  type OnThisDayMemory,
} from './actions';

function DiaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Authentication State
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Diary Data State
  const [items, setItems] = useState<DiaryEntryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<{ eatenAt: string; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [memory, setMemory] = useState<OnThisDayMemory | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Filters from URL or defaults
  const viewParam = (searchParams.get('view') as 'timeline' | 'calendar') || 'timeline';
  const categoryParam = searchParams.get('category') || 'all';
  const minRatingParam = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : 0;
  const queryParam = searchParams.get('q') || '';
  const statusParam = (searchParams.get('status') as 'all' | 'published' | 'draft') || 'all';
  const dateParam = searchParams.get('date') || null;

  const filters: FilterState = {
    view: viewParam,
    category: categoryParam,
    minRating: minRatingParam,
    query: queryParam,
    status: statusParam,
    dateExact: dateParam,
  };

  // Sync filter changes to URL
  const handleFilterChange = (updated: Partial<FilterState>) => {
    const next = { ...filters, ...updated };
    const sp = new URLSearchParams();

    if (next.view !== 'timeline') sp.set('view', next.view);
    if (next.category !== 'all') sp.set('category', next.category);
    if (next.minRating > 0) sp.set('minRating', String(next.minRating));
    if (next.query.trim()) sp.set('q', next.query.trim());
    if (next.status !== 'all') sp.set('status', next.status);
    if (next.dateExact) sp.set('date', next.dateExact);

    const queryStr = sp.toString();
    router.push(queryStr ? `/diary?${queryStr}` : '/diary');
  };

  // Check auth on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login?redirectTo=/diary');
      } else {
        setUserId(user.id);
        setAuthLoading(false);
        // Fetch "On This Day" memory
        getOnThisDayMemory(user.id).then(setMemory);
      }
    });
  }, [router]);

  // Load Initial Diary Entries
  const fetchInitialEntries = useCallback(async (uid: string) => {
    setLoading(true);
    const res = await getDiaryEntries({
      userId: uid,
      category: categoryParam,
      minRating: minRatingParam,
      query: queryParam,
      status: statusParam !== 'all' ? statusParam : undefined,
      dateExact: dateParam,
      limit: 15,
    });
    setItems(res.items);
    setNextCursor(res.nextCursor);
    setLoading(false);
  }, [categoryParam, minRatingParam, queryParam, statusParam, dateParam]);

  useEffect(() => {
    if (userId) {
      fetchInitialEntries(userId);
    }
  }, [userId, fetchInitialEntries]);

  // Load More (Keyset Pagination)
  const handleLoadMore = async () => {
    if (!userId || !nextCursor || loadingMore) return;
    setLoadingMore(true);

    const res = await getDiaryEntries({
      userId,
      cursor: nextCursor,
      category: categoryParam,
      minRating: minRatingParam,
      query: queryParam,
      status: statusParam !== 'all' ? statusParam : undefined,
      dateExact: dateParam,
      limit: 15,
    });

    setItems((prev) => [...prev, ...res.items]);
    setNextCursor(res.nextCursor);
    setLoadingMore(false);
  };

  if (authLoading) {
    return (
      <AppShell onOpenLog={() => setIsLogModalOpen(true)}>
        <div className="space-y-4 max-w-3xl animate-pulse">
          <div className="h-8 w-48 rounded-xl bg-[var(--bg-surface)]" />
          <div className="h-28 rounded-2xl bg-[var(--bg-surface)]" />
          <div className="h-64 rounded-2xl bg-[var(--bg-surface)]" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell onOpenLog={() => setIsLogModalOpen(true)}>
      <div className="space-y-6 max-w-3xl">
        {/* Diary Title & Subtitle */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Personal Food Diary
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Your taste memory, meals archive, and food timeline.
          </p>
        </div>

        {/* On This Day Memory Card (if available) */}
        {memory && <OnThisDayCard memory={memory} />}

        {/* Filter & View Mode Controls */}
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          isOwner={true}
        />

        {/* View Mode: Timeline vs Calendar */}
        {filters.view === 'calendar' ? (
          userId && (
            <CalendarView
              userId={userId}
              selectedDate={filters.dateExact}
              onSelectDay={(dateStr) => {
                handleFilterChange({ dateExact: dateStr, view: 'timeline' });
              }}
            />
          )
        ) : loading ? (
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-[var(--bg-surface)] animate-pulse" />
            <div className="h-32 rounded-2xl bg-[var(--bg-surface)] animate-pulse" />
          </div>
        ) : (
          <TimelineView
            items={items}
            hasMore={Boolean(nextCursor)}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            onOpenLog={() => setIsLogModalOpen(true)}
          />
        )}

        {/* Log Modal */}
        <LogModal
          isOpen={isLogModalOpen}
          onClose={() => {
            setIsLogModalOpen(false);
            if (userId) fetchInitialEntries(userId);
          }}
        />
      </div>
    </AppShell>
  );
}

export default function DiaryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-primary)] p-8">
          <div className="mx-auto max-w-3xl h-64 rounded-2xl bg-[var(--bg-surface)] animate-pulse" />
        </div>
      }
    >
      <DiaryContent />
    </Suspense>
  );
}
