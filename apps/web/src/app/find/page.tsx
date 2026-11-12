import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';
import { SearchClientView } from '@/components/search/SearchClientView';
import { SearchSkeleton } from '@/components/ui/skeletons/LayoutSkeletons';
import { RenderingIndicator } from '@/components/ui/RenderingIndicator';

export const metadata: Metadata = {
  title: 'Find Restaurants & Food | MORS',
  description: 'Find places to eat and discover dishes backed by real community dining logs in Hyderabad and beyond.',
};

export default function FindPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="space-y-4 max-w-3xl mx-auto px-4 py-8">
            <RenderingIndicator stage="fetching" variant="compact" customLabel="Loading taste discovery…" />
            <SearchSkeleton />
          </div>
        }
      >
        <SearchClientView />
      </Suspense>
    </AppShell>
  );
}
