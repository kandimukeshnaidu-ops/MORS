import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/shell/AppShell';
import { Chip } from '@/components/ui/Chip';

interface CityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.toUpperCase()} Food Culture & Dining Guide | MORS`,
    description: `Discover local culinary culture, signature regional dishes, and community food diaries in ${slug}.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch city record
  const { data: city } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .single();

  if (!city) {
    notFound();
  }

  // Fetch public venues in this city
  const { data: places } = await supabase
    .from('places')
    .select('*, place_public_stats(*)')
    .eq('city_id', city.id)
    .limit(10);

  const cityPlaces = places || [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl pb-16">
        {/* Header */}
        <header className="space-y-2 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)]">
              Regional Food Culture
            </span>
            <Chip size="sm" label={city.country} />
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {city.name}
            </h1>
            {city.name_local && (
              <span className="font-display text-xl text-[var(--text-muted)]">
                {city.name_local}
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            Explore authentic food journaling, iconic dishes, and dining spots across {city.name}, {city.state}.
          </p>
        </header>

        {/* Venues in City */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Verified Dining Venues in {city.name}
            </h2>
            <Link
              href="/map"
              className="text-xs font-mono text-[var(--accent-primary)] hover:underline"
            >
              Open City Map →
            </Link>
          </div>

          {cityPlaces.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center text-xs text-[var(--text-secondary)]">
              No places currently cataloged in {city.name}. Meals logged here will seed the city taste directory.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cityPlaces.map((place) => (
                <Link
                  key={place.id}
                  href={`/place/${place.id}`}
                  className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/40 transition-colors block"
                >
                  <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                    {place.name}
                  </h3>
                  {place.address && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                      {place.address}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
