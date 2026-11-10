'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CollectionVisibility } from '@mors/db';

export interface CollectionSummary {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverPhotoPath: string | null;
  visibility: CollectionVisibility;
  shareToken: string;
  isWishlist: boolean;
  systemKey?: string | null;
  itemsCount: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarPath: string | null;
  };
  hasLiked?: boolean;
}

export interface CollectionItemDetail {
  id: string;
  collectionId: string;
  itemType: 'experience' | 'dish' | 'place';
  note: string | null;
  position: number;
  createdAt: string;
  experience?: {
    id: string;
    title: string | null;
    rating: number | null;
    occurredAt: string;
    author: {
      username: string;
      displayName: string | null;
    };
  } | null;
  dish?: {
    id: string;
    canonicalName: string;
    slug: string;
    primaryPhotoPath: string | null;
  } | null;
  place?: {
    id: string;
    name: string;
    city: string | null;
  } | null;
}

export interface FullCollection extends CollectionSummary {
  items: CollectionItemDetail[];
  isOwner: boolean;
}

/**
 * Returns collections belonging to a user (or authenticated user if unspecified).
 */
export async function getUserCollections(targetUserId?: string): Promise<CollectionSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const queryUserId = targetUserId || user?.id;
  if (!queryUserId) return [];

  const { data, error } = await supabase
    .from('collections')
    .select(`
      id, user_id, name, description, cover_photo_path, visibility,
      share_token, is_wishlist, system_key, items_count, likes_count, created_at, updated_at
    `)
    .eq('user_id', queryUserId)
    .order('is_wishlist', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((c) => ({
    id: c.id,
    userId: c.user_id,
    name: c.name,
    description: c.description,
    coverPhotoPath: c.cover_photo_path,
    visibility: c.visibility,
    shareToken: c.share_token,
    isWishlist: c.is_wishlist,
    systemKey: c.system_key,
    itemsCount: c.items_count,
    likesCount: c.likes_count,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

/**
 * Returns public collections for community discovery.
 */
export async function getPublicCollections(limit = 20): Promise<CollectionSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('collections')
    .select(`
      id, user_id, name, description, cover_photo_path, visibility,
      share_token, is_wishlist, items_count, likes_count, created_at, updated_at,
      author:profiles!collections_user_id_fkey(id, username, display_name, avatar_path)
    `)
    .eq('visibility', 'public')
    .order('likes_count', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // Check which ones the user liked
  let likedIds = new Set<string>();
  if (user) {
    const { data: likes } = await supabase
      .from('collection_likes')
      .select('collection_id')
      .eq('user_id', user.id);
    if (likes) {
      likedIds = new Set(likes.map((l) => l.collection_id));
    }
  }

  return data.map((c: any) => ({
    id: c.id,
    userId: c.user_id,
    name: c.name,
    description: c.description,
    coverPhotoPath: c.cover_photo_path,
    visibility: c.visibility,
    shareToken: c.share_token,
    isWishlist: c.is_wishlist,
    systemKey: c.system_key,
    itemsCount: c.items_count,
    likesCount: c.likes_count,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    author: c.author ? {
      id: c.author.id,
      username: c.author.username,
      displayName: c.author.display_name,
      avatarPath: c.author.avatar_path,
    } : undefined,
    hasLiked: likedIds.has(c.id),
  }));
}

/**
 * Returns a full collection with its ordered items.
 * Accepts either collection UUID or share_token (for unlisted sharing).
 */
export async function getCollection(
  idOrToken: string,
  tokenParam?: string
): Promise<FullCollection | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Try fetching by ID first
  let collectionQuery = supabase
    .from('collections')
    .select(`
      id, user_id, name, description, cover_photo_path, visibility,
      share_token, is_wishlist, items_count, likes_count, created_at, updated_at,
      author:profiles!collections_user_id_fkey(id, username, display_name, avatar_path)
    `);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrToken);
  if (isUuid) {
    collectionQuery = collectionQuery.eq('id', idOrToken);
  } else {
    collectionQuery = collectionQuery.eq('share_token', idOrToken);
  }

  const { data: coll, error } = await collectionQuery.maybeSingle();
  if (error || !coll) return null;

  // Verify access for unlisted if accessed by ID with token param
  if (coll.visibility === 'unlisted') {
    const providedToken = tokenParam || (isUuid ? null : idOrToken);
    if (user?.id !== coll.user_id && providedToken !== coll.share_token) {
      return null;
    }
  }

  // Fetch items ordered by fractional position
  // RLS automatically hides private entries belonging to others!
  const { data: itemsData } = await supabase
    .from('collection_items')
    .select(`
      id, collection_id, item_type, note, position, created_at,
      dish:dishes(id, canonical_name, slug, primary_photo_path),
      place:places(id, name, city),
      experience:food_experiences(
        id, title, rating, occurred_at,
        author:profiles!food_experiences_user_id_fkey(username, display_name)
      )
    `)
    .eq('collection_id', coll.id)
    .order('position', { ascending: true });

  // Check like status
  let hasLiked = false;
  if (user) {
    const { data: like } = await supabase
      .from('collection_likes')
      .select('id')
      .eq('collection_id', coll.id)
      .eq('user_id', user.id)
      .maybeSingle();
    hasLiked = !!like;
  }

  const items: CollectionItemDetail[] = (itemsData || []).map((i: any) => ({
    id: i.id,
    collectionId: i.collection_id,
    itemType: i.item_type,
    note: i.note,
    position: i.position,
    createdAt: i.created_at,
    dish: i.dish ? {
      id: i.dish.id,
      canonicalName: i.dish.canonical_name,
      slug: i.dish.slug,
      primaryPhotoPath: i.dish.primary_photo_path,
    } : null,
    place: i.place ? {
      id: i.place.id,
      name: i.place.name,
      city: i.place.city,
    } : null,
    experience: i.experience ? {
      id: i.experience.id,
      title: i.experience.title,
      rating: i.experience.rating,
      occurredAt: i.experience.occurred_at,
      author: {
        username: i.experience.author?.username || 'user',
        displayName: i.experience.author?.display_name || null,
      },
    } : null,
  }));

  return {
    id: coll.id,
    userId: coll.user_id,
    name: coll.name,
    description: coll.description,
    coverPhotoPath: coll.cover_photo_path,
    visibility: coll.visibility,
    shareToken: coll.share_token,
    isWishlist: coll.is_wishlist,
    itemsCount: coll.items_count,
    likesCount: coll.likes_count,
    createdAt: coll.created_at,
    updatedAt: coll.updated_at,
    author: coll.author ? {
      id: (coll.author as any).id,
      username: (coll.author as any).username,
      displayName: (coll.author as any).display_name,
      avatarPath: (coll.author as any).avatar_path,
    } : undefined,
    hasLiked,
    isOwner: user?.id === coll.user_id,
    items,
  };
}

/**
 * Creates a new collection.
 */
export async function createCollection(payload: {
  name: string;
  description?: string;
  visibility?: CollectionVisibility;
  coverPhotoPath?: string;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };
  if (!payload.name.trim()) return { error: 'Name is required' };

  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      visibility: payload.visibility || 'public',
      cover_photo_path: payload.coverPhotoPath || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/collections');
  return { id: data.id };
}

/**
 * Updates a collection.
 */
export async function updateCollection(
  collectionId: string,
  payload: {
    name?: string;
    description?: string;
    visibility?: CollectionVisibility;
    coverPhotoPath?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required' };

  const updates: {
    name?: string;
    description?: string | null;
    visibility?: CollectionVisibility;
    cover_photo_path?: string | null;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };
  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.description !== undefined) updates.description = payload.description.trim() || null;
  if (payload.visibility !== undefined) updates.visibility = payload.visibility;
  if (payload.coverPhotoPath !== undefined) updates.cover_photo_path = payload.coverPhotoPath;

  const { error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', collectionId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/c/${collectionId}`);
  revalidatePath('/collections');
  return { success: true };
}

/**
 * Deletes a collection.
 */
export async function deleteCollection(collectionId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/collections');
  return { success: true };
}

/**
 * Adds an item (experience, dish, or place) to a collection.
 */
export async function addItemToCollection(
  collectionId: string,
  item: {
    itemType: 'experience' | 'dish' | 'place';
    targetId: string;
    note?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required' };

  // Calculate next position: max current position + 1.0
  const { data: maxItem } = await supabase
    .from('collection_items')
    .select('position')
    .eq('collection_id', collectionId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPos = (maxItem?.position ?? 0) + 1.0;

  const insertData: Record<string, any> = {
    collection_id: collectionId,
    item_type: item.itemType,
    note: item.note?.trim() || null,
    position: nextPos,
  };

  if (item.itemType === 'experience') insertData.experience_id = item.targetId;
  else if (item.itemType === 'dish') insertData.dish_id = item.targetId;
  else if (item.itemType === 'place') insertData.place_id = item.targetId;

  const { error } = await supabase
    .from('collection_items')
    .insert(insertData as any);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/c/${collectionId}`);
  return { success: true };
}

/**
 * Removes an item from a collection.
 */
export async function removeItemFromCollection(
  itemId: string,
  collectionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/c/${collectionId}`);
  return { success: true };
}

/**
 * Reorders a collection item using fractional positioning.
 * Calculates new position halfway between prev and next items.
 */
export async function reorderCollectionItem(
  itemId: string,
  collectionId: string,
  newPosition: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase
    .from('collection_items')
    .update({ position: newPosition })
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/c/${collectionId}`);
  return { success: true };
}

/**
 * Toggles like on a collection.
 */
export async function toggleCollectionLike(
  collectionId: string
): Promise<{ liked: boolean; likesCount: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { liked: false, likesCount: 0, error: 'Authentication required' };
  }

  const { data, error } = await supabase.rpc('toggle_collection_like', {
    coll_id: collectionId,
  });

  if (error || !data) {
    return { liked: false, likesCount: 0, error: error?.message || 'Failed to toggle like' };
  }

  revalidatePath(`/c/${collectionId}`);
  return {
    liked: (data as any).liked,
    likesCount: (data as any).likesCount,
  };
}

/**
 * Retrieves or creates the default "Want to try" wishlist collection for the current user.
 */
export async function getOrCreateWishlist(): Promise<{ wishlistId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { data, error } = await supabase.rpc('get_or_create_wishlist', {
    user_uuid: user.id,
  });

  if (error || !data) {
    return { error: error?.message || 'Failed to get wishlist' };
  }

  return { wishlistId: data };
}

/**
 * Retrieves or creates the user's private system collection "Saved" (system_key = 'saved').
 */
export async function getOrCreateSavedCollection(): Promise<{ collectionId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  // 1. Check if Saved collection exists
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', user.id)
    .eq('system_key', 'saved')
    .maybeSingle();

  if (existing) {
    return { collectionId: existing.id };
  }

  // 2. Create Saved system collection
  const { data: created, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name: 'Saved',
      description: 'Your private archive of saved dishes, places, and food experiences.',
      visibility: 'private',
      system_key: 'saved',
      is_wishlist: false,
    })
    .select('id')
    .single();

  if (error || !created) {
    return { error: error?.message || 'Failed to create Saved collection' };
  }

  return { collectionId: created.id };
}

/**
 * Toggles an item in the user's private "Saved" system collection (one-tap bookmarking).
 */
export async function toggleSaveItem(
  itemType: 'experience' | 'dish' | 'place',
  targetId: string
): Promise<{ saved: boolean; error?: string }> {
  const { collectionId, error } = await getOrCreateSavedCollection();
  if (error || !collectionId) return { saved: false, error };

  const supabase = await createClient();

  const fieldMap = {
    experience: 'experience_id',
    dish: 'dish_id',
    place: 'place_id',
  } as const;

  const targetField = fieldMap[itemType];

  const { data: existingItem } = await supabase
    .from('collection_items')
    .select('id')
    .eq('collection_id', collectionId)
    .eq(targetField, targetId)
    .maybeSingle();

  if (existingItem) {
    await removeItemFromCollection(existingItem.id, collectionId);
    return { saved: false };
  } else {
    await addItemToCollection(collectionId, { itemType, targetId });
    return { saved: true };
  }
}

