import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@mors/db';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-placeholder';

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
