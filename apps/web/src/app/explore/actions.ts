'use server';

import { createClient } from '@/lib/supabase/server';
import type { PersonalTasteIdentity } from '@mors/db';
import { getPublicCollections, type CollectionSummary } from '@/app/collections/actions';
import { getSignedPhotoUrls } from '@/app/log/actions';

export interface TrendingExperienceItem {
  id: string;
  title: string | null;
  eatenAt: string;
  overallRating: number | null;
  cuisine: string | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarPath: string | null;
  };
  likesCount: number;
  commentsCount: number;
  photoUrl: string | null;
  trendingScore: number;
}

export interface ProfileTasteStats {
  totalMeals: number;
  averageRating: number | null;
  topCategory: string | null;
  favouriteCuisines: Array<{ cuisine: string; count: number }>;
  topRatedDishes: Array<{ name: string; rating: number; timesLogged: number }>;
  monthlyActivity: Array<{ label: string; count: number }>;
}

export interface FoodYearRecap {
  year: number;
  totalMealsLogged: number;
  topPlace: string | null;
  bestDish: { name: string | null; rating: number | null };
  topDishes: Array<{ name: string; count: number }>;
}

export interface ExplorePayload {
  trendingExperiences: TrendingExperienceItem[];
  spotlightCollections: CollectionSummary[];
  suggestedTastemakers: Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarPath: string | null;
    bio: string | null;
    experiencesCount: number;
    followersCount: number;
  }>;
}

/**
 * Fetches time-decayed trending experiences, curated collections, and tastemakers.
 */
export async function getExploreData(limit = 20): Promise<ExplorePayload> {
  const supabase = await createClient();

  // 1. Trending public food experiences
  const { data: trendingData, error } = await supabase.rpc('get_explore_trending', {
    p_limit: limit,
  });

  // Resolve signed photos if any
  const photoPaths: string[] = [];
  if (trendingData) {
    for (const item of trendingData) {
      if (item.primary_photo_path) photoPaths.push(item.primary_photo_path);
    }
  }
  const signedMap = photoPaths.length > 0 ? await getSignedPhotoUrls(photoPaths) : {};

  const trendingExperiences: TrendingExperienceItem[] = (trendingData || []).map((t) => ({
    id: t.id,
    title: t.title,
    eatenAt: t.eaten_at,
    overallRating: t.overall_rating,
    cuisine: t.cuisine,
    author: {
      id: t.author_id,
      username: t.author_username,
      displayName: t.author_display_name,
      avatarPath: t.author_avatar_path,
    },
    likesCount: t.likes_count,
    commentsCount: t.comments_count,
    photoUrl: t.primary_photo_path ? signedMap[t.primary_photo_path] || null : null,
    trendingScore: t.trending_score,
  }));

  // 2. Spotlight public collections
  const spotlightCollections = await getPublicCollections(6);

  // 3. Suggested creators
  const { data: tastemakers } = await supabase.rpc('get_suggested_profiles', {
    p_limit: 5,
  });

  return {
    trendingExperiences,
    spotlightCollections,
    suggestedTastemakers: (tastemakers || []).map((t) => ({
      id: t.id,
      username: t.username,
      displayName: t.display_name,
      avatarPath: t.avatar_path,
      bio: t.bio,
      experiencesCount: t.experiences_count,
      followersCount: t.followers_count,
    })),
  };
}

/**
 * Retrieves taste identity statistics computed purely from real user logs.
 * Non-negotiables #3 and #11: no personality claims; owner sees full stats,
 * public viewers see statistics calculated strictly from public entries.
 */
export async function getProfileTasteStats(targetUserId: string): Promise<ProfileTasteStats | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_profile_taste_stats', {
    target_user_id: targetUserId,
  });

  if (error || !data) return null;
  return data as ProfileTasteStats;
}

/**
 * Retrieves annual "Food Year" memory recap.
 */
export async function getFoodYearData(targetUserId: string, year = 2026): Promise<FoodYearRecap | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_food_year_summary', {
    target_user_id: targetUserId,
    p_year: year,
  });

  if (error || !data) return null;
  return data as FoodYearRecap;
}

/**
 * MORS 2.0 Phase 5: Retrieves structured Personal Taste Identity for authenticated user
 * or shared public taste profile of target user.
 */
export async function getPersonalTasteIdentity(targetUserId?: string): Promise<PersonalTasteIdentity | null> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const viewerId = authData?.user?.id || null;

  const { data, error } = await supabase.rpc('get_personal_taste_identity', {
    p_user_id: targetUserId || viewerId,
    p_viewer_id: viewerId,
  });

  if (error || !data) return null;
  return data as PersonalTasteIdentity;
}

/**
 * MORS 2.0 Phase 5: Toggles personal taste profile sharing opt-in.
 */
export async function setTasteProfileSharing(enabled: boolean): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('set_taste_profile_sharing', {
    p_enabled: enabled,
  });

  if (error) {
    throw new Error(error.message);
  }
  return !!data;
}
