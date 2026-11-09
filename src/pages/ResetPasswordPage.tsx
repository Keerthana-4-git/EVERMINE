import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function ResetPasswordPage() {
  const { authMode, authReady, user, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Use at least 8 characters, including an uppercase letter and a number.')
      return
    }
    if (password !== confirmation) {
      setError('Your passwords do not match.')
      return
    }
    setSaving(true)
    try {
      await updatePassword(password)
      setMessage('Your password has been updated.')
      window.setTimeout(() => navigate('/', { replace: true }), 900)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your password could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="py-2">
      <p className="eyebrow mb-3">Account recovery</p>
      <h1 className="serif mb-3 text-5xl leading-none">A fresh start.</h1>
      {authMode !== 'supabase' ? (
        <p className="text-sm leading-6 text-[#82796e]">Password recovery links are available only when Supabase authentication is configured.</p>
      ) : !authReady ? (
        <p role="status" className="text-sm leading-6 text-[#82796e]">Verifying your secure reset link…</p>
      ) : !user ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#82796e]">This reset link is invalid or has expired. Request a new link to continue.</p>
          <Link className="text-link text-sm" to="/login">Return to sign in</Link>
        </div>
      ) : (
        <>
          <p className="mb-7 text-sm leading-6 text-[#82796e]">Choose a new password for your EVERMINE account.</p>
          {error && <p className="auth-error mb-4" role="alert">{error}</p>}
          {message && <p className="mb-4 text-sm text-[#6e6252]" role="status">{message}</p>}
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <label className="block text-xs text-[#514a40]">
              New password
              <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input mt-2" />
            </label>
            <label className="block text-xs text-[#514a40]">
              Confirm new password
              <input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="auth-input mt-2" />
            </label>
            <button type="submit" disabled={saving} className="auth-primary mt-2 w-full">
              {saving ? 'Updating password…' : 'Save new password'}
            </button>
          </form>
        </>
      )}
    </section>
  )
}
