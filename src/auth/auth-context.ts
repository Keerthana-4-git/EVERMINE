import { createContext } from 'react'
import type { DemoUser } from './authStorage'

export type AuthUser = DemoUser & { id: string | null }
export type AuthMode = 'local-demo' | 'supabase'

export type AuthContextValue = {
  user: AuthUser | null
  authMode: AuthMode
  authReady: boolean
  authConfigurationError: string
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  signIn: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<void>
  resetPassword: (email: string, password?: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  updateProfileName: (fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
