import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Note: This client uses the SUPABASE_SERVICE_ROLE_KEY and bypasses RLS.
// ONLY use this in secure server environments (e.g., /api/admin/* routes)
// NEVER use this in the browser, or you will expose your entire database.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
