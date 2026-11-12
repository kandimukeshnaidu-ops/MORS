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
    tasteAvg: number | null;
    tasteCount: number;
    portionAvg: number | null;
    portionCount: number;
    valueAvg: number | null;
    valueCount: number;
  };
  ranking?: {
    region: string;
    rank: number | null;
    bayesianScore: number | null;
    isRanked: boolean;
  };
  placesLogged: Array<{
    placeId: string;
    placeName: string;
    city: string | null;
    address: string | null;
    timesLogged: number;
    dishRatingCount: number;
    localDishRatingAvg: number | null;
    placeRatingAvg: number | null;
  }>;
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
    dishTaste?: number | null;
    dishPortion?: number | null;
    dishValue?: number | null;
    note: string | null;
    eatenAt: string;
    thumbnailUrl: string | null;
    place?: { id: string; name: string; city: string | null } | null;
  }>;
  translations?: Array<{ locale: string; name: string }>;
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
    publicRatingCount: number;
    publicRatingAvg: number | null;
    foodQualityAvg: number | null;
    foodQualityCount: number;
    valueForMoneyAvg: number | null;
    valueForMoneyCount: number;
    ambienceAvg: number | null;
    ambienceCount: number;
    serviceAvg: number | null;
    serviceCount: number;
    hygieneAvg: number | null;
    hygieneCount: number;
  };
  ranking?: {
    city: string | null;
    rank: number | null;
    bayesianScore: number | null;
    isRanked: boolean;
  };
  dishesLogged: Array<{
    dishId: string;
    dishName: string;
    dishSlug: string;
    cuisine: string | null;
    timesLogged: number;
    dishRatingCount: number;
    localDishRatingAvg: number | null;
    tasteAvg: number | null;
  }>;
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
 * Retrieves public dish data, community consensus, and viewer personal ratings via get_dish_profile RPC.
 */
