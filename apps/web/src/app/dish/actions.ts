'use server';

import { createClient } from '@/lib/supabase/server';
import { getSignedPhotoUrls } from '@/app/log/actions';
import { revalidatePath } from 'next/cache';

export interface PublicDishData {
  id: string;
  name: string;
  slug: string;
  cuisine: string | null;
  description: string | null;
  stats: {
    publicExperienceCount: number;
    publicRatingCount: number;
    publicRatingAvg: number | null;
  };
  viewerPersonal: {
    experienceCount: number;
    ratingAvg: number | null;
    latestRating: number | null;
  } | null;
  recentExperiences: Array<{
    id: string;
    title: string | null;
    author: { username: string; displayName: string | null };
    rating: number | null;
    note: string | null;
    eatenAt: string;
    thumbnailUrl: string | null;
  }>;
}

export interface PublicPlaceData {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  parentPlace: { id: string; name: string } | null;
  branches: Array<{ id: string; name: string; city: string | null }>;
  stats: {
    publicExperienceCount: number;
    publicRatingAvg: number | null;
  };
  viewerPersonal: {
    visitCount: number;
    latestRating: number | null;
  } | null;
  recentExperiences: Array<{
    id: string;
    title: string | null;
    author: { username: string; displayName: string | null };
    overallRating: number | null;
    eatenAt: string;
    thumbnailUrl: string | null;
    dishesSummary: string;
  }>;
}

/**
 * Retrieves public dish data, community consensus, and viewer personal ratings.
 */
export async function getDishBySlug(slug: string): Promise<PublicDishData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch dish
  const { data: dish, error } = await supabase
    .from('dishes')
    .select('id, name, slug, cuisine, description, merged_into_id')
    .eq('slug', slug)
    .single();

  if (error || !dish) {
    return null;
  }

  // Follow redirect if merged
  let canonicalDish = dish;
  if (dish.merged_into_id) {
    const { data: canonical } = await supabase
      .from('dishes')
      .select('id, name, slug, cuisine, description, merged_into_id')
      .eq('id', dish.merged_into_id)
      .single();
    if (canonical) canonicalDish = canonical;
  }

  // 2. Fetch community statistics from view
  const { data: statsRow } = await supabase
    .from('dish_public_stats')
    .select('public_experience_count, public_rating_count, public_rating_avg')
    .eq('dish_id', canonicalDish.id)
    .single();

  const stats = {
    publicExperienceCount: statsRow?.public_experience_count || 0,
    publicRatingCount: statsRow?.public_rating_count || 0,
    publicRatingAvg: statsRow?.public_rating_avg ? Number(statsRow.public_rating_avg) : null,
  };

  // 3. Fetch viewer's own rating if authenticated
  let viewerPersonal: PublicDishData['viewerPersonal'] = null;
  if (user) {
    const { data: userDishes } = await supabase
      .from('experience_dishes')
      .select(`
        rating,
        food_experiences!inner (user_id)
      `)
      .eq('dish_id', canonicalDish.id)
      .eq('food_experiences.user_id', user.id);

    if (userDishes && userDishes.length > 0) {
      const rated = userDishes.filter((ud) => ud.rating !== null).map((ud) => ud.rating as number);
      const avg = rated.length > 0 ? rated.reduce((a, b) => a + b, 0) / rated.length : null;
      viewerPersonal = {
        experienceCount: userDishes.length,
        ratingAvg: avg !== null ? Math.round(avg * 10) / 10 : null,
        latestRating: rated[rated.length - 1] || null,
      };
    }
  }

  // 4. Fetch publicly visible experiences for this dish
  const { data: expDishes } = await supabase
    .from('experience_dishes')
    .select(`
      rating,
      note,
      experience_id,
      food_experiences!inner (
        id,
        title,
        eaten_at,
        status,
        visibility,
        user_id,
        profiles:user_id (username, display_name)
      )
    `)
    .eq('dish_id', canonicalDish.id)
    .eq('food_experiences.status', 'published')
    .eq('food_experiences.visibility', 'public')
    .limit(10);

  const expIds = (expDishes || []).map((ed) => ed.experience_id);

  // Fetch photos for these experiences
  let signedPhotoMap: Record<string, string> = {};
  if (expIds.length > 0) {
    const { data: photos } = await supabase
      .from('experience_photos')
      .select('experience_id, storage_path, position')
      .in('experience_id', expIds)
      .order('position', { ascending: true });

    const pathsToSign: string[] = [];
    for (const p of photos || []) {
      if (!signedPhotoMap[p.experience_id]) {
        signedPhotoMap[p.experience_id] = p.storage_path;
        pathsToSign.push(p.storage_path);
      }
    }

    if (pathsToSign.length > 0) {
      signedPhotoMap = await getSignedPhotoUrls(pathsToSign);
    }
  }

  const recentExperiences = (expDishes || []).map((ed) => {
    const fe = ed.food_experiences as unknown as {
      id: string;
      title: string | null;
      eaten_at: string;
      profiles: { username: string; display_name: string | null };
    };

    return {
      id: fe.id,
      title: fe.title,
      author: {
        username: fe.profiles?.username || 'unknown',
        displayName: fe.profiles?.display_name || null,
      },
      rating: ed.rating,
      note: ed.note,
      eatenAt: fe.eaten_at,
      thumbnailUrl: signedPhotoMap[fe.id] || null,
    };
  });

  return {
    id: canonicalDish.id,
    name: canonicalDish.name,
    slug: canonicalDish.slug,
    cuisine: canonicalDish.cuisine,
    description: canonicalDish.description,
    stats,
    viewerPersonal,
    recentExperiences,
  };
}

