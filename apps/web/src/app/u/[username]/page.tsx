import 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/shell/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FollowButton } from '@/components/social/FollowButton';
import { Chip } from '@/components/ui/Chip';
import { ExperienceCard } from '@/components/ui/ExperienceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { TasteStatsCard } from '@/components/profile/TasteStatsCard';
import { getProfileTasteStats } from '@/app/explore/actions';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // 1. Fetch Profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !profile) {
    notFound();
  }

  // 2. Fetch current viewer
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const isOwner = currentUser?.id === profile.id;

  // 3. Follow state & Authorization check
  let isFollowing = false;
  let isPending = false;
  let canView = true;

  if (!isOwner && currentUser) {
    const { data: follow } = await supabase
      .from('follows')
      .select('status')
      .eq('follower_id', currentUser.id)
      .eq('following_id', profile.id)
      .maybeSingle();

    if (follow?.status === 'accepted') {
      isFollowing = true;
    } else if (follow?.status === 'pending') {
      isPending = true;
    }
  }

  if (profile.is_private && !isOwner) {
    if (!currentUser || !isFollowing) {
      canView = false;
    }
  }

  // 4. Fetch experiences and taste statistics if permitted
  let experiences: any[] = [];
  let tasteStats = null;
  if (canView) {
    const { data: exps } = await supabase
      .from('food_experiences')
      .select('*, experience_dishes(*)')
      .eq('user_id', profile.id)
      .order('published_at', { ascending: false })
      .limit(20);

    experiences = exps || [];
    tasteStats = await getProfileTasteStats(profile.id);
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-2xl">
        {/* Profile Header */}
        <header className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={profile.avatar_path}
                alt={profile.display_name || profile.username}
                size="xl"
                fallbackText={profile.display_name || profile.username}
              />
              <div>
                <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {profile.display_name || profile.username}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    @{profile.username}
                  </span>
                  {profile.is_private && (
                    <span className="inline-flex items-center gap-1 rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Private
                    </span>
                  )}
                </div>

                {profile.bio && (
                  <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed max-w-md">
                    {profile.bio}
                  </p>
                )}

                {profile.location_text && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{profile.location_text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Follow / Edit */}
            <div>
              {isOwner ? (
                <Link href="/settings">
                  <Button variant="secondary" size="sm">
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <FollowButton
                  targetUserId={profile.id}
                  initialFollowing={isFollowing}
                  initialPending={isPending}
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Counts (Trigger-maintained, public-only) */}
          <div className="mt-6 flex items-center justify-around border-t border-[var(--border-subtle)] pt-4 text-center">
            <div>
              <div className="font-display text-lg font-bold text-[var(--text-primary)]">
                {profile.experiences_count}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Experiences</div>
            </div>
            <div className="h-6 w-px bg-[var(--border-subtle)]" />
            <div>
              <div className="font-display text-lg font-bold text-[var(--text-primary)]">
                {profile.followers_count}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Followers</div>
            </div>
            <div className="h-6 w-px bg-[var(--border-subtle)]" />
            <div>
              <div className="font-display text-lg font-bold text-[var(--text-primary)]">
                {profile.following_count}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Following</div>
            </div>
          </div>

          {/* Cuisines */}
          {profile.favourite_cuisines && profile.favourite_cuisines.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-[var(--text-muted)] mr-1">Tastes:</span>
              {profile.favourite_cuisines.map((c: string) => (
                <Chip key={c} label={c} size="sm" />
              ))}
            </div>
          )}
        </header>

        {/* Taste Identity & Annual Recap */}
        {canView && tasteStats && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono text-[var(--text-muted)]">Verified Taste Analytics</span>
              <Link
                href={`/u/${profile.username}/food-year`}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-primary)] hover:underline font-mono"
              >
                <span>View 2026 Food Year Recap →</span>
              </Link>
            </div>
            <TasteStatsCard stats={tasteStats} username={profile.username} isOwner={isOwner} />
          </div>
        )}

        {/* Content Section: Entries OR Locked Private State */}
        {!canView ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--accent-primary)]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-medium text-[var(--text-primary)]">
              This Account is Private
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Follow this cook to view their food diary, taste ratings, and personal collections.
            </p>
          </div>
        ) : experiences.length === 0 ? (
          <EmptyState
            title="No Published Entries"
            description={
              isOwner
                ? "You haven't published any food experiences yet. Start your journal today."
                : `@${profile.username} hasn't published any food experiences yet.`
            }
          />
        ) : (
          <div className="space-y-6">
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
              Food Experiences
            </h2>
            {experiences.map((exp: any) => (
              <ExperienceCard
                key={exp.id}
                id={exp.id}
                author={{
                  username: profile.username,
                  displayName: profile.display_name || profile.username,
                  avatarUrl: profile.avatar_path,
                }}
                title={exp.title}
                category={exp.category_slug}
                overallRating={exp.overall_rating}
                date={new Date(exp.eaten_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                description={exp.description}
                dishes={exp.experience_dishes.map((d: any) => ({
                  name: d.display_name,
                  rating: d.rating,
                }))}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