export async function getDishBySlug(slug: string): Promise<PublicDishData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Call PostgreSQL RPC get_dish_profile with strict public-pool isolation
  const { data, error } = await supabase.rpc('get_dish_profile', {
    p_slug: slug,
    p_viewer_id: user?.id || null,
  });

  if (error || !data) {
    return null;
  }

  const profile = data as {
    dish: {
      id: string;
      name: string;
      slug: string;
      cuisine: string | null;
      description: string | null;
      translations: Array<{ locale: string; name: string }>;
    };
    stats: {
      public_experience_count: number;
      public_rating_count: number;
      public_rating_avg: number | null;
      taste_avg: number | null;
      taste_count: number;
      portion_avg: number | null;
      portion_count: number;
      value_avg: number | null;
      value_count: number;
    };
    ranking?: {
      region: string;
      rank: number | null;
      bayesian_score: number | null;
      is_ranked: boolean;
    };
    places_logged: Array<{
      place_id: string;
      place_name: string;
      city: string | null;
      address: string | null;
      times_logged: number;
      dish_rating_count: number;
      local_dish_rating_avg: number | null;
      place_rating_avg: number | null;
    }>;
    viewer_personal: {
      experience_count: number;
      rating_avg: number | null;
      latest_rating: number | null;
    } | null;
    recent_experiences: Array<{
      id: string;
      title: string | null;
      eaten_at: string;
      dish_rating: number | null;
      dish_taste: number | null;
      dish_portion: number | null;
      dish_value: number | null;
      dish_note: string | null;
      place?: { id: string; name: string; city: string | null } | null;
      author: { id: string; username: string; display_name: string | null; avatar_path: string | null };
      primary_photo_path: string | null;
    }>;
  };

  // Sign experience photos if any
  const photoPaths = (profile.recent_experiences || [])
    .map((e) => e.primary_photo_path)
    .filter((p): p is string => Boolean(p));

  let signedPhotoMap: Record<string, string> = {};
  if (photoPaths.length > 0) {
    signedPhotoMap = await getSignedPhotoUrls(photoPaths);
  }

  return {
    id: profile.dish.id,
    name: profile.dish.name,
    slug: profile.dish.slug,
    cuisine: profile.dish.cuisine,
    description: profile.dish.description,
    translations: profile.dish.translations,
    stats: {
      publicExperienceCount: profile.stats.public_experience_count || 0,
      publicRatingCount: profile.stats.public_rating_count || 0,
      publicRatingAvg: profile.stats.public_rating_avg !== null ? Number(profile.stats.public_rating_avg) : null,
      tasteAvg: profile.stats.taste_avg !== null ? Number(profile.stats.taste_avg) : null,
      tasteCount: profile.stats.taste_count || 0,
      portionAvg: profile.stats.portion_avg !== null ? Number(profile.stats.portion_avg) : null,
      portionCount: profile.stats.portion_count || 0,
      valueAvg: profile.stats.value_avg !== null ? Number(profile.stats.value_avg) : null,
      valueCount: profile.stats.value_count || 0,
    },
    ranking: profile.ranking
      ? {
          region: profile.ranking.region,
          rank: profile.ranking.rank,
          bayesianScore: profile.ranking.bayesian_score,
          isRanked: profile.ranking.is_ranked,
        }
      : undefined,
    placesLogged: (profile.places_logged || []).map((pl) => ({
      placeId: pl.place_id,
      placeName: pl.place_name,
      city: pl.city,
      address: pl.address,
      timesLogged: pl.times_logged,
      dishRatingCount: pl.dish_rating_count,
      localDishRatingAvg: pl.local_dish_rating_avg !== null ? Number(pl.local_dish_rating_avg) : null,
      placeRatingAvg: pl.place_rating_avg !== null ? Number(pl.place_rating_avg) : null,
    })),
    viewerPersonal: profile.viewer_personal
      ? {
          experienceCount: profile.viewer_personal.experience_count,
          ratingAvg: profile.viewer_personal.rating_avg !== null ? Number(profile.viewer_personal.rating_avg) : null,
          latestRating: profile.viewer_personal.latest_rating,
        }
      : null,
    recentExperiences: (profile.recent_experiences || []).map((re) => ({
      id: re.id,
      title: re.title,
      author: {
        username: re.author.username,
        displayName: re.author.display_name,
      },
      rating: re.dish_rating,
      dishTaste: re.dish_taste,
      dishPortion: re.dish_portion,
      dishValue: re.dish_value,
      note: re.dish_note,
      eatenAt: re.eaten_at,
      thumbnailUrl: re.primary_photo_path ? signedPhotoMap[re.primary_photo_path] || null : null,
      place: re.place || null,
    })),
  };
}

/**
 * Retrieves public place data, branches, 5-dimension scorecard, "What to Order", and public experiences via get_place_profile RPC.
 */
