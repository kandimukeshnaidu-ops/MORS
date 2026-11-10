import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ModerationQueueClient } from '@/components/admin/ModerationQueueClient';
import { getViewerModerationRole, getPendingReports } from './actions';

export const metadata: Metadata = {
  title: 'Moderation Console — MORS',
  description: 'Operator moderation queue for community abuse reports and safety enforcement.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminModerationPage() {
  const { isModerator } = await getViewerModerationRole();

  // Non-Negotiable #6: Hidden and nonexistent look identical (return 404, never 403)
  if (!isModerator) {
    notFound();
  }

  const reports = await getPendingReports();

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl pb-16">
        <header className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)]">
            Safety & Compliance
          </span>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Moderation Queue
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Review reported eating experiences, comments, and creator profiles. All actions are audited.
          </p>
        </header>

        <ModerationQueueClient initialReports={reports} />
      </div>
    </AppShell>
  );
}
