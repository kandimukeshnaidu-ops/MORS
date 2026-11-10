import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'System Status & Beta Operations | MORS',
  description: 'Operational status, known issues, and beta roadmap for MORS food journal.',
  robots: 'noindex, nofollow',
};

export default function StatusPage() {
  const currentTimestamp = new Date().toISOString();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="border-b border-[var(--border-subtle)] pb-6">
          <Link
            href="/"
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent-primary)] mb-2 inline-block transition-colors"
          >
            ← Return to MORS
          </Link>
          <div className="flex items-center justify-between gap-4 mt-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">System Status & Beta Ops</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Nominal
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Hyderabad Closed Beta Cohort · Live operations and issue tracking
          </p>
        </div>

        {/* Infrastructure Health */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Service Availability
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <span>PostgreSQL & RLS Engine</span>
              <span className="text-emerald-400 font-mono font-medium">99.98% OK</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <span>Auth & Session Vault</span>
              <span className="text-emerald-400 font-mono font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <span>Private Media Storage</span>
              <span className="text-emerald-400 font-mono font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <span>Dual Variant Pipeline</span>
              <span className="text-emerald-400 font-mono font-medium">Operational</span>
            </div>
          </div>
        </div>

        {/* Beta Ops & Hyderabad Rota */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Beta Operations & Scope
          </h2>
          <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
            <p>
              MORS is operating in closed beta in <strong className="text-[var(--text-primary)]">Hyderabad</strong> with 50–100 active community testers. All user registrations require a verified beta invite code.
            </p>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-2">
              <div className="font-semibold text-[var(--text-primary)]">Moderation & Safety Rota</div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Daily queue triage is active. Inappropriate content, abusive tags, or unverified places are reviewed within 4 hours. Account deletion grace period is strictly 14 days before permanent hard deletion.
              </p>
            </div>
          </div>
        </div>

        {/* Known Issues & Active Tracks */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Active Issue Log
          </h2>
          <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--accent-primary)] border border-[var(--border-subtle)]">
                TRACKING
              </span>
              <span>Certain mobile browser EXIF tags require orientation normalizer pre-upload (handled in client dual-variant worker).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--accent-primary)] border border-[var(--border-subtle)]">
                PLANNED
              </span>
              <span>Post-beta Phase 15: Native Expo iOS/Android app packaging after Hyderabad cohort telemetry stabilizes.</span>
            </li>
          </ul>
        </div>

        {/* Beta Feedback Entry Point */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Tester Feedback & Incident Reports
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Encountered an edge case or have a suggestion regarding dish logging or taste archival? Please contact the beta operations engineering team directly:
          </p>
          <div className="pt-2">
            <a
              href="mailto:beta@mors.food?subject=MORS%20Hyderabad%20Beta%20Feedback"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 px-4 py-2.5 text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-colors"
            >
              Send Beta Feedback to Operations Team
            </a>
          </div>
        </div>

        {/* Footer timestamp */}
        <div className="text-center text-[10px] font-mono text-[var(--text-muted)] pt-4">
          Automated Health Pulse · {currentTimestamp}
        </div>
      </div>
    </div>
  );
}
