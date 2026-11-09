import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';
import { SearchClientView } from '@/components/search/SearchClientView';

export const metadata: Metadata = {
  title: 'Search | MORS',
  description: 'Search dishes, places, food journals, curators, and collections on MORS.',
};

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)] font-mono">Loading search...</div>}>
        <SearchClientView />
      </Suspense>
    </AppShell>
  );
}
