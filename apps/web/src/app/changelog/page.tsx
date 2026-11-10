import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Changelog & Product Evolution | MORS',
  description: 'Release notes, architecture updates, and product history for MORS social food journal.',
  robots: {
    index: false,
    follow: false,
  },
};

interface ReleaseEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: string[];
}

const releases: ReleaseEntry[] = [
  {
    version: 'v0.1.0-beta.2',
    date: 'November 10, 2026',
    title: 'Closed Beta Hardening & Hyderabad Launch Gate',
    summary:
      'Harden database authorization, enforce reference privacy, introduce dual image processing, and establish invite-gated registration for the Hyderabad cohort.',
    highlights: [
      'Invite Code Engine: Quota-enforced beta access for Hyderabad community creators with atomic redemption locks.',
      'DPDP Act Age Gate: Strict 18+ confirmation enforced on account creation with zero date-of-birth retention.',
      'Unlisted-by-Default Reference Data: User-logged dishes and places start private and visible only to creators until linked to a public entry.',
      'Trigger-Maintained Community Aggregates: Converted dynamic stats views into trigger-maintained tables with a >= 3 ratings de-anonymization threshold.',
      'Dual-Variant Image Pipeline: Client-side EXIF stripping and dual image compression (1280px display and 400px thumb at ~0.82 quality) with blur placeholders.',
      'Moderation Queue: Operator queue (/admin) with audit logs for reported content and creator warnings.',
      'System Saved Collection: One-tap bookmarking across dishes, places, and experiences with system_key = "saved".',
    ],
  },
  {
    version: 'v0.1.0-beta.1',
    date: 'November 9, 2026',
    title: 'Foundational Social Food Journal Engine',
    summary:
      'The initial end-to-end realization of the MORS social food journal: Eat, Log, Rate, Remember, Collect, Share.',
    highlights: [
      'Quick Log UX: Rapid logging with photo capture, dish combobox, and 1..10 smallint rating stars.',
      'Diary & Memory Views: Keyset-paginated chronological timeline, calendar month aggregations, and "On This Day" memory surfacing.',
      'Bidirectional Social Graph: Follow requests for private profiles, bidirectional blocking, and chronological home feed.',
      'Collections & Saved: Curated folders with fractional ordering and secret token sharing for unlisted collections.',
      'Search Engine: Unified trigram similarity and tsvector matching across users, dishes, places, and collections.',
      'Privacy & Lifecycle: 14-day deletion grace period, hard delete cascading, and full JSON data archive export.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Header */}
        <header className="border-b border-[var(--border-subtle)] pb-6">
          <Link
            href="/"
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent-primary)] mb-2 inline-block transition-colors"
          >
            ← Return to MORS
          </Link>
          <div className="flex items-center justify-between gap-4 mt-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">Product Changelog</h1>
            <span className="rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-mono text-[var(--accent-primary)]">
              Release Notes
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            A transparent ledger of feature additions, privacy updates, and infrastructure improvements.
          </p>
        </header>

        {/* Releases Timeline */}
        <div className="space-y-12">
          {releases.map((rel) => (
            <article
              key={rel.version}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-semibold text-[var(--accent-primary)]">
                    {rel.version}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    · {rel.date}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  {rel.title}
                </h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  {rel.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                  Key Improvements
                </span>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  {rel.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--accent-primary)] text-sm leading-none mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        {/* Roadmap Preview */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            What We&apos;re Building Next
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            During the 4–6 week Hyderabad closed beta, we are listening to creator feedback on logging cadence, dish tagging ergonomics, and taste consensus accuracy before packaging the native Expo iOS and Android applications.
          </p>
          <div className="pt-2 flex items-center gap-3 text-xs">
            <Link
              href="/status"
              className="font-medium text-[var(--accent-primary)] hover:underline"
            >
              View Beta Operations →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
