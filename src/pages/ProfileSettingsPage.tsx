import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import {
  Bell,
  Database,
  Image,
  LogOut,
  Shield,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ConfirmDialog } from '../components/MemoryDialog'
import { useObjectUrl } from '../components/useObjectUrl'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import type { MemorySettings, UserProfile } from '../data/memoryTypes'

export function ProfileSettingsPage() {
  const isSettings = useLocation().pathname === '/settings'
  const { user, signOut, authMode } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    profile,
    settings,
    photos,
    albums,
    stories,
    books,
    reels,
    capsules,
    familyStories,
    sharedAlbums,
    deletedPhotos,
    saveSettings,
    clearApplicationData,
  } = useMemory()
  const [clearOpen, setClearOpen] = useState(false)
  const [clearBusy, setClearBusy] = useState(false)
  const [browserUsage, setBrowserUsage] = useState<number | null>(null)
  const storedPhotoBytes = useMemo(() =>
    [...photos, ...deletedPhotos.map((item) => item.photo)]
      .reduce((total, photo) => total + photo.blob.size, 0) +
    reels.reduce((total, reel) => total + (reel.musicBlob?.size ?? 0), 0) +
    (profile.photoBlob?.size ?? 0),
  [deletedPhotos, photos, profile.photoBlob, reels])

  const statItems = [
    { label: 'Photographs', value: photos.length },
    { label: 'Albums', value: albums.length + sharedAlbums.length },
    { label: 'Stories', value: stories.length + familyStories.length },
    { label: 'Keepsakes', value: books.length + reels.length + capsules.length },
  ]

  async function updateSetting(change: Partial<MemorySettings>) {
    try {
      await saveSettings({ ...settings, ...change })
      showToast('Your settings were saved.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Your settings could not be saved.', 'error')
    }
  }

  async function updateNotificationPreference(
    key: keyof MemorySettings['notifications'],
    enabled: boolean,
  ) {
    await updateSetting({ notifications: { ...settings.notifications, [key]: enabled } })
  }

  async function measureBrowserStorage() {
    if (!navigator.storage?.estimate) {
      showToast('This browser does not provide a storage estimate.', 'error')
      return
    }
    try {
      const estimate = await navigator.storage.estimate()
      if (typeof estimate.usage !== 'number') {
        showToast('The browser did not provide a storage usage estimate.', 'error')
        return
      }
      setBrowserUsage(estimate.usage)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Browser storage could not be measured.', 'error')
    }
  }

  async function clearAllData() {
    setClearBusy(true)
    try {
      await clearApplicationData()
      setClearOpen(false)
      showToast('Your local memory data and preferences were cleared. Your demo sign-in remains.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Application data could not be cleared.', 'error')
    } finally {
      setClearBusy(false)
    }
  }

  async function logout() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'You could not be signed out.', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-7 border-b border-[#302d29]/12 pb-6">
        <p className="eyebrow mb-2">{authMode === 'supabase' ? 'Your authenticated account' : 'Your local demo account'}</p>
        <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Profile &amp; Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#82796e]">
          {authMode === 'supabase'
            ? 'Your account name updates through Supabase. Biography, profile image, preferences and all memory records are still stored only on this device.'
            : 'Profile and preference changes are stored on this device. They do not update a remote account.'}
        </p>
      </header>

      <nav aria-label="Profile and settings sections" className="mb-8 flex gap-2 border-b border-[#302d29]/10">
        <Link to="/profile" aria-current={!isSettings ? 'page' : undefined} className={`border-b-2 px-3 py-3 text-xs ${!isSettings ? 'border-[#a68c70] font-semibold text-[#403b34]' : 'border-transparent text-[#82796e]'}`}><UserRound size={14} className="mr-1.5 inline" />Profile</Link>
        <Link to="/settings" aria-current={isSettings ? 'page' : undefined} className={`border-b-2 px-3 py-3 text-xs ${isSettings ? 'border-[#a68c70] font-semibold text-[#403b34]' : 'border-transparent text-[#82796e]'}`}><SlidersHorizontal size={14} className="mr-1.5 inline" />Settings</Link>
      </nav>

      {!isSettings ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(17rem,0.9fr)]">
          <section className="border border-[#302d29]/10 bg-[#fbf9f5] p-5 sm:p-7">
            <p className="eyebrow mb-4">A few details about you</p>
            <ProfileEditor key={profile.updatedAt} profile={profile} email={user?.email ?? ''} />
          </section>

          <aside className="space-y-6">
            <section className="border-y border-[#302d29]/10 py-5">
              <p className="eyebrow mb-2">Your archive, in a glance</p>
              <div className="grid grid-cols-2 gap-4">
                {statItems.map((item) => <div key={item.label} className="border-b border-[#302d29]/10 py-3"><p className="serif text-3xl">{item.value}</p><p className="mt-1 text-[0.65rem] text-[#82796e]">{item.label}</p></div>)}
              </div>
              <p className="mt-4 text-[0.66rem] text-[#82796e]">Account created {profile.accountCreatedAt ? formatDate(profile.accountCreatedAt) : 'date unavailable for this older local demo account'}</p>
            </section>
            <section className="bg-[#eee8df] p-5">
              <p className="eyebrow mb-2">Your privacy</p>
              <h2 className="serif text-2xl">Kept close, on this device.</h2>
              <p className="mt-2 text-xs leading-5 text-[#71685d]">This profile belongs to the local demo. It is not a public profile and is not synchronized to a server.</p>
              <Link to="/settings" className="text-link mt-4 inline-block text-xs">Review privacy settings</Link>
            </section>
          </aside>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.75fr)]">
          <div className="space-y-9">
            <section>
              <h2 className="serif flex items-center gap-2 text-3xl"><SlidersHorizontal size={18} /> Appearance</h2>
              <div className="mt-4 divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
                <SettingRow label="Theme" description="The current editorial interface is available in light mode. Dark mode is not consistently supported yet.">
                  <select aria-label="Theme preference" value={settings.theme} onChange={() => void updateSetting({ theme: 'light' })} className="min-h-9 border border-[#302d29]/15 bg-[#fbf9f5] px-2 text-xs"><option value="light">Light · available</option><option value="dark" disabled>Dark · not available yet</option></select>
                </SettingRow>
                <SettingRow label="Gallery spacing" description="Choose the density used by the My Memories and Favorites galleries.">
                  <select aria-label="Gallery display preference" value={settings.galleryDensity} onChange={(event) => void updateSetting({ galleryDensity: event.target.value as MemorySettings['galleryDensity'] })} className="min-h-9 border border-[#302d29]/15 bg-[#fbf9f5] px-2 text-xs"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select>
                </SettingRow>
              </div>
            </section>

            <section>
              <h2 className="serif flex items-center gap-2 text-3xl"><Shield size={18} /> Privacy</h2>
              <div className="mt-4 divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
                <SettingRow label="Profile visibility" description="Private keeps your name out of local demo collaborator labels. Local demo only may show it in your own simulated collaboration activity. Nothing is published.">
                  <select aria-label="Profile visibility preference" value={settings.profileVisibility} onChange={(event) => void updateSetting({ profileVisibility: event.target.value as MemorySettings['profileVisibility'] })} className="min-h-9 border border-[#302d29]/15 bg-[#fbf9f5] px-2 text-xs"><option value="private">Private</option><option value="local-demo">Local demo only</option></select>
                </SettingRow>
                <SettingRow label="Shared album privacy" description="Private prevents preparing new local invitation records. Invitation-only allows the local demonstration workflow.">
                  <select aria-label="Shared album privacy preference" value={settings.sharedAlbumPrivacy} onChange={(event) => void updateSetting({ sharedAlbumPrivacy: event.target.value as MemorySettings['sharedAlbumPrivacy'] })} className="min-h-9 border border-[#302d29]/15 bg-[#fbf9f5] px-2 text-xs"><option value="private">Keep private</option><option value="invitation-only">Invitation-only demo</option></select>
                </SettingRow>
                <p className="px-1 py-4 text-[0.67rem] leading-5 text-[#82796e]">There is no cloud sync, public profile, email delivery, or multi-user access in this local-first prototype.</p>
              </div>
            </section>

            <section>
              <h2 className="serif flex items-center gap-2 text-3xl"><Bell size={18} /> Notifications</h2>
              <div className="mt-4 divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
                <ToggleSetting label="Memory reminders" checked={settings.notifications.memoryReminders} onChange={(checked) => void updateNotificationPreference('memoryReminders', checked)} />
                <ToggleSetting label="Time capsule updates" checked={settings.notifications.timeCapsuleReminders} onChange={(checked) => void updateNotificationPreference('timeCapsuleReminders', checked)} />
                <ToggleSetting label="Shared album activity" checked={settings.notifications.sharedAlbumActivity} onChange={(checked) => void updateNotificationPreference('sharedAlbumActivity', checked)} />
                <ToggleSetting label="Story updates" checked={settings.notifications.storyUpdates} onChange={(checked) => void updateNotificationPreference('storyUpdates', checked)} />
                <ToggleSetting label="Application announcements" checked={settings.notifications.applicationAnnouncements} onChange={(checked) => void updateNotificationPreference('applicationAnnouncements', checked)} />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border border-[#302d29]/10 bg-[#fbf9f5] p-5">
              <h2 className="serif flex items-center gap-2 text-2xl"><Database size={16} /> Local storage</h2>
              <p className="mt-2 text-xs leading-5 text-[#82796e]">Evermine-tracked file size includes saved and recently deleted photos, reel audio, and your profile image. Browser usage is an estimate for this whole site origin.</p>
              <div className="mt-4 space-y-3 border-y border-[#302d29]/10 py-3 text-xs">
                <div className="flex justify-between gap-3"><span>Tracked file data</span><strong>{formatBytes(storedPhotoBytes)}</strong></div>
                <div className="flex justify-between gap-3"><span>Photographs</span><strong>{photos.length} active · {deletedPhotos.length} deleted</strong></div>
                <div className="flex justify-between gap-3"><span>Albums</span><strong>{albums.length + sharedAlbums.length}</strong></div>
                <div className="flex justify-between gap-3"><span>Browser site usage</span><strong>{browserUsage === null ? 'Not measured' : formatBytes(browserUsage)}</strong></div>
              </div>
              <button type="button" className="auth-secondary mt-4 min-h-9 w-full" onClick={() => void measureBrowserStorage()}>Measure browser storage</button>
              <p className="mt-3 text-[0.64rem] leading-5 text-[#8b8175]">Browser data can be removed by device or browser cleanup. There is no backup service. Keep important originals elsewhere.</p>
            </section>

            <section className="border border-[#805449]/25 bg-[#f7efeb] p-5">
              <p className="eyebrow mb-2 text-[#805449]">Destructive action</p>
              <h2 className="serif text-2xl">Clear application data</h2>
              <p className="mt-2 text-xs leading-5 text-[#71685d]">Permanently removes this local archive, including Recently Deleted, saved wall layouts, and preferences. Your demo sign-in remains on this device.</p>
              <button type="button" className="mt-4 inline-flex min-h-10 items-center gap-2 border border-[#805449] px-3 text-xs font-semibold text-[#805449] hover:bg-[#f1e2db]" onClick={() => setClearOpen(true)}><Database size={14} /> Clear application data</button>
            </section>

            <section className="border-t border-[#302d29]/10 pt-5">
              <p className="eyebrow mb-2">Account</p>
              <p className="text-xs leading-5 text-[#82796e]">Sign out of this local demo session. Your memories remain stored on this device.</p>
              <button type="button" className="auth-secondary mt-3 min-h-9" onClick={logout}><LogOut size={14} /> Sign out</button>
            </section>
          </aside>
        </div>
      )}

      {clearOpen && <ConfirmDialog title="Clear all local application data?" description="This permanently removes all saved photographs, stories, albums, capsules, family records, notifications, profile details, and settings from this device. This cannot be undone. Your local demo sign-in remains." confirmLabel="Clear all local data" busy={clearBusy} onCancel={() => setClearOpen(false)} onConfirm={() => void clearAllData()} />}
    </div>
  )
}

