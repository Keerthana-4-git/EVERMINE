import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  clearDemoSession,
  readSession,
  registerDemoAccount,
  resetDemoPassword,
  signInDemo,
  updateDemoProfileName,
} from './authStorage'
import { AuthContext } from './auth-context'
import type { AuthUser } from './auth-context'
import { supabaseConfiguration, getSupabaseClient } from '../lib/supabase'
import { supabaseAuthService } from '../services/supabaseAuthService'

function mapSession(session: Session | null): AuthUser | null {
  const account = session?.user
  if (!account?.email) return null
  const fullName = account.user_metadata.full_name
  return {
    id: account.id,
    email: account.email,
    fullName: typeof fullName === 'string' ? fullName : account.email,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authMode = supabaseConfiguration === 'not-configured' ? 'local-demo' : 'supabase'
  const [user, setUser] = useState<AuthUser | null>(() =>
    authMode === 'local-demo'
      ? (() => {
          const session = readSession()
          return session ? { ...session, id: null } : null
        })()
      : null,
  )
  const [authReady, setAuthReady] = useState(authMode === 'local-demo')
  const [authConfigurationError, setAuthConfigurationError] = useState('')

  useEffect(() => {
    if (authMode === 'local-demo') return
    let active = true
    let unsubscribe = () => {}
    void Promise.resolve().then(async () => {
      if (!active) return
      try {
        const client = getSupabaseClient()
        if (!client) throw new Error('Supabase authentication is not configured.')
        const { data } = client.auth.onAuthStateChange((_event, session) => {
          if (!active) return
          setUser(mapSession(session))
          setAuthReady(true)
        })
        unsubscribe = () => data.subscription.unsubscribe()
        const { data: sessionData, error } = await client.auth.getSession()
        if (!active) return
        if (error) {
          setAuthConfigurationError(error.message)
          setUser(null)
        } else {
          setUser(mapSession(sessionData.session))
        }
        setAuthReady(true)
      } catch (error) {
        if (!active) return
        setAuthConfigurationError(
          error instanceof Error ? error.message : 'Supabase configuration is invalid.',
        )
        setAuthReady(true)
      }
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [authMode])

  async function signUp(name: string, email: string, password: string) {
    if (authMode === 'supabase') {
      const result = await supabaseAuthService.signUp(name, email, password)
      if (result.profile) setUser({ ...result.profile })
      return !result.verificationRequired
    }
    const nextUser = await registerDemoAccount(name, email, password)
    setUser({ ...nextUser, id: null })
    return true
  }

  async function signIn(email: string, password: string, rememberMe: boolean) {
    if (authMode === 'supabase') {
      void rememberMe
      const nextUser = await supabaseAuthService.signIn(email, password)
      setUser({ ...nextUser })
      return
    }
    const nextUser = await signInDemo(email, password, rememberMe)
    setUser({ ...nextUser, id: null })
  }

  async function resetPassword(email: string, password?: string) {
    if (authMode === 'supabase') {
      await supabaseAuthService.requestPasswordReset(email)
      return
    }
    if (!password) throw new Error('Enter a new password to reset your local demo account.')
    await resetDemoPassword(email, password)
  }

  async function updatePassword(password: string) {
    if (authMode === 'supabase') {
      await supabaseAuthService.updatePassword(password)
      return
    }
    throw new Error('Password reset is available from the local sign-in screen.')
  }

  async function signInWithGoogle() {
    if (authMode !== 'supabase') throw new Error('Google sign-in requires Supabase configuration.')
    await supabaseAuthService.signInWithGoogle()
  }

  async function updateProfileName(fullName: string) {
    if (!user) throw new Error('Sign in before updating your profile.')
    if (authMode === 'supabase') {
      setUser({ ...(await supabaseAuthService.updateFullName(fullName)) })
    } else {
      setUser({ ...updateDemoProfileName(user.email, fullName), id: null })
    }
  }

  async function signOut() {
    if (authMode === 'supabase') {
      const client = getSupabaseClient()
      if (!client) throw new Error('Supabase authentication is not configured.')
      const { error } = await client.auth.signOut()
      if (error) throw error
    } else {
      clearDemoSession()
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authMode,
        authReady,
        authConfigurationError,
        signUp,
        signIn,
        resetPassword,
        updatePassword,
        signInWithGoogle,
        updateProfileName,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
