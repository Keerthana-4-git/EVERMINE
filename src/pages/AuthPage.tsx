import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../components/useToast'

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Please enter your name.'),
    email: z.string().trim().email('Enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .regex(/[A-Z]/, 'Include at least one uppercase letter.')
      .regex(/[0-9]/, 'Include at least one number.'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Your passwords do not match.',
    path: ['confirmPassword'],
  })

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  rememberMe: z.boolean(),
})

const resetSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().optional(),
})

type SignupValues = z.infer<typeof signupSchema>
type LoginValues = z.infer<typeof loginSchema>
type ResetValues = z.infer<typeof resetSchema>

type AuthPageProps = {
  mode: 'login' | 'signup'
}

export function AuthPage({ mode }: AuthPageProps) {
  const [formError, setFormError] = useState('')
  const [formNotice, setFormNotice] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const {
    signIn,
    signUp,
    resetPassword,
    signInWithGoogle,
    authMode,
    authConfigurationError,
  } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const isSignup = mode === 'signup'
  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  })
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSignup(values: SignupValues) {
    setFormError('')
    setFormNotice('')
    try {
      const signedIn = await signUp(values.fullName, values.email, values.password)
      if (signedIn) navigate('/', { replace: true })
      else setFormNotice('Your account was created. Check your email to verify it before signing in.')
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Your local account could not be created.',
      )
    }
  }

  async function onLogin(values: LoginValues) {
    setFormError('')
    setFormNotice('')
    try {
      await signIn(values.email, values.password, values.rememberMe)
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'We could not sign you in to the local demo.',
      )
    }
  }

  async function onReset(values: ResetValues) {
    setFormError('')
    setFormNotice('')
    try {
      if (
        authMode === 'local-demo' &&
        (!values.password || values.password.length < 8 || !/[A-Z]/.test(values.password) || !/[0-9]/.test(values.password))
      ) {
        setFormError('Use at least 8 characters, including an uppercase letter and a number.')
        return
      }
      await resetPassword(values.email, values.password)
      setShowReset(false)
      resetForm.reset()
      loginForm.setValue('email', values.email)
      if (authMode === 'supabase') {
        setFormNotice('If that account exists, a secure password reset link has been sent to its email address.')
      } else {
        showToast('Your local demo password has been updated on this device.')
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Your local password could not be updated.',
      )
    }
  }

  async function onGoogleSignIn() {
    setFormError('')
    setFormNotice('')
    try {
      await signInWithGoogle()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Google sign-in could not be started.')
    }
  }

  const passwordValue = signupForm.watch('password', '')
  const strength = [
    passwordValue.length >= 8,
    /[A-Z]/.test(passwordValue),
    /[0-9]/.test(passwordValue),
    /[^A-Za-z0-9]/.test(passwordValue),
  ].filter(Boolean).length
  const fieldError = (
    message: string | undefined,
    id: string,
  ) =>
    message ? (
      <p className="auth-field-error mt-1.5" id={id} role="alert">
        {message}
      </p>
    ) : null

  return (
    <AnimatePresence mode="wait">
      {showReset ? (
        <motion.section
          key="reset"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          className="py-2"
        >
          <button
            type="button"
            onClick={() => {
              setShowReset(false)
              setFormError('')
            }}
            className="mb-9 inline-flex items-center gap-2 text-xs text-[#8b8175] hover:text-[#302d29]"
          >
            <ArrowLeft size={14} /> Back to login
          </button>
          <p className="eyebrow mb-3">{authMode === 'supabase' ? 'Secure password reset' : 'Local password reset'}</p>
          <h1 className="serif mb-3 text-5xl leading-none">A fresh start.</h1>
          <p className="mb-7 text-sm leading-6 text-[#82796e]">
            {authMode === 'supabase'
              ? 'We will email you a secure link to choose a new password.'
              : 'Passwords are stored only in this browser for the local demo. No email will be sent.'}
          </p>
          {formError && <p className="auth-error mb-5">{formError}</p>}
          {formNotice && <p className="mb-5 text-sm leading-6 text-[#6e6252]" role="status">{formNotice}</p>}
          <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
            <Field label="Email address" htmlFor="reset-email">
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(resetForm.formState.errors.email)}
                aria-describedby={resetForm.formState.errors.email ? 'reset-email-error' : undefined}
                className="auth-input"
                {...resetForm.register('email')}
              />
              {fieldError(resetForm.formState.errors.email?.message, 'reset-email-error')}
            </Field>
            {authMode === 'local-demo' && (
              <Field label="New password" htmlFor="reset-password">
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="auth-input"
                  {...resetForm.register('password')}
                />
              </Field>
            )}
            <button type="submit" className="auth-primary mt-2 w-full">
              {authMode === 'supabase' ? 'Send reset link' : 'Update local password'} <ArrowRight size={15} />
            </button>
          </form>
        </motion.section>
      ) : (
        <motion.section
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="py-2"
        >
          <p className="eyebrow mb-3">
            {isSignup ? 'Begin your personal archive' : 'Your memories are here'}
          </p>
          <h1 className="serif mb-3 text-[3.55rem] leading-[0.98] tracking-[-0.025em] text-[#302d29] sm:text-[4rem]">
            {isSignup ? (
              <>
                Make room
                <br />
                <em>for wonder.</em>
              </>
            ) : (
              <>
                Welcome
                <br />
                <em>back.</em>
              </>
            )}
          </h1>
          <p className="mb-7 text-sm leading-6 text-[#82796e]">
            {isSignup
              ? 'A thoughtful home for the photographs, people, and stories you want to keep close.'
              : 'Come back to the moments you never want to lose.'}
          </p>
          {authMode === 'local-demo' ? (
            <div className="mb-5 flex items-center gap-2 border border-[#d8cdbc] bg-[#f0ebe3] px-3 py-2.5 text-[0.68rem] leading-5 text-[#6e6252]">
              <LockKeyhole size={14} className="shrink-0" />
              <span><strong className="font-semibold">Local demo authentication.</strong> Your account stays in this browser; this is not a secure production service.</span>
            </div>
          ) : (
            <div className="mb-5 flex items-center gap-2 border border-[#d8cdbc] bg-[#f0ebe3] px-3 py-2.5 text-[0.68rem] leading-5 text-[#6e6252]">
              <LockKeyhole size={14} className="shrink-0" />
              <span>{authConfigurationError || 'Supabase authentication is enabled. Memory records and photographs remain local until cloud data migration is completed.'}</span>
            </div>
          )}
          {formError && <p className="auth-error mb-4" role="status">{formError}</p>}
          {formNotice && <p className="mb-4 text-sm leading-6 text-[#6e6252]" role="status">{formNotice}</p>}

          {isSignup ? (
            <form
              onSubmit={signupForm.handleSubmit(onSignup)}
              className="space-y-3.5"
              noValidate
            >
              <Field label="Your name" htmlFor="signup-name">
                <input
                  id="signup-name"
                  autoComplete="name"
                  placeholder="What should we call you?"
                  aria-invalid={Boolean(signupForm.formState.errors.fullName)}
                  aria-describedby={signupForm.formState.errors.fullName ? 'signup-name-error' : undefined}
                  className="auth-input"
                  {...signupForm.register('fullName')}
                />
                {fieldError(signupForm.formState.errors.fullName?.message, 'signup-name-error')}
              </Field>
              <Field label="Email address" htmlFor="signup-email">
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(signupForm.formState.errors.email)}
                  aria-describedby={signupForm.formState.errors.email ? 'signup-email-error' : undefined}
                  className="auth-input"
                  {...signupForm.register('email')}
                />
                {fieldError(signupForm.formState.errors.email?.message, 'signup-email-error')}
              </Field>
              <Field label="Password" htmlFor="signup-password">
                <PasswordInput
                  id="signup-password"
                  autoComplete="new-password"
                  visible={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                  invalid={Boolean(signupForm.formState.errors.password)}
                  describedBy={signupForm.formState.errors.password ? 'signup-password-error' : undefined}
                  placeholder="At least 8 characters"
                  registration={signupForm.register('password')}
                />
                {fieldError(signupForm.formState.errors.password?.message, 'signup-password-error')}
                {passwordValue && (
                  <div className="mt-2 flex items-center gap-2" aria-live="polite">
                    <div className="flex flex-1 gap-1">
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className={`h-1 flex-1 ${
                            index < strength ? 'bg-[#a68c70]' : 'bg-[#e3ddd3]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[0.63rem] text-[#8b8175]">
                      {strength < 2 ? 'Getting started' : strength < 4 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </Field>
              <Field label="Confirm password" htmlFor="signup-confirm-password">
                <PasswordInput
                  id="signup-confirm-password"
                  autoComplete="new-password"
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((value) => !value)}
                  invalid={Boolean(signupForm.formState.errors.confirmPassword)}
                  describedBy={signupForm.formState.errors.confirmPassword ? 'signup-confirm-error' : undefined}
                  placeholder="Enter your password again"
                  registration={signupForm.register('confirmPassword')}
                />
                {fieldError(
                  signupForm.formState.errors.confirmPassword?.message,
                  'signup-confirm-error',
                )}
              </Field>
              <button
                type="submit"
                disabled={signupForm.formState.isSubmitting}
                className="auth-primary mt-1 w-full"
              >
                {signupForm.formState.isSubmitting ? 'Creating your account…' : 'Create my sanctuary'}
                {!signupForm.formState.isSubmitting && <ArrowRight size={15} />}
              </button>
            </form>
          ) : (
            <form
              onSubmit={loginForm.handleSubmit(onLogin)}
              className="space-y-4"
              noValidate
            >
              <Field label="Email address" htmlFor="login-email">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(loginForm.formState.errors.email)}
                  aria-describedby={loginForm.formState.errors.email ? 'login-email-error' : undefined}
                  className="auth-input"
                  {...loginForm.register('email')}
                />
                {fieldError(loginForm.formState.errors.email?.message, 'login-email-error')}
              </Field>
              <Field label="Password" htmlFor="login-password">
                <PasswordInput
                  id="login-password"
                  autoComplete="current-password"
                  visible={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                  invalid={Boolean(loginForm.formState.errors.password)}
                  describedBy={loginForm.formState.errors.password ? 'login-password-error' : undefined}
                  placeholder="Your password"
                  registration={loginForm.register('password')}
                />
                {fieldError(loginForm.formState.errors.password?.message, 'login-password-error')}
              </Field>
              <div className="flex items-center justify-between gap-3">
                {authMode === 'local-demo' ? (
                  <label className="flex items-center gap-2 text-xs text-[#776f64]">
                    <input type="checkbox" className="accent-[#8e765d]" {...loginForm.register('rememberMe')} />
                    Remember me on this device
                  </label>
                ) : <span className="text-xs text-[#776f64]">Secure session provided by Supabase</span>}
                <button
                  type="button"
                  onClick={() => {
                    setFormError('')
                    setShowReset(true)
                  }}
                  className="text-xs text-[#8b8175] underline decoration-[#c8b7a2] underline-offset-4 hover:text-[#302d29]"
                >
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="auth-primary mt-2 w-full"
              >
                {loginForm.formState.isSubmitting ? 'Opening your sanctuary…' : 'Sign in'}
                {!loginForm.formState.isSubmitting && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {authMode === 'supabase' && (
            <button type="button" onClick={() => void onGoogleSignIn()} className="mt-4 w-full border border-[#302d29]/20 bg-transparent px-4 py-3 text-xs font-semibold text-[#403b34] hover:bg-[#f0ebe3]">
              Continue with Google
            </button>
          )}

          <p className="mt-6 text-center text-sm text-[#82796e]">
            {isSignup ? 'Already have a sanctuary?' : 'New to EVERMINE?'}{' '}
            <Link
              className="text-link font-semibold"
              to={isSignup ? '/login' : '/signup'}
            >
              {isSignup ? 'Sign in' : 'Create your account'}
            </Link>
          </p>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[0.68rem] font-semibold tracking-[0.02em] text-[#514a40]"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

type PasswordInputProps = {
  id: string
  autoComplete: string
  visible: boolean
  onToggle: () => void
  invalid: boolean
  describedBy?: string
  placeholder: string
  registration: UseFormRegisterReturn
}

function PasswordInput({
  id,
  autoComplete,
  visible,
  onToggle,
  invalid,
  describedBy,
  placeholder,
  registration,
}: PasswordInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="auth-input pr-12"
        {...registration}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#8b8175] hover:text-[#302d29]"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
