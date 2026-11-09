import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'

export interface AuthenticatedProfile {
  id: string
  email: string
  fullName: string
}

function mapSupabaseUser(user: User): AuthenticatedProfile {
  const email = user.email
  if (!email) throw new Error('The authenticated account does not have an email address.')
  const fullName = user.user_metadata.full_name
  return {
    id: user.id,
    email,
    fullName: typeof fullName === 'string' ? fullName : email,
  }
}

export const supabaseAuthService = {
  async signUp(fullName: string, email: string, password: string) {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase authentication is not configured.')
    const { data, error } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    return {
      profile: data.user ? mapSupabaseUser(data.user) : null,
      verificationRequired: data.session === null,
    }
  },

  async signIn(email: string, password: string) {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase authentication is not configured.')
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw error
    if (!data.user) throw new Error('Authentication succeeded without an account profile.')
    return mapSupabaseUser(data.user)
  },

  async requestPasswordReset(email: string) {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase authentication is not configured.')
    const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  async signInWithGoogle() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase authentication is not configured.')
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) throw error
  },

  async updatePassword(password: string) {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase authentication is not configured.')
    const { error } = await client.auth.updateUser({ password })
    if (error) throw error
  },

  async updateFullName(fullName: string) {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase authentication is not configured.')
    const { data, error } = await client.auth.updateUser({
      data: { full_name: fullName.trim() },
    })
    if (error) throw error
    if (!data.user) throw new Error('The profile update returned no authenticated account.')
    return mapSupabaseUser(data.user)
  },
}
