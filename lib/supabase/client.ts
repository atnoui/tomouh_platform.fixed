import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types';

/**
 * Supabase client for use inside Client Components ('use client').
 * Safe to call multiple times — @supabase/ssr reuses the underlying
 * connection and keeps cookies in sync with the server client below.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