function ProfileEditor({ profile, email }: { profile: UserProfile; email: string }) {
  const { saveProfile } = useMemory()
  const { showToast } = useToast()
  const [fullName, setFullName] = useState(profile.fullName)
  const [biography, setBiography] = useState(profile.biography)
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(profile.photoBlob)
  const [saving, setSaving] = useState(false)
  const avatarUrl = useObjectUrl(photoBlob)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      await saveProfile({ fullName, biography, photoBlob })
      showToast('Your profile was saved to this device.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Your profile could not be saved.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Choose an image file for your profile photograph.', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Choose a profile image smaller than 5 MB.', 'error')
      return
    }
    setPhotoBlob(file)
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#e8dfd3] serif text-3xl text-[#6b5945]">
          {avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : profile.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="auth-secondary min-h-9 cursor-pointer">
            <Image size={14} /> Change profile photograph
            <input type="file" accept="image/*" className="sr-only" onChange={choosePhoto} />
          </label>
          {photoBlob && <button type="button" className="auth-secondary min-h-9 text-[#805449]" onClick={() => setPhotoBlob(null)}>Remove photograph</button>}
        </div>
      </div>
      <label className="block text-xs font-semibold text-[#574f45]">
        Full name
        <input required minLength={2} maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} className="auth-input mt-2 min-h-11 text-sm" />
      </label>
      <label className="block text-xs font-semibold text-[#574f45]">
        Email address
        <input value={email} readOnly aria-describedby="email-note" className="auth-input mt-2 min-h-11 bg-[#f3eee6] text-sm" />
        <span id="email-note" className="mt-1 block text-[0.65rem] font-normal text-[#8b8175]">Email is tied to this local demo account and cannot be changed here.</span>
      </label>
      <label className="block text-xs font-semibold text-[#574f45]">
        Biography
        <textarea value={biography} onChange={(event) => setBiography(event.target.value)} maxLength={500} rows={5} className="auth-input mt-2 resize-y text-sm leading-6" placeholder="A few words about what matters to you…" />
        <span className="mt-1 block text-right text-[0.62rem] font-normal text-[#8b8175]">{biography.length}/500</span>
      </label>
      <button type="submit" className="auth-primary min-h-11" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
    </form>
  )
}

function SettingRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="max-w-xl"><p className="text-xs font-semibold text-[#403b34]">{label}</p><p className="mt-1 text-[0.65rem] leading-5 text-[#82796e]">{description}</p></div>
      {children}
    </div>
  )
}

function ToggleSetting({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 py-2 text-xs text-[#403b34]">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#756149]" />
    </label>
  )
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 bytes'
  const units = ['bytes', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}
