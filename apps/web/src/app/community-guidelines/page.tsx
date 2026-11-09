import Link from 'next/link';
import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';

export const metadata: Metadata = {
  title: 'Community Guidelines | MORS',
  description: 'Standards for maintaining an authentic, respectful social food journal on MORS.',
};

export default function CommunityGuidelinesPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="border-b border-[var(--border-subtle)] pb-6 mb-8">
          <Link
            href="/"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4 block"
          >
            ← Back to MORS
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Community Guidelines
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
            Last Updated: November 2026 · Effective across MORS Web & Mobile
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[var(--text-secondary)] space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
              1. Our Food Philosophy
            </h2>
            <p>
              MORS is a social food journal for documenting, rating, and remembering your authentic food life. We exist to preserve personal taste memories, celebrate street vendors and home cooks alongside restaurants, and connect people through genuine culinary discovery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
              2. Authentic Taste Experiences Only
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Log only meals and dishes you have personally experienced or intend to try.</li>
              <li>No paid, astroturfed, or coerced ratings. Dish consensus aggregates reflect true user sentiment.</li>
              <li>Respect fellow diners: subjective taste differs across cultures, spice tolerances, and traditions. Constructive critique is welcomed; harassment is never tolerated.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
              3. Privacy, Age Consent & Children&apos;s Data
            </h2>
            <p>
              Per India&apos;s Digital Personal Data Protection (DPDP) Act and international standards, MORS is intended for individuals aged 13 and above. We do not track or broadcast precise real-time eating locations without explicit user intent. All photo EXIF/GPS metadata is automatically stripped at the client before storage.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
              4. Zero Tolerance for Abuse & Hate Speech
            </h2>
            <p>
              Food brings people together. We maintain zero tolerance for hate speech, discrimination, explicit imagery, spam, or abusive behavior in comments, experiences, or collections. Content violations can be reported directly via the flag icon on any post or comment.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
              5. Moderation & Enforcement
            </h2>
            <p>
              Reports are reviewed promptly by our moderation team. Actions may include content removal, temporary suspension, or permanent account termination. Users have the right to appeal moderation actions or request full account deletion at any time in Settings.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
