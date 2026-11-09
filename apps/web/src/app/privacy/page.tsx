import 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="text-xs font-mono text-[var(--accent-primary)] hover:underline"
      >
        ← Back to MORS
      </Link>
      <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-4">
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs text-[var(--text-muted)] font-mono">
        Last updated: November 2026
      </p>

      <section className="mt-8 space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            1. Core Privacy Commitments
          </h2>
          <p className="mt-1.5">
            Your food journal is your personal archive. We enforce database-level Row Level Security (RLS) on Postgres. Private, followers-only, and draft entries cannot leak through search, feeds, public counts, or storage URLs.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            2. Photo & Location Privacy
          </h2>
          <p className="mt-1.5">
            Uploaded photos are stripped of EXIF and GPS metadata client-side before being uploaded to our secure private storage. We never collect precise real-time location without explicit affirmative consent.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            3. Account Deletion & Data Export
          </h2>
          <p className="mt-1.5">
            You can export all your data in standard JSON format along with your photos at any time, or request permanent deletion of your account and associated media.
          </p>
        </div>
      </section>
    </main>
  );
}
