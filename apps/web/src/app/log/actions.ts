'use server';

import { createClient } from '@/lib/supabase/server';
import { CreateExperienceInputSchema, type CreateExperienceInput } from '@mors/domain';
import type { Json } from '@mors/db';
import { revalidatePath } from 'next/cache';

export interface SearchDishItem {
  id: string;
  name: string;
  cuisine: string | null;
}

export interface SearchPlaceItem {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
}

export interface FoodCategoryItem {
  slug: string;
  label: string;
  sort_order: number;
}

/**
 * Searches canonical dishes and aliases by keyword.
 */
export async function searchDishes(query: string): Promise<SearchDishItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const pattern = `%${trimmed}%`;

  const { data, error } = await supabase
    .from('dishes')
    .select('id, name, cuisine')
    .or(`name.ilike.${pattern},normalized_name.ilike.${pattern}`)
    .limit(10);

  if (error) {
    console.error('searchDishes error:', error);
    return [];
  }

  return ((data || []) as Array<{ id: string; name: string; cuisine: string | null }>).map((d) => ({
    id: d.id,
    name: d.name,
    cuisine: d.cuisine,
  }));
}

/**
 * Creates a new canonical dish record.
 */
export async function createDish(name: string, cuisine?: string): Promise<{ id: string; name: string } | { error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Dish name cannot be empty' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'You must be signed in to add dishes' };
  }

  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  const slug = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from('dishes')
    .insert({
      name: trimmed,
      normalized_name: normalized,
      slug,
      cuisine: cuisine?.trim() || null,
      created_by: user.id,
    })
    .select('id, name')
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id, name: data.name };
}

/**
 * Searches places by name or city.
 */
export async function searchPlaces(query: string): Promise<SearchPlaceItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const pattern = `%${trimmed}%`;

  const { data, error } = await supabase
    .from('places')
    .select('id, name, city, address')
    .or(`name.ilike.${pattern},city.ilike.${pattern}`)
    .limit(10);

  if (error) {
    console.error('searchPlaces error:', error);
    return [];
  }

  return ((data || []) as Array<{ id: string; name: string; city: string | null; address: string | null }>).map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    address: p.address,
  }));
}

/**
 * Creates a new place record.
 */
export async function createPlace(name: string, city?: string): Promise<{ id: string; name: string; city: string | null } | { error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Place name cannot be empty' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'You must be signed in to add places' };
  }

  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');

  const { data, error } = await supabase
    .from('places')
    .insert({
      name: trimmed,
      normalized_name: normalized,
      city: city?.trim() || 'Hyderabad',
      country: 'India',
      created_by: user.id,
    })
    .select('id, name, city')
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id, name: data.name, city: data.city };
}

/**
 * Retrieves active food categories.
 */
export async function getCategories(): Promise<FoodCategoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('food_categories')
    .select('slug, label, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('getCategories error:', error);
    return [
      { slug: 'dinner', label: 'Dinner', sort_order: 1 },
      { slug: 'lunch', label: 'Lunch', sort_order: 2 },
      { slug: 'breakfast', label: 'Breakfast', sort_order: 3 },
      { slug: 'snack', label: 'Snack', sort_order: 4 },
      { slug: 'dessert', label: 'Dessert', sort_order: 5 },
      { slug: 'coffee-tea', label: 'Coffee & Tea', sort_order: 6 },
    ];
  }

  return data;
}

/**
 * Transactional save of a Food Experience (create or update).
 */
export async function saveExperience(
  input: CreateExperienceInput,
  experienceId?: string
): Promise<{ success: boolean; experienceId?: string; error?: string }> {
  const parseResult = CreateExperienceInputSchema.safeParse(input);
  if (!parseResult.success) {
    const issue = parseResult.error.issues[0]?.message || 'Invalid experience data';
    return { success: false, error: issue };
  }

  const validated = parseResult.data;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Authentication required to log an experience' };
  }

  try {
    if (experienceId) {
      // Update existing experience
      const { error: updateError } = await supabase.rpc('update_experience', {
        p_experience_id: experienceId,
        payload: validated as unknown as Json,
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      revalidatePath(`/e/${experienceId}`);
      revalidatePath('/');
      return { success: true, experienceId };
    } else {
      // Create new experience
      const { data: newId, error: createError } = await supabase.rpc('create_experience', {
        payload: validated as unknown as Json,
      });

      if (createError) {
        return { success: false, error: createError.message };
      }

      revalidatePath('/');
      return { success: true, experienceId: newId as string };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save experience';
    return { success: false, error: message };
  }
}

/**
 * Deletes a Food Experience and cleans up its storage photos.
 */
export async function deleteExperience(experienceId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Authentication required' };
  }

  // 1. Fetch photo storage paths to delete from Supabase storage bucket
  const { data: photos } = await supabase
    .from('experience_photos')
    .select('storage_path')
    .eq('experience_id', experienceId);

  if (photos && photos.length > 0) {
    const paths = (photos as Array<{ storage_path: string }>).map((p) => p.storage_path);
    await supabase.storage.from('experience-photos').remove(paths);
  }

  // 2. Delete the experience record (cascades to dishes and photos rows)
  const { error: deleteError } = await supabase
    .from('food_experiences')
    .delete()
    .eq('id', experienceId)
    .eq('user_id', user.id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Generates short-lived signed URLs for experience photos.
 */
export async function getSignedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths || paths.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from('experience-photos').createSignedUrls(paths, 3600);

  if (error || !data) {
    console.error('getSignedPhotoUrls error:', error);
    return {};
  }

  const result: Record<string, string> = {};
  for (const item of data) {
    if (item.signedUrl && item.path) {
      result[item.path] = item.signedUrl;
    }
  }

  return result;
}
