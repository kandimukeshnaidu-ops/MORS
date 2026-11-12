'use server';

import { createClient } from '@/lib/supabase/server';
import {
  RestaurantSearchFilterSchema,
  FoodSearchFilterSchema,
  type RestaurantSearchFilter,
  type FoodSearchFilter,
} from '@mors/domain';

export interface SearchResultItem {
  type: 'dish' | 'place' | 'user' | 'experience' | 'collection';
  id: string;
  title: string;
  subtitle: string | null;
  photoUrl: string | null;
  url: string;
  score: number;
}

export interface SearchOptions {
  types?: string[];
  city?: string;
  limit?: number;
}

export interface RestaurantResult {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  placeType: string | null;
  lat: number | null;
  lng: number | null;
  experienceCount: number;
  ratingCount: number;
  ratingAvg: number | null;
  foodQualityAvg: number | null;
  valueAvg: number | null;
  ambienceAvg: number | null;
  serviceAvg: number | null;
  hygieneAvg: number | null;
  wouldReturnPct: number | null;
  url: string;
  similarity: number;
}

export interface DishResult {
  id: string;
  name: string;
  slug: string;
  cuisine: string | null;
  description: string | null;
  experienceCount: number;
  ratingCount: number;
  ratingAvg: number | null;
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
  similarity: number;
}

/**
 * Searches dining places and restaurants ("Where should I eat?").
 * Excludes unlisted places from non-creators, applies city/cuisine filters,
 * and orders by relevance, community rating, or rating volume.
 */
export async function searchRestaurants(
  filter: Partial<RestaurantSearchFilter>
): Promise<{ results: RestaurantResult[]; timingMs: number; error?: string }> {
  const startTime = Date.now();
  const parsed = RestaurantSearchFilterSchema.safeParse(filter);
  if (!parsed.success) {
    return { results: [], timingMs: 0, error: 'Invalid search parameters' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('find_restaurants', {
    p_query: parsed.data.query || null,
    p_city: parsed.data.city || null,
    p_cuisine: parsed.data.cuisine || null,
    p_place_type: parsed.data.place_type || null,
    p_sort: parsed.data.sort,
    p_limit: parsed.data.limit,
    p_offset: parsed.data.offset,
  });

  const timingMs = Date.now() - startTime;

  if (error || !data) {
    return {
      results: [],
      timingMs,
      error: error?.message || 'Restaurant search query failed',
    };
  }

  const results: RestaurantResult[] = data.map((item) => ({
    id: item.id,
    name: item.name,
    address: item.address,
    city: item.city,
    placeType: item.place_type,
    lat: item.lat,
    lng: item.lng,
    experienceCount: item.public_experience_count,
    ratingCount: Number(item.public_rating_count),
    ratingAvg: item.public_rating_avg ? Number(item.public_rating_avg) : null,
    foodQualityAvg: item.food_quality_avg ? Number(item.food_quality_avg) : null,
    valueAvg: item.value_for_money_avg ? Number(item.value_for_money_avg) : null,
    ambienceAvg: item.ambience_avg ? Number(item.ambience_avg) : null,
    serviceAvg: item.service_avg ? Number(item.service_avg) : null,
    hygieneAvg: item.hygiene_avg ? Number(item.hygiene_avg) : null,
    wouldReturnPct: item.would_return_pct ? Number(item.would_return_pct) : null,
    url: `/place/${item.id}`,
    similarity: item.similarity,
  }));

  return { results, timingMs };
}

/**
 * Searches canonical dishes and food ("What should I eat?").
 * Resolves aliases, retrieves community sub-ratings (taste, portion, value),
 * and surfaces the top places where the community logged the dish.
 */
export async function searchFoodDishes(
  filter: Partial<FoodSearchFilter>
): Promise<{ results: DishResult[]; timingMs: number; error?: string }> {
  const startTime = Date.now();
  const parsed = FoodSearchFilterSchema.safeParse(filter);
  if (!parsed.success) {
    return { results: [], timingMs: 0, error: 'Invalid search parameters' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('find_food_dishes', {
    p_query: parsed.data.query || null,
    p_cuisine: parsed.data.cuisine || null,
    p_dietary_tag: parsed.data.dietary_tag || null,
    p_sort: parsed.data.sort,
    p_limit: parsed.data.limit,
    p_offset: parsed.data.offset,
  });

  const timingMs = Date.now() - startTime;

  if (error || !data) {
    return {
      results: [],
      timingMs,
      error: error?.message || 'Food search query failed',
    };
  }

  const results: DishResult[] = data.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    cuisine: item.cuisine,
    description: item.description,
    experienceCount: item.public_experience_count,
    ratingCount: item.public_rating_count,
    ratingAvg: item.public_rating_avg ? Number(item.public_rating_avg) : null,
    tasteAvg: item.taste_avg ? Number(item.taste_avg) : null,
    portionAvg: item.portion_avg ? Number(item.portion_avg) : null,
    valueAvg: item.value_avg ? Number(item.value_avg) : null,
    topPlaces: Array.isArray(item.top_places) ? item.top_places : [],
    url: `/dish/${item.slug}`,
    similarity: item.similarity,
  }));

  return { results, timingMs };
}

/**
 * Unified Postgres trigram + full-text search across all MORS entities.
 * Kept for backwards compatibility and cross-entity global lookups.
 */
export async function performSearch(
  query: string,
  options: SearchOptions = {}
): Promise<{ results: SearchResultItem[]; timingMs: number; error?: string }> {
  const startTime = Date.now();
  const cleanQuery = query?.trim();

  if (!cleanQuery) {
    return { results: [], timingMs: 0 };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('search_all', {
    p_query: cleanQuery,
    p_types: options.types && options.types.length > 0 ? options.types : null,
    p_city: options.city?.trim() || null,
    p_limit: options.limit || 30,
  });

  const timingMs = Date.now() - startTime;

  if (error || !data) {
    return {
      results: [],
      timingMs,
      error: error?.message || 'Search query failed',
    };
  }

  const results: SearchResultItem[] = data.map((item) => ({
    type: item.result_type as SearchResultItem['type'],
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    photoUrl: item.photo_url,
    url: item.url,
    score: item.score,
  }));

  return { results, timingMs };
}

/**
 * Rapid typeahead suggestions (limit 6) for headers and autocomplete dropdowns.
 */
export async function getSearchSuggestions(
  query: string,
  mode: 'restaurants' | 'food' | 'all' = 'all'
): Promise<SearchResultItem[]> {
  const types = mode === 'restaurants' ? ['place'] : mode === 'food' ? ['dish'] : undefined;
  const res = await performSearch(query, { types, limit: 6 });
  return res.results;
}
