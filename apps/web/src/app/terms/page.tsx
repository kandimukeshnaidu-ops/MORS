import 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="text-xs font-mono text-[var(--accent-primary)] hover:underline"
      >
        ← Back to MORS
      </Link>
      <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-4">
        Terms of Service
      </h1>
      <p className="mt-2 text-xs text-[var(--text-muted)] font-mono">
        Last updated: November 2026
      </p>

      <section className="mt-8 space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            1. About MORS
          </h2>
          <p className="mt-1.5">
            MORS is a personal food journal and community around taste. We are not a food delivery service, booking engine, or restaurant review platform.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            2. Your Content & Privacy
          </h2>
          <p className="mt-1.5">
            You own all food logs, ratings, photos, and descriptions you post to MORS. We respect your visibility settings: private entries and followers-only entries are never made public or used in global discovery.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            3. Authentic Logging
          </h2>
          <p className="mt-1.5">
            MORS is built on genuine personal food memories. Automated scraping, spam reviews, or promotional abuse are strictly prohibited.
          </p>
        </div>
      </section>
    </main>
  );
}
