import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';
import { SearchClientView } from '@/components/search/SearchClientView';
import { SearchSkeleton } from '@/components/ui/skeletons/LayoutSkeletons';
import { RenderingIndicator } from '@/components/ui/RenderingIndicator';

export const metadata: Metadata = {
  title: 'Search | MORS',
  description: 'Search dishes, places, food journals, curators, and collections on MORS.',
};

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="space-y-4 max-w-3xl">
            <RenderingIndicator stage="fetching" variant="compact" customLabel="Loading taste search…" />
            <SearchSkeleton />
          </div>
        }
      >
        <SearchClientView />
      </Suspense>
    </AppShell>
  );
}