export async function getPlaceById(id: string): Promise<PublicPlaceData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Call PostgreSQL RPC get_place_profile with strict public-pool isolation
  const { data, error } = await supabase.rpc('get_place_profile', {
    p_place_id: id,
    p_viewer_id: user?.id || null,
  });

  if (error || !data) {
    return null;
  }

  const profile = data as {
    place: {
      id: string;
      name: string;
      city: string | null;
      address: string | null;
      parent_place: { id: string; name: string } | null;
      branches: Array<{ id: string; name: string; city: string | null }>;
    };
    stats: {
      public_experience_count: number;
      public_rating_count: number;
      public_rating_avg: number | null;
      food_quality_avg: number | null;
      food_quality_count: number;
      value_for_money_avg: number | null;
      value_for_money_count: number;
      ambience_avg: number | null;
      ambience_count: number;
      service_avg: number | null;
      service_count: number;
      hygiene_avg: number | null;
      hygiene_count: number;
    };
    ranking?: {
      city: string | null;
      rank: number | null;
      bayesian_score: number | null;
      is_ranked: boolean;
    };
    dishes_logged: Array<{
      dish_id: string;
      dish_name: string;
      dish_slug: string;
      cuisine: string | null;
      times_logged: number;
      dish_rating_count: number;
      local_dish_rating_avg: number | null;
      taste_avg: number | null;
    }>;
    viewer_personal: {
      visit_count: number;
      latest_rating: number | null;
    } | null;
    recent_experiences: Array<{
      id: string;
      title: string | null;
      eaten_at: string;
      overall_rating: number | null;
      place_rating_overall: number | null;
      place_rating_food: number | null;
      place_rating_value: number | null;
      place_rating_ambience: number | null;
      place_rating_service: number | null;
      place_rating_hygiene: number | null;
      dining_context: string | null;
      would_return: boolean | null;
      description: string | null;
      author: { id: string; username: string; display_name: string | null; avatar_path: string | null };
      dishes_summary: string | null;
      primary_photo_path: string | null;
    }>;
  };

  // Sign experience photos if any
  const photoPaths = (profile.recent_experiences || [])
    .map((e) => e.primary_photo_path)
    .filter((p): p is string => Boolean(p));

  let signedPhotoMap: Record<string, string> = {};
  if (photoPaths.length > 0) {
    signedPhotoMap = await getSignedPhotoUrls(photoPaths);
  }

  return {
    id: profile.place.id,
    name: profile.place.name,
    city: profile.place.city,
    address: profile.place.address,
    parentPlace: profile.place.parent_place,
    branches: profile.place.branches || [],
    stats: {
      publicExperienceCount: profile.stats.public_experience_count || 0,
      publicRatingCount: profile.stats.public_rating_count || 0,
      publicRatingAvg: profile.stats.public_rating_avg !== null ? Number(profile.stats.public_rating_avg) : null,
      foodQualityAvg: profile.stats.food_quality_avg !== null ? Number(profile.stats.food_quality_avg) : null,
      foodQualityCount: profile.stats.food_quality_count || 0,
      valueForMoneyAvg: profile.stats.value_for_money_avg !== null ? Number(profile.stats.value_for_money_avg) : null,
      valueForMoneyCount: profile.stats.value_for_money_count || 0,
      ambienceAvg: profile.stats.ambience_avg !== null ? Number(profile.stats.ambience_avg) : null,
      ambienceCount: profile.stats.ambience_count || 0,
      serviceAvg: profile.stats.service_avg !== null ? Number(profile.stats.service_avg) : null,
      serviceCount: profile.stats.service_count || 0,
      hygieneAvg: profile.stats.hygiene_avg !== null ? Number(profile.stats.hygiene_avg) : null,
      hygieneCount: profile.stats.hygiene_count || 0,
    },
    ranking: profile.ranking
      ? {
          city: profile.ranking.city,
          rank: profile.ranking.rank,
          bayesianScore: profile.ranking.bayesian_score,
          isRanked: profile.ranking.is_ranked,
        }
      : undefined,
    dishesLogged: (profile.dishes_logged || []).map((d) => ({
      dishId: d.dish_id,
      dishName: d.dish_name,
      dishSlug: d.dish_slug,
      cuisine: d.cuisine,
      timesLogged: d.times_logged,
      dishRatingCount: d.dish_rating_count,
      localDishRatingAvg: d.local_dish_rating_avg !== null ? Number(d.local_dish_rating_avg) : null,
      tasteAvg: d.taste_avg !== null ? Number(d.taste_avg) : null,
    })),
    viewerPersonal: profile.viewer_personal
      ? {
          visitCount: profile.viewer_personal.visit_count,
          latestRating: profile.viewer_personal.latest_rating,
        }
      : null,
    recentExperiences: (profile.recent_experiences || []).map((re) => ({
      id: re.id,
      title: re.title,
      author: {
        username: re.author.username,
        displayName: re.author.display_name,
      },
      overallRating: re.place_rating_overall || re.overall_rating,
      eatenAt: re.eaten_at,
      thumbnailUrl: re.primary_photo_path ? signedPhotoMap[re.primary_photo_path] || null : null,
      dishesSummary: re.dishes_summary || '',
    })),
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
