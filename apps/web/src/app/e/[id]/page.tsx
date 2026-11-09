import 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSignedPhotoUrls } from '@/app/log/actions';
import { RatingStars } from '@/components/ui/RatingStars';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { ExperienceActions } from '@/components/log/ExperienceActions';
import { LikeButton } from '@/components/engagement/LikeButton';
import { CommentsSection } from '@/components/engagement/CommentsSection';
import { getLikeStatus } from '@/app/engagement/actions';
import type { Metadata } from 'next';

interface ExperienceDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ExperienceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: exp } = await supabase
    .from('food_experiences')
    .select('title, description')
    .eq('id', id)
    .single();

  if (!exp) {
    return { title: 'Food Experience — MORS' };
  }

  return {
    title: `${exp.title || 'Food Experience'} — MORS`,
    description: exp.description || 'Logged on MORS social food journal.',
  };
}

export default async function ExperienceDetailPage({ params }: ExperienceDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch experience (RLS ensures only permitted records can be selected)
  const { data: exp, error } = await supabase
    .from('food_experiences')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !exp) {
    notFound();
  }

  const isOwner = user?.id === exp.user_id;
  const likeStatus = await getLikeStatus(id);

  // Fetch author profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path, is_private')
    .eq('id', exp.user_id)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch place if present
  let place: { id: string; name: string; city: string | null; address: string | null } | null = null;
  if (exp.place_id) {
    const { data: p } = await supabase
      .from('places')
      .select('id, name, city, address')
      .eq('id', exp.place_id)
      .single();
    place = p;
  }

  // Fetch dishes
  const { data: expDishesData } = await supabase
    .from('experience_dishes')
    .select('*')
    .eq('experience_id', id)
    .order('position', { ascending: true });
  const expDishes = expDishesData || [];

  // Fetch photos
  const { data: rawPhotosData } = await supabase
    .from('experience_photos')
    .select('*')
    .eq('experience_id', id)
    .order('position', { ascending: true });
  const rawPhotos = rawPhotosData || [];

  // Generate signed URLs for private photos
  const signedUrlMap = rawPhotos.length > 0
    ? await getSignedPhotoUrls(rawPhotos.map((p) => p.storage_path))
    : {};

  const formattedDate = new Date(exp.eaten_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb & Back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>←</span>
            <span>Back to Journal</span>
          </Link>

          {isOwner && (
            <ExperienceActions
              experienceId={id}
              initialData={{
                id: exp.id,
                title: exp.title,
                category_slug: exp.category_slug,
                eaten_at: exp.eaten_at,
                status: exp.status,
                visibility: exp.visibility,
                overall_rating: exp.overall_rating,
                description: exp.description,
                place_id: exp.place_id,
                price_amount: exp.price_amount ? Number(exp.price_amount) : null,
                cuisine: exp.cuisine,
                tags: exp.tags || [],
                dishes: expDishes.map((d) => ({
                  dish_id: d.dish_id || undefined,
                  display_name: d.display_name,
                  position: d.position,
                  rating: d.rating,
                  note: d.note,
                })),
              }}
            />
          )}
        </div>

        {/* Experience Header */}
        <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" label={exp.category_slug.toUpperCase()} selected />

            {exp.status === 'draft' && (
              <Chip size="sm" label="Draft" className="border-amber-500/50 text-amber-400" />
            )}

            {exp.visibility !== 'public' && (
              <Chip
                size="sm"
                label={exp.visibility === 'followers' ? '👥 Followers Only' : '🔒 Private'}
              />
            )}

            <span className="text-xs text-[var(--text-muted)] ml-auto">{formattedDate}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            {exp.title || expDishes[0]?.display_name || 'Food Experience'}
          </h1>

          {/* Author info */}
          <div className="flex items-center gap-3 pt-1">
            <Link href={`/u/${profile.username}`}>
              <Avatar
                alt={profile.display_name || profile.username}
                src={profile.avatar_path || undefined}
                fallbackText={profile.display_name || profile.username}
                size="md"
              />
            </Link>
            <div>
              <Link
                href={`/u/${profile.username}`}
                className="text-sm font-medium hover:underline text-[var(--text-primary)]"
              >
                {profile.display_name || profile.username}
              </Link>
              <div className="text-xs text-[var(--text-muted)]">@{profile.username}</div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <LikeButton
                experienceId={id}
                initialLiked={likeStatus.liked}
                initialCount={likeStatus.count}
                size="md"
              />

              {exp.overall_rating && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5">
                  <span className="text-xs text-[var(--text-muted)]">Overall</span>
                  <RatingStars value={exp.overall_rating} size="sm" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Photo Gallery (Signed URLs) */}
        {rawPhotos.length > 0 && (
          <section className="my-8 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrlMap[rawPhotos[0].storage_path] || rawPhotos[0].blurhash || ''}
                alt={rawPhotos[0].alt_text || 'Food experience photo'}
                className="w-full max-h-[500px] object-cover"
              />
            </div>

            {rawPhotos.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {rawPhotos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="aspect-square overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signedUrlMap[photo.storage_path] || photo.blurhash || ''}
                      alt={photo.alt_text || `Food photo ${idx + 1}`}
                      className="h-full w-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Dishes Breakdown */}
        <section className="my-8 space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            Dishes Enjoyed ({expDishes.length})
          </h2>

          <div className="divide-y divide-[var(--border-subtle)] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            {expDishes.map((dish) => (
              <div key={dish.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-medium text-base text-[var(--text-primary)]">
                    {dish.display_name}
                  </h3>
                  {dish.note && (
                    <p className="text-xs text-[var(--text-secondary)] italic">
                      &quot;{dish.note}&quot;
                    </p>
                  )}
                </div>

                {dish.rating && (
                  <div className="self-start sm:self-center">
                    <RatingStars value={dish.rating} size="sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Notes & Description */}
        {exp.description && (
          <section className="my-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-2">
            <h2 className="font-display text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Food Memories & Notes
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
              {exp.description}
            </p>
          </section>
        )}

        {/* Place & Meal Metadata */}
        <section className="my-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {place && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <span className="block text-xs text-[var(--text-muted)]">Place / Restaurant</span>
              <span className="font-medium text-sm text-[var(--text-primary)]">{place.name}</span>
              {place.city && (
                <span className="block text-xs text-[var(--text-secondary)]">{place.city}</span>
              )}
            </div>
          )}

          {exp.price_amount && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <span className="block text-xs text-[var(--text-muted)]">Price</span>
              <span className="font-medium text-sm text-[var(--text-primary)]">
                ₹{Number(exp.price_amount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {exp.cuisine && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <span className="block text-xs text-[var(--text-muted)]">Cuisine</span>
              <span className="font-medium text-sm text-[var(--text-primary)]">{exp.cuisine}</span>
            </div>
          )}
        </section>

        {/* Tags */}
        {exp.tags && exp.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {exp.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-3 py-1 text-xs text-[var(--text-secondary)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Engagement: Comments Section */}
        <div className="pt-6">
          <CommentsSection experienceId={id} />
        </div>
      </div>
    </div>
  );
}
