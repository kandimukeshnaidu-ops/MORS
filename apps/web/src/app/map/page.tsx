import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/shell/AppShell';
import { Chip } from '@/components/ui/Chip';

export const metadata: Metadata = {
  title: 'Food Map | MORS — Dining Venues & Taste Geography',
  description: 'Explore verified dining venues and taste geography. Venue coordinates only; zero user tracking.',
};

export default async function MapPage() {
  const supabase = await createClient();

  // Fetch venue pins via SECURITY DEFINER RPC
  const { data: pins } = await supabase.rpc('get_map_pins', {
    p_city: 'Hyderabad',
  });

  const venuePins = pins || [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl pb-16">
        {/* Header */}
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)]">
              Taste Geography
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
              Venue Coordinates Only
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Hyderabad Food Map
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Explore dining venues referenced in public experiences or your personal diary.
          </p>
        </header>

        {/* Visual Map Representation / Accessible Layout */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {venuePins.length} {venuePins.length === 1 ? 'Venue' : 'Venues'} Mapped
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              Attribution: OpenStreetMap / Public Pool
            </span>
          </div>

          {/* Interactive / Visual Area */}
          <div className="relative aspect-video w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col items-center justify-center p-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--accent-primary)]">
              📍
            </div>
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Venue Spatial View
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mt-1">
              Pins reflect authenticated dining venue coordinates only. User eating coordinates are never stored or exposed.
            </p>
          </div>

          {/* Accessible List Alternative for Screen Readers and Keyboard Nav */}
          <div className="space-y-3 pt-2">
            <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Venue Directory & Public Consensus
            </h2>

            {venuePins.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic">
                No dining venues currently mapped for Hyderabad.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {venuePins.map((venue) => (
                  <div
                    key={venue.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <Link
                        href={`/place/${venue.id}`}
                        className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
                      >
                        {venue.name}
                      </Link>
                      {venue.address && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{venue.address}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {venue.is_visited_by_viewer && (
                        <Chip size="sm" label="Visited" selected />
                      )}
                      {venue.public_rating_avg && (
                        <span className="text-xs font-mono text-[var(--accent-primary)]">
                          ★ {(venue.public_rating_avg / 2).toFixed(1)}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        {venue.public_experience_count} {venue.public_experience_count === 1 ? 'log' : 'logs'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
