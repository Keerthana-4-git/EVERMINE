import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const supabaseConfiguration =
  supabaseUrl || supabaseAnonKey
    ? supabaseUrl && supabaseAnonKey
      ? 'configured'
      : 'incomplete'
    : 'not-configured'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseConfiguration === 'incomplete') {
    throw new Error(
      'Supabase configuration is incomplete. Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }
  if (supabaseConfiguration === 'not-configured') return null
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  }
  return client
}
