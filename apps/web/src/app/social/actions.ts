'use server';

import { createClient } from '@/lib/supabase/server';
import { getSignedPhotoUrls } from '@/app/log/actions';
import { revalidatePath } from 'next/cache';

export interface FeedAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
}

export interface FeedItem {
  id: string;
  title: string | null;
  categorySlug: string;
  eatenAt: string;
  publishedAt: string;
  overallRating: number | null;
  description: string | null;
  placeName: string | null;
  author: FeedAuthor;
  dishes: Array<{ name: string; rating: number | null }>;
  primaryPhotoUrl: string | null;
}

export interface SuggestedProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  experiencesCount: number;
  followersCount: number;
}

/**
 * Keyset-paginated chronological home feed.
 */
export async function getHomeFeed(
  cursor?: { publishedAt: string; id: string } | null,
  limit = 15
): Promise<{ items: FeedItem[]; nextCursor: { publishedAt: string; id: string } | null }> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase.rpc('get_home_feed', {
    p_cursor_published_at: cursor?.publishedAt || null,
    p_cursor_id: cursor?.id || null,
    p_limit: limit + 1,
  });

  if (error || !rows) {
    console.error('getHomeFeed error:', error);
    return { items: [], nextCursor: null };
  }

  const hasNextPage = rows.length > limit;
  const pageRecords = hasNextPage ? rows.slice(0, limit) : rows;

  const nextCursor =
    hasNextPage && pageRecords.length > 0
      ? {
          publishedAt: pageRecords[pageRecords.length - 1].published_at,
          id: pageRecords[pageRecords.length - 1].id,
        }
      : null;

  if (pageRecords.length === 0) {
    return { items: [], nextCursor: null };
  }

  const expIds = pageRecords.map((r) => r.id);
  const authorIds = Array.from(new Set(pageRecords.map((r) => r.user_id)));
  const placeIds = Array.from(new Set(pageRecords.map((r) => r.place_id).filter(Boolean))) as string[];

  // 1. Fetch authors
  const { data: authorsData } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path')
    .in('id', authorIds);

  const authorMap: Record<string, FeedAuthor> = {};
  const avatarPaths: string[] = [];

  for (const a of authorsData || []) {
    authorMap[a.id] = {
      id: a.id,
      username: a.username,
      displayName: a.display_name,
      avatarPath: a.avatar_path,
      avatarUrl: null,
    };
    if (a.avatar_path) avatarPaths.push(a.avatar_path);
  }

  // 2. Fetch places
  const placeMap: Record<string, string> = {};
  if (placeIds.length > 0) {
    const { data: placesData } = await supabase
      .from('places')
      .select('id, name')
      .in('id', placeIds);

    for (const pl of placesData || []) {
      placeMap[pl.id] = pl.name;
    }
  }

  // 3. Fetch dishes
  const { data: dishesData } = await supabase
    .from('experience_dishes')
    .select('experience_id, display_name, rating, position')
    .in('experience_id', expIds)
    .order('position', { ascending: true });

  const dishesMap: Record<string, Array<{ name: string; rating: number | null }>> = {};
  for (const d of dishesData || []) {
    if (!dishesMap[d.experience_id]) dishesMap[d.experience_id] = [];
    dishesMap[d.experience_id].push({ name: d.display_name, rating: d.rating });
  }

  // 4. Fetch primary photos
  const { data: photosData } = await supabase
    .from('experience_photos')
    .select('experience_id, storage_path, position')
    .in('experience_id', expIds)
    .order('position', { ascending: true });

  const primaryPhotoMap: Record<string, string> = {};
  const photoPaths: string[] = [];
  for (const p of photosData || []) {
    if (!primaryPhotoMap[p.experience_id]) {
      primaryPhotoMap[p.experience_id] = p.storage_path;
      photoPaths.push(p.storage_path);
    }
  }

  const signedPhotos = photoPaths.length > 0 ? await getSignedPhotoUrls(photoPaths) : {};

  // Construct items
  const items: FeedItem[] = pageRecords.map((r) => {
    const photoPath = primaryPhotoMap[r.id];
    return {
      id: r.id,
      title: r.title,
      categorySlug: r.category_slug,
      eatenAt: r.eaten_at,
      publishedAt: r.published_at,
      overallRating: r.overall_rating,
      description: r.description,
      placeName: r.place_id ? placeMap[r.place_id] || null : null,
      author: authorMap[r.user_id] || {
        id: r.user_id,
        username: 'unknown',
        displayName: null,
        avatarPath: null,
        avatarUrl: null,
      },
      dishes: dishesMap[r.id] || [],
      primaryPhotoUrl: photoPath ? signedPhotos[photoPath] || null : null,
    };
  });

  return { items, nextCursor };
}

/**
 * Follow a user (status='accepted' if target is public, 'pending' if target is private).
 */
export async function followUser(targetId: string): Promise<{ success: boolean; status?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('follow_user', {
    p_target_id: targetId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true, status: data as string };
}

/**
 * Unfollow a user.
 */
export async function unfollowUser(targetId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('unfollow_user', {
    p_target_id: targetId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Block a user (removes mutual follows automatically).
 */
export async function blockUser(targetId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('block_user', {
    p_target_id: targetId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Unblock a user.
 */
export async function unblockUser(targetId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('unblock_user', {
    p_target_id: targetId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Checks follow and block status for a target user.
 */
export async function getFollowState(
  targetUserId: string
): Promise<{ isFollowing: boolean; isPending: boolean; isBlocked: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id === targetUserId) {
    return { isFollowing: false, isPending: false, isBlocked: false };
  }

  const { data: follow } = await supabase
    .from('follows')
    .select('status')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  const { data: block } = await supabase
    .from('blocks')
    .select('blocker_id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId)
    .maybeSingle();

  return {
    isFollowing: follow?.status === 'accepted',
    isPending: follow?.status === 'pending',
    isBlocked: Boolean(block),
  };
}

/**
 * Retrieves recommended creators to follow (cold start).
 */
export async function getSuggestedUsers(limit = 5): Promise<SuggestedProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_suggested_profiles', {
    p_limit: limit,
  });

  if (error || !data) {
    console.error('getSuggestedUsers error:', error);
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: null,
    bio: p.bio,
    experiencesCount: p.experiences_count,
    followersCount: p.followers_count,
  }));
}
