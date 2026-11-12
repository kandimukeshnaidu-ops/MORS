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
  cuisine?: string | null;
  eatenAt: string;
  publishedAt: string;
  overallRating: number | null;
  description: string | null;
  placeName: string | null;
  author: FeedAuthor;
  dishes: Array<{ name: string; rating: number | null; tasteRating?: number | null }>;
  primaryPhotoUrl: string | null;
  likesCount?: number;
  commentsCount?: number;
  isLikedByViewer?: boolean;
}

export interface SuggestedProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  experiencesCount: number;
  followersCount: number;
  matchReason?: string | null;
}

interface RawFeedV2Item {
  id: string;
  title: string | null;
  category_slug: string;
  cuisine: string | null;
  eaten_at: string;
  published_at: string;
  visibility: string;
  overall_rating: number | null;
  description: string | null;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_path: string | null;
  };
  place: {
    id: string;
    name: string;
    city: string | null;
  } | null;
  dishes: Array<{
    display_name: string;
    rating: number | null;
    taste_rating?: number | null;
  }>;
  primary_photo_path: string | null;
  likes_count: number;
  comments_count: number;
  is_liked_by_viewer: boolean;
}

interface FeedV2Response {
  items: RawFeedV2Item[];
  next_cursor: {
    published_at: string;
    id: string;
  } | null;
}

/**
 * Keyset-paginated chronological home feed powered by get_home_feed_v2 RPC.
 * Eliminates N+1 database queries and natively includes likes, comments, and dishes.
 */
export async function getHomeFeed(
  cursor?: { publishedAt: string; id: string } | null,
  limit = 15
): Promise<{ items: FeedItem[]; nextCursor: { publishedAt: string; id: string } | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_home_feed_v2', {
    p_cursor_published_at: cursor?.publishedAt || null,
    p_cursor_id: cursor?.id || null,
    p_limit: limit,
  });

  if (error || !data) {
    console.error('getHomeFeed error:', error);
    return { items: [], nextCursor: null };
  }

  const payload = data as unknown as FeedV2Response;
  const rawItems = payload.items || [];
  const nextCursorRaw = payload.next_cursor;

  if (rawItems.length === 0) {
    return { items: [], nextCursor: null };
  }

  // Collect photo paths that need signing
  const photoPaths: string[] = [];
  for (const item of rawItems) {
    if (item.primary_photo_path) {
      photoPaths.push(item.primary_photo_path);
    }
  }

  const signedPhotos = photoPaths.length > 0 ? await getSignedPhotoUrls(photoPaths) : {};

  const items: FeedItem[] = rawItems.map((r) => ({
    id: r.id,
    title: r.title,
    categorySlug: r.category_slug,
    cuisine: r.cuisine,
    eatenAt: r.eaten_at,
    publishedAt: r.published_at,
    overallRating: r.overall_rating,
    description: r.description,
    placeName: r.place?.name || null,
    author: {
      id: r.author.id,
      username: r.author.username,
      displayName: r.author.display_name,
      avatarPath: r.author.avatar_path,
      avatarUrl: null,
    },
    dishes: (r.dishes || []).map((d) => ({
      name: d.display_name,
      rating: d.rating,
      tasteRating: d.taste_rating,
    })),
    primaryPhotoUrl: r.primary_photo_path ? signedPhotos[r.primary_photo_path] || null : null,
    likesCount: r.likes_count,
    commentsCount: r.comments_count,
    isLikedByViewer: r.is_liked_by_viewer,
  }));

  const nextCursor = nextCursorRaw
    ? {
        publishedAt: nextCursorRaw.published_at,
        id: nextCursorRaw.id,
      }
    : null;

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

/**
 * Retrieves taste-aligned creators based on mutual high-rated dishes & cuisines.
 * Falls back to general suggested creators if no mutual matches are found or viewer is logged out.
 */
export async function getTasteAlignedProfiles(limit = 5): Promise<SuggestedProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_taste_aligned_profiles', {
    p_limit: limit,
  });

  if (!error && data && data.length > 0) {
    return data.map((p) => {
      const mutualCount = Number(p.mutual_dishes_count);
      const cuisine = p.match_cuisine || 'local dishes';
      const reason = mutualCount > 0
        ? `Shared taste in ${cuisine} • ${mutualCount} mutual favorite${mutualCount > 1 ? 's' : ''}`
        : `Shared taste in ${cuisine}`;

      return {
        id: p.candidate_id,
        username: p.c_username,
        displayName: p.c_display_name,
        avatarUrl: null,
        bio: p.c_bio,
        experiencesCount: 0,
        followersCount: 0,
        matchReason: reason,
      };
    });
  }

  // Graceful fallback to suggested profiles
  return getSuggestedUsers(limit);
}
