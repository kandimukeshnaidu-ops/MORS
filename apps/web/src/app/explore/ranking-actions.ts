'use server';

import { createClient } from '@/lib/supabase/server';

export interface RankedRestaurantItem {
  rankPosition: number;
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  placeType: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  bayesianScore: number | null;
  isRanked: boolean;
  foodQualityAvg: number | null;
  valueAvg: number | null;
  ambienceAvg: number | null;
  serviceAvg: number | null;
  hygieneAvg: number | null;
  wouldReturnPct: number | null;
  url: string;
}

export interface RankedDishItem {
  rankPosition: number;
  id: string;
  name: string;
  slug: string;
  cuisine: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  bayesianScore: number | null;
  isRanked: boolean;
  tasteAvg: number | null;
  portionAvg: number | null;
  valueAvg: number | null;
  topPlaces: Array<{
    place_id: string;
    place_name: string;
    city: string | null;
    logs_count: number;
  }>;
  url: string;
}

export interface RegionalOverview {
  cityName: string;
  totalVenues: number;
  rankedVenues: number;
  totalDishes: number;
  rankedDishes: number;
  regionalAvgRating: number | null;
}

export async function fetchRegionalRestaurantRankings(options: {
  city?: string;
  cuisine?: string;
  dimension?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ rankings: RankedRestaurantItem[]; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_regional_restaurant_rankings', {
    p_city: options.city?.trim() || 'Hyderabad',
    p_cuisine: options.cuisine?.trim() || null,
    p_dimension: options.dimension || 'overall',
    p_limit: options.limit || 20,
    p_offset: options.offset || 0,
  });

  if (error || !data) {
    return { rankings: [], error: error?.message || 'Failed to fetch restaurant rankings' };
  }

  const rankings: RankedRestaurantItem[] = data.map((item) => ({
    rankPosition: Number(item.rank_position),
    id: item.id,
    name: item.name,
    address: item.address,
    city: item.city,
    placeType: item.place_type,
    ratingAvg: item.rating_avg ? Number(item.rating_avg) : null,
    ratingCount: Number(item.rating_count),
    bayesianScore: item.bayesian_score ? Number(item.bayesian_score) : null,
    isRanked: item.is_ranked,
    foodQualityAvg: item.food_quality_avg ? Number(item.food_quality_avg) : null,
    valueAvg: item.value_avg ? Number(item.value_avg) : null,
    ambienceAvg: item.ambience_avg ? Number(item.ambience_avg) : null,
    serviceAvg: item.service_avg ? Number(item.service_avg) : null,
    hygieneAvg: item.hygiene_avg ? Number(item.hygiene_avg) : null,
    wouldReturnPct: item.would_return_pct ? Number(item.would_return_pct) : null,
    url: `/place/${item.id}`,
  }));

  return { rankings };
}

export async function fetchRegionalDishRankings(options: {
  city?: string;
  cuisine?: string;
  dimension?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ rankings: RankedDishItem[]; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_regional_dish_rankings', {
    p_city: options.city?.trim() || 'Hyderabad',
    p_cuisine: options.cuisine?.trim() || null,
    p_dimension: options.dimension || 'overall',
    p_limit: options.limit || 20,
    p_offset: options.offset || 0,
  });

  if (error || !data) {
    return { rankings: [], error: error?.message || 'Failed to fetch dish rankings' };
  }

  const rankings: RankedDishItem[] = data.map((item) => ({
    rankPosition: Number(item.rank_position),
    id: item.id,
    name: item.name,
    slug: item.slug,
    cuisine: item.cuisine,
    ratingAvg: item.rating_avg ? Number(item.rating_avg) : null,
    ratingCount: Number(item.rating_count),
    bayesianScore: item.bayesian_score ? Number(item.bayesian_score) : null,
    isRanked: item.is_ranked,
    tasteAvg: item.taste_avg ? Number(item.taste_avg) : null,
    portionAvg: item.portion_avg ? Number(item.portion_avg) : null,
    valueAvg: item.value_avg ? Number(item.value_avg) : null,
    topPlaces: Array.isArray(item.top_places) ? item.top_places : [],
    url: `/dish/${item.slug}`,
  }));

  return { rankings };
}

export async function fetchRegionalOverview(
  city: string = 'Hyderabad'
): Promise<{ overview: RegionalOverview | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_regional_overview', {
    p_city: city.trim() || 'Hyderabad',
  });

  if (error || !data || data.length === 0) {
    return { overview: null, error: error?.message || 'Failed to fetch regional overview' };
  }

  const row = data[0];
  return {
    overview: {
      cityName: row.city_name,
      totalVenues: Number(row.total_venues),
      rankedVenues: Number(row.ranked_venues),
      totalDishes: Number(row.total_dishes),
      rankedDishes: Number(row.ranked_dishes),
      regionalAvgRating: row.regional_avg_rating ? Number(row.regional_avg_rating) : null,
    },
  };
}
