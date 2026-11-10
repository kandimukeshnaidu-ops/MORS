import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/shell/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getFoodYearData } from '@/app/explore/actions';

interface FoodYearPageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata({ params }: FoodYearPageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `2026 Food Year — @${username} | MORS`,
    description: `A personal culinary archive and taste retrospective of 2026 by @${username}.`,
  };
}

export default async function FoodYearPage({ params }: FoodYearPageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (!profile) {
    notFound();
  }

  // 2. Fetch current viewer & permissions
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const isOwner = currentUser?.id === profile.id;
  let canView = true;

  if (profile.is_private && !isOwner) {
    if (!currentUser) {
      canView = false;
    } else {
      const { data: follow } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id)
        .maybeSingle();

      if (follow?.status !== 'accepted') {
        canView = false;
      }
    }
  }

  if (!canView) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--accent-primary)]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-medium text-[var(--text-primary)]">
            This Account is Private
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Only approved followers can view @{profile.username}&apos;s annual food recap.
          </p>
        </div>
      </AppShell>
    );
  }

  const recap = await getFoodYearData(profile.id, 2026);

  return (
    <AppShell>
      <div className="space-y-8 max-w-2xl mx-auto pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/u/${profile.username}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-mono"
          >
            <span>← Back to @{profile.username}</span>
          </Link>
          <span className="text-[10px] font-mono text-[var(--accent-primary)] uppercase tracking-wider">
            Annual Recap
          </span>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-elevated)] p-8 sm:p-10 text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar
              src={profile.avatar_path}
              alt={profile.display_name || profile.username}
              size="xl"
              fallbackText={profile.display_name || profile.username}
            />
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--accent-primary)]">
                2026 Food Year
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
                {profile.display_name || profile.username}&apos;s Year in Flavor
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                @{profile.username}
              </p>
            </div>
          </div>

          {!recap || recap.totalMealsLogged === 0 ? (
            <EmptyState
              title="No Logged Meals in 2026"
              description={`@${profile.username} hasn't logged any meals in 2026 yet. As meals are entered in the food journal, this recap will tell their annual taste story.`}
            />
          ) : (
            <div className="space-y-6 pt-4 text-left">
              {/* Highlight Metric Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 p-5 text-center">
                  <span className="block font-display text-3xl font-bold text-[var(--text-primary)]">
                    {recap.totalMealsLogged}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mt-1 block">
                    Meals Logged
                  </span>
                </div>

                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 p-5 text-center">
                  <span className="block font-display text-3xl font-bold text-[var(--accent-primary)]">
                    {recap.bestDish.rating ? `★ ${recap.bestDish.rating}` : '—'}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mt-1 block">
                    Top Dish Score
                  </span>
                </div>
              </div>

              {/* Best Dish Spotlight */}
              {recap.bestDish.name && (
                <div className="rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-primary)] block">
                    Crown Dish of the Year
                  </span>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-[var(--text-primary)]">
                      {recap.bestDish.name}
                    </span>
                    {recap.bestDish.rating && (
                      <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold">
                        ★ {recap.bestDish.rating} / 5.0
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Favorite Place */}
              {recap.topPlace && (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                      Most Visited Venue
                    </span>
                    <span className="font-display text-base font-semibold text-[var(--text-primary)] mt-0.5 block">
                      {recap.topPlace}
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--accent-primary)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Top Logged Dishes */}
              {recap.topDishes.length > 0 && (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 p-5 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                    Most Frequently Eaten Dishes
                  </span>
                  <div className="space-y-2">
                    {recap.topDishes.map((dish, idx) => (
                      <div key={dish.name} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[var(--accent-primary)] w-4">
                            #{idx + 1}
                          </span>
                          <span className="font-medium text-[var(--text-primary)]">{dish.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-[var(--text-muted)]">
                          {dish.count} {dish.count === 1 ? 'time' : 'times'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-center gap-3">
            <Link href={`/u/${profile.username}`}>
              <Button variant="secondary" size="sm">
                View Food Diary
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
