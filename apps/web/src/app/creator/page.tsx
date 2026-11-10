import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/shell/AppShell';

export const metadata: Metadata = {
  title: 'Creator Analytics | MORS — Private Reach & Journal Impact',
  description: 'Private 30-day reach, saves, and reader consensus metrics for your published food journal.',
};

export default async function CreatorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/creator');
  }

  const { data: analytics } = await supabase.rpc('get_creator_analytics', {
    p_profile_id: user.id,
  });

  const dailyReach = analytics?.daily_reach || [];
  const maxDayViews = Math.max(...dailyReach.map((d) => d.views), 1);

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl pb-16">
        {/* Header */}
        <header className="space-y-1 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)]">
              Author Reach
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
              Strictly Private • No Cross-User Comparison
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Creator Analytics (Last 30 Days)
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Understand how readers and cooks engage with your published food entries.
          </p>
        </header>

        {/* 30-Day Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <span className="text-[11px] font-mono uppercase text-[var(--text-muted)]">
              Total Entry Views
            </span>
            <div className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">
              {analytics?.total_views_30d ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Deduped public visits to your entries.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <span className="text-[11px] font-mono uppercase text-[var(--text-muted)]">
              Collection Saves
            </span>
            <div className="mt-1 font-display text-2xl font-bold text-[var(--accent-primary)]">
              {analytics?.total_saves_30d ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Times meals were bookmarked into lists.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <span className="text-[11px] font-mono uppercase text-[var(--text-muted)]">
              Appreciations
            </span>
            <div className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">
              {analytics?.total_likes_30d ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Community likes on published meals.
            </p>
          </div>
        </div>

        {/* 30-Day Reach Histogram & Accessible Data Table */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Daily Readership Cadence
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Past 30 Days
            </span>
          </div>

          {dailyReach.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic py-6 text-center">
              No daily analytics recorded yet. Views and saves accumulate as readers open your journal.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Visual Histogram */}
              <div className="flex items-end justify-between gap-1 h-24 pt-4" aria-hidden="true">
                {dailyReach.map((d) => {
                  const heightPercent = Math.max(8, Math.round((d.views / maxDayViews) * 100));
                  return (
                    <div
                      key={d.day}
                      className="flex-1 flex flex-col items-center h-full justify-end group"
                    >
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t bg-[var(--accent-primary)]/40 group-hover:bg-[var(--accent-primary)] transition-all"
                        title={`${d.day}: ${d.views} views, ${d.saves} saves`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Accessible Data Table for Screen Readers */}
              <table className="sr-only">
                <caption>30-Day Daily Readership Analytics</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Views</th>
                    <th scope="col">Saves</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyReach.map((d) => (
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td>{d.views}</td>
                      <td>{d.saves}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
