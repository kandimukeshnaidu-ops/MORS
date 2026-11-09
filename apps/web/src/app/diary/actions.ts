'use server';

import { createClient } from '@/lib/supabase/server';
import { getSignedPhotoUrls } from '@/app/log/actions';

export interface CalendarDaySummary {
  day: number;
  count: number;
  thumbnailUrl: string | null;
}

export interface OnThisDayMemory {
  experienceId: string;
  title: string | null;
  dishName: string;
  yearsAgo: number;
  thumbnailUrl: string | null;
  rating: number | null;
}

export interface DiaryEntryItem {
  id: string;
  title: string | null;
  categorySlug: string;
  eatenAt: string;
  status: string;
  visibility: string;
  overallRating: number | null;
  description: string | null;
  placeName: string | null;
  dishes: Array<{ name: string; rating: number | null }>;
  primaryPhotoUrl: string | null;
}

export interface DiaryQueryParams {
  userId: string;
  cursor?: { eatenAt: string; id: string } | null;
  limit?: number;
  category?: string | null;
  minRating?: number | null;
  query?: string | null;
  dateExact?: string | null;
  status?: string | null;
}

/**
 * Retrieves monthly calendar meal counts and thumbnails.
 */
export async function getCalendarMonth(
  userId: string,
  year: number,
  month: number
): Promise<CalendarDaySummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_calendar_month_summary', {
    p_user_id: userId,
    p_year: year,
    p_month: month,
  });

  if (error || !data) {
    console.error('getCalendarMonth error:', error);
    return [];
  }

  // Sign URLs for days that have thumbnails
  const pathsToSign = data
    .map((d) => d.thumbnail_path)
    .filter((p): p is string => Boolean(p));

  const signedMap = pathsToSign.length > 0 ? await getSignedPhotoUrls(pathsToSign) : {};

  return data.map((d) => ({
    day: d.day,
    count: Number(d.count),
    thumbnailUrl: d.thumbnail_path ? signedMap[d.thumbnail_path] || null : null,
  }));
}

/**
 * Retrieves "On this day" memory from prior years.
 */
export async function getOnThisDayMemory(userId: string): Promise<OnThisDayMemory | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_on_this_day_memory', {
    p_user_id: userId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const memory = data[0];
  let thumbnailUrl: string | null = null;
  if (memory.thumbnail_path) {
    const signedMap = await getSignedPhotoUrls([memory.thumbnail_path]);
    thumbnailUrl = signedMap[memory.thumbnail_path] || null;
  }

  return {
    experienceId: memory.experience_id,
    title: memory.title,
    dishName: memory.dish_name,
    yearsAgo: memory.years_ago,
    thumbnailUrl,
    rating: memory.rating,
  };
}

/**
 * Keyset-paginated query for user food diary timeline.
 */
export async function getDiaryEntries(
  params: DiaryQueryParams
): Promise<{ items: DiaryEntryItem[]; nextCursor: { eatenAt: string; id: string } | null }> {
  const {
    userId,
    cursor,
    limit = 15,
    category,
    minRating,
    query,
    dateExact,
    status,
  } = params;

  const supabase = await createClient();

  let queryBuilder = supabase
    .from('food_experiences')
    .select(`
      id,
      title,
      category_slug,
      eaten_at,
      status,
      visibility,
      overall_rating,
      description,
      place_id,
      places:place_id (name)
    `)
    .eq('user_id', userId);

  // Status filter (e.g. only published, or only drafts)
  if (status) {
    queryBuilder = queryBuilder.eq('status', status as 'published' | 'draft');
  }

  // Category filter
  if (category && category !== 'all') {
    queryBuilder = queryBuilder.eq('category_slug', category);
  }

  // Rating filter
  if (minRating && minRating > 0) {
    queryBuilder = queryBuilder.gte('overall_rating', minRating);
  }

  // Exact date filter (e.g. from calendar day click: YYYY-MM-DD)
  if (dateExact) {
    const dayStart = `${dateExact}T00:00:00.000Z`;
    const dayEnd = `${dateExact}T23:59:59.999Z`;
    queryBuilder = queryBuilder.gte('eaten_at', dayStart).lte('eaten_at', dayEnd);
  }

  // Search query across title and description
  if (query && query.trim()) {
    const pattern = `%${query.trim()}%`;
    queryBuilder = queryBuilder.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  // Keyset cursor pagination: (eaten_at, id)
  if (cursor) {
    queryBuilder = queryBuilder.or(
      `eaten_at.lt.${cursor.eatenAt},and(eaten_at.eq.${cursor.eatenAt},id.lt.${cursor.id})`
    );
  }

  queryBuilder = queryBuilder
    .order('eaten_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  const { data: experiences, error } = await queryBuilder;

  if (error || !experiences) {
    console.error('getDiaryEntries error:', error);
    return { items: [], nextCursor: null };
  }

  const hasNextPage = experiences.length > limit;
  const pageRecords = hasNextPage ? experiences.slice(0, limit) : experiences;

  const nextCursor =
    hasNextPage && pageRecords.length > 0
      ? {
          eatenAt: pageRecords[pageRecords.length - 1].eaten_at,
          id: pageRecords[pageRecords.length - 1].id,
        }
      : null;

  if (pageRecords.length === 0) {
    return { items: [], nextCursor: null };
  }

  const expIds = pageRecords.map((r) => r.id);

  // Fetch dishes for these experiences
  const { data: dishes } = await supabase
    .from('experience_dishes')
    .select('experience_id, display_name, rating, position')
    .in('experience_id', expIds)
    .order('position', { ascending: true });

  const dishesMap: Record<string, Array<{ name: string; rating: number | null }>> = {};
  for (const d of dishes || []) {
    if (!dishesMap[d.experience_id]) dishesMap[d.experience_id] = [];
    dishesMap[d.experience_id].push({ name: d.display_name, rating: d.rating });
  }

  // Fetch primary photo for each experience
  const { data: photos } = await supabase
    .from('experience_photos')
    .select('experience_id, storage_path, position')
    .in('experience_id', expIds)
    .order('position', { ascending: true });

  const primaryPhotoMap: Record<string, string> = {};
  const pathsToSign: string[] = [];
  for (const p of photos || []) {
    if (!primaryPhotoMap[p.experience_id]) {
      primaryPhotoMap[p.experience_id] = p.storage_path;
      pathsToSign.push(p.storage_path);
    }
  }

  const signedMap = pathsToSign.length > 0 ? await getSignedPhotoUrls(pathsToSign) : {};

  const items: DiaryEntryItem[] = pageRecords.map((r) => {
    const rawPlace = r.places as unknown as { name: string } | null;
    const photoPath = primaryPhotoMap[r.id];
    return {
      id: r.id,
      title: r.title,
      categorySlug: r.category_slug,
      eatenAt: r.eaten_at,
      status: r.status,
      visibility: r.visibility,
      overallRating: r.overall_rating,
      description: r.description,
      placeName: rawPlace?.name || null,
      dishes: dishesMap[r.id] || [],
      primaryPhotoUrl: photoPath ? signedMap[photoPath] || null : null,
    };
  });

  return { items, nextCursor };
}