/**
 * Retrieves public place data, branches, community ratings, and public experiences.
 */
export async function getPlaceById(id: string): Promise<PublicPlaceData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: place, error } = await supabase
    .from('places')
    .select('id, name, city, address, parent_place_id, merged_into_id')
    .eq('id', id)
    .single();

  if (error || !place) {
    return null;
  }

  let canonicalPlace = place;
  if (place.merged_into_id) {
    const { data: canonical } = await supabase
      .from('places')
      .select('id, name, city, address, parent_place_id, merged_into_id')
      .eq('id', place.merged_into_id)
      .single();
    if (canonical) canonicalPlace = canonical;
  }

  // Fetch parent place if branch
  let parentPlace: PublicPlaceData['parentPlace'] = null;
  if (canonicalPlace.parent_place_id) {
    const { data: parent } = await supabase
      .from('places')
      .select('id, name')
      .eq('id', canonicalPlace.parent_place_id)
      .single();
    if (parent) parentPlace = parent;
  }

  // Fetch branches
  const { data: branchesData } = await supabase
    .from('places')
    .select('id, name, city')
    .eq('parent_place_id', canonicalPlace.id);

  const branches = (branchesData || []).map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city,
  }));

  // Fetch community stats from view
  const { data: statsRow } = await supabase
    .from('place_public_stats')
    .select('public_experience_count, public_rating_avg')
    .eq('place_id', canonicalPlace.id)
    .single();

  const stats = {
    publicExperienceCount: statsRow?.public_experience_count || 0,
    publicRatingAvg: statsRow?.public_rating_avg ? Number(statsRow.public_rating_avg) : null,
  };

  // Viewer personal visits
  let viewerPersonal: PublicPlaceData['viewerPersonal'] = null;
  if (user) {
    const { data: visits } = await supabase
      .from('food_experiences')
      .select('overall_rating')
      .eq('place_id', canonicalPlace.id)
      .eq('user_id', user.id);

    if (visits && visits.length > 0) {
      const rated = visits.filter((v) => v.overall_rating !== null).map((v) => v.overall_rating as number);
      viewerPersonal = {
        visitCount: visits.length,
        latestRating: rated[rated.length - 1] || null,
      };
    }
  }

  // Public experiences at this place
  const { data: experiences } = await supabase
    .from('food_experiences')
    .select(`
      id,
      title,
      overall_rating,
      eaten_at,
      profiles:user_id (username, display_name)
    `)
    .eq('place_id', canonicalPlace.id)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('eaten_at', { ascending: false })
    .limit(10);

  const expIds = (experiences || []).map((e) => e.id);

  let signedPhotoMap: Record<string, string> = {};
  const dishesSummaryMap: Record<string, string> = {};

  if (expIds.length > 0) {
    const { data: photos } = await supabase
      .from('experience_photos')
      .select('experience_id, storage_path, position')
      .in('experience_id', expIds)
      .order('position', { ascending: true });

    const pathsToSign: string[] = [];
    for (const p of photos || []) {
      if (!signedPhotoMap[p.experience_id]) {
        signedPhotoMap[p.experience_id] = p.storage_path;
        pathsToSign.push(p.storage_path);
      }
    }
    if (pathsToSign.length > 0) {
      signedPhotoMap = await getSignedPhotoUrls(pathsToSign);
    }

    const { data: dishes } = await supabase
      .from('experience_dishes')
      .select('experience_id, display_name')
      .in('experience_id', expIds);

    for (const d of dishes || []) {
      dishesSummaryMap[d.experience_id] = dishesSummaryMap[d.experience_id]
        ? `${dishesSummaryMap[d.experience_id]}, ${d.display_name}`
        : d.display_name;
    }
  }

  const recentExperiences = (experiences || []).map((e) => {
    const prof = e.profiles as unknown as { username: string; display_name: string | null };
    return {
      id: e.id,
      title: e.title,
      author: {
        username: prof?.username || 'unknown',
        displayName: prof?.display_name || null,
      },
      overallRating: e.overall_rating,
      eatenAt: e.eaten_at,
      thumbnailUrl: signedPhotoMap[e.id] || null,
      dishesSummary: dishesSummaryMap[e.id] || '',
    };
  });

  return {
    id: canonicalPlace.id,
    name: canonicalPlace.name,
    city: canonicalPlace.city,
    address: canonicalPlace.address,
    parentPlace,
    branches,
    stats,
    viewerPersonal,
    recentExperiences,
  };
}

/**
 * Merges source dish into target dish.
 */
export async function mergeDishes(sourceId: string, targetId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('merge_dishes', {
    p_source_id: sourceId,
    p_target_id: targetId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Merges source place into target place.
 */
export async function mergePlaces(sourceId: string, targetId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('merge_places', {
    p_source_id: sourceId,
    p_target_id: targetId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}
