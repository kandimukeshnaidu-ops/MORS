'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Visibility } from '@mors/db';

export interface UserExportData {
  exportedAt: string;
  profile: {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    locationText: string | null;
    favouriteCuisines: string[];
    isPrivate: boolean;
    discoverable: boolean;
    defaultVisibility: Visibility;
    createdAt: string;
  };
  foodExperiences: Array<{
    id: string;
    title: string | null;
    description: string | null;
    eatenAt: string;
    overallRating: number | null;
    visibility: string;
    cuisine: string | null;
    priceAmount: number | null;
    tags: string[];
    dishes: Array<{
      displayName: string;
      rating: number | null;
      review: string | null;
    }>;
  }>;
  collections: Array<{
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    isWishlist: boolean;
    itemsCount: number;
    createdAt: string;
  }>;
  social: {
    followersCount: number;
    followingCount: number;
  };
}

/**
 * Updates profile privacy and discoverability settings.
 */
export async function updatePrivacySettings(settings: {
  isPrivate: boolean;
  discoverable: boolean;
  defaultVisibility: Visibility;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase
    .from('profiles')
    .update({
      is_private: settings.isPrivate,
      discoverable: settings.discoverable,
      default_visibility: settings.defaultVisibility,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  revalidatePath(`/u/${user.id}`);
  return { success: true };
}

/**
 * Exports complete personal food archive into a structured JSON string.
 */
export async function exportUserData(): Promise<{ data?: UserExportData; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  // 1. Profile
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (pErr || !profile) return { error: 'Failed to retrieve profile data' };

  // 2. Experiences with dishes
  const { data: experiences } = await supabase
    .from('food_experiences')
    .select(`
      id, title, description, eaten_at, overall_rating, visibility,
      cuisine, price_amount, tags,
      experience_dishes(display_name, rating, review)
    `)
    .eq('user_id', user.id)
    .order('eaten_at', { ascending: false });

  // 3. Collections
  const { data: collections } = await supabase
    .from('collections')
    .select('id, name, description, visibility, is_wishlist, items_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const exportPayload: UserExportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio,
      locationText: profile.location_text,
      favouriteCuisines: profile.favourite_cuisines || [],
      isPrivate: profile.is_private,
      discoverable: profile.discoverable,
      defaultVisibility: profile.default_visibility,
      createdAt: profile.created_at,
    },
    foodExperiences: (experiences || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      eatenAt: e.eaten_at,
      overallRating: e.overall_rating,
      visibility: e.visibility,
      cuisine: e.cuisine,
      priceAmount: e.price_amount ? Number(e.price_amount) : null,
      tags: e.tags || [],
      dishes: (e.experience_dishes || []).map((d: any) => ({
        displayName: d.display_name,
        rating: d.rating,
        review: d.review,
      })),
    })),
    collections: (collections || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      visibility: c.visibility,
      isWishlist: c.is_wishlist,
      itemsCount: c.items_count,
      createdAt: c.created_at,
    })),
    social: {
      followersCount: profile.followers_count || 0,
      followingCount: profile.following_count || 0,
    },
  };

  return { data: exportPayload };
}

/**
 * Initiates 14-day deletion grace period or triggers immediate hard delete.
 */
export async function requestAccountDeletion(immediate = false): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required' };

  if (immediate) {
    const { error } = await supabase.rpc('execute_account_hard_delete', {
      target_user_id: user.id,
    });
    if (error) return { success: false, error: error.message };

    await supabase.auth.signOut();
    return { success: true };
  }

  const { error } = await supabase.rpc('request_account_deletion');
  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Cancels pending account deletion during grace period.
 */
export async function cancelAccountDeletion(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase.rpc('cancel_account_deletion');
  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Cancels active subscription at current billing period end in one click.
 */
export async function cancelSubscriptionAction(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase.rpc('cancel_user_subscription', {
    p_user_id: user.id,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true };
}
