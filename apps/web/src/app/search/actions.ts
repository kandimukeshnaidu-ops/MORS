'use server';

import { createClient } from '@/lib/supabase/server';

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

/**
 * Executes unified Postgres trigram + full-text search across MORS entities.
 * Security Invoker guarantees that private entries/collections and blocked users
 * are never included or leaked.
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
    type: item.result_type,
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
 * Returns rapid typeahead suggestions (limit 6) for autocomplete in headers.
 */
export async function getSearchSuggestions(query: string): Promise<SearchResultItem[]> {
  const res = await performSearch(query, { limit: 6 });
  return res.results;
}
