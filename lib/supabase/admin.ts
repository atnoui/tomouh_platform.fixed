import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';

/**
 * Service-role Supabase client. NEVER import this from a Client Component —
 * it bypasses Row Level Security entirely. It is only used server-side, in
 * the admin-registration server action, to create a fully-confirmed admin
 * account once the secret Admin Key has been verified.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your .env.local file (Supabase dashboard → Project Settings → API → service_role key).'
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
