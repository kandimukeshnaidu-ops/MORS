'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { performModerationAction, type PendingReportItem } from '@/app/admin/actions';

interface ModerationQueueClientProps {
  initialReports: PendingReportItem[];
}

export function ModerationQueueClient({ initialReports }: ModerationQueueClientProps) {
  const [reports, setReports] = useState<PendingReportItem[]>(initialReports);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAction = async (
    reportId: string,
    action: 'dismiss' | 'delete_content' | 'warn_user' | 'suspend_user'
  ) => {
    setLoadingId(reportId);
    setErrorMsg(null);

    const res = await performModerationAction(reportId, action);
    setLoadingId(null);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  if (reports.length === 0) {
    return (
      <EmptyState
        title="Moderation Queue is Clean"
        description="There are currently zero pending abuse reports requiring operator review."
      />
    );
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)] border border-[var(--border-subtle)]">
                  {report.targetType}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  Reported by @{report.reporterUsername}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {new Date(report.createdAt).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-[var(--text-primary)] block">
                Reason: {report.reason}
              </span>
              {report.details && (
                <p className="mt-1 text-xs text-[var(--text-secondary)] italic">
                  &ldquo;{report.details}&rdquo;
                </p>
              )}
              <span className="mt-2 block font-mono text-[10px] text-[var(--text-muted)]">
                Target ID: {report.targetId}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="ghost"
                size="sm"
                isLoading={loadingId === report.id}
                onClick={() => handleAction(report.id, 'dismiss')}
              >
                Dismiss
              </Button>
              <Button
                variant="secondary"
                size="sm"
                isLoading={loadingId === report.id}
                onClick={() => handleAction(report.id, 'warn_user')}
              >
                Warn Creator
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30"
                isLoading={loadingId === report.id}
                onClick={() => handleAction(report.id, 'delete_content')}
              >
                Delete Content
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
