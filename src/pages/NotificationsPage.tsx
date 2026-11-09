import { useMemo, useState } from 'react'
import {
  Bell,
  BookHeart,
  Check,
  Clock3,
  Image,
  Megaphone,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/MemoryDialog'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import type { MemoryNotificationCategory } from '../data/memoryTypes'

const categoryDetails: Record<MemoryNotificationCategory, { label: string; Icon: typeof Bell }> = {
  'memory-reminder': { label: 'Memory reminders', Icon: Image },
  'time-capsule-update': { label: 'Time capsule updates', Icon: Clock3 },
  'shared-album-activity': { label: 'Shared album activity', Icon: UsersRound },
  'story-update': { label: 'Story updates', Icon: BookHeart },
  'application-announcement': { label: 'Application announcements', Icon: Megaphone },
}

type CategoryFilter = 'all' | MemoryNotificationCategory

export function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearNotifications,
  } = useMemory()
  const { showToast } = useToast()
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [clearOpen, setClearOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const unreadCount = notifications.filter((item) => !item.readAt).length
  const visible = useMemo(
    () => notifications.filter((item) => filter === 'all' || item.category === filter),
    [filter, notifications],
  )

  async function markRead(id: string) {
    try {
      await markNotificationRead(id)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The notification could not be updated.', 'error')
    }
  }

  async function markAllRead() {
    try {
      await markAllNotificationsRead()
      showToast('All notifications are marked as read.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Notifications could not be updated.', 'error')
    }
  }

  async function remove(id: string) {
    try {
      await deleteNotification(id)
      showToast('Notification removed.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The notification could not be removed.', 'error')
    }
  }

  async function clearAll() {
    setBusy(true)
    try {
      await clearNotifications()
      setClearOpen(false)
      showToast('Your notification list is clear.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Notifications could not be cleared.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#302d29]/12 pb-6">
        <div>
          <p className="eyebrow mb-2">A small record of things that happened here</p>
          <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Notifications</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#82796e]">
            These notes are created from actions in your local archive. Shared album activity is authored by you in this demo; nothing is sent from another person.
          </p>
        </div>
        <p className="text-xs text-[#82796e]">{unreadCount} unread</p>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-[#302d29]/10 py-3">
        <label className="flex items-center gap-2 text-xs text-[#5d554b]">
          Filter
          <select aria-label="Filter notifications by category" value={filter} onChange={(event) => setFilter(event.target.value as CategoryFilter)} className="min-h-9 border border-[#302d29]/15 bg-[#fbf9f5] px-2 text-xs">
            <option value="all">All categories</option>
            {Object.entries(categoryDetails).map(([key, details]) => <option key={key} value={key}>{details.label}</option>)}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="button" className="auth-secondary min-h-9" onClick={() => void markAllRead()} disabled={!unreadCount}><Check size={14} /> Mark all as read</button>
          <button type="button" className="auth-secondary min-h-9 text-[#805449]" onClick={() => setClearOpen(true)} disabled={!notifications.length}><Trash2 size={14} /> Clear all</button>
        </div>
      </div>

      {visible.length ? (
        <div className="divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
          {visible.map((notification) => {
            const { label, Icon } = categoryDetails[notification.category]
            return (
              <article key={notification.id} className={`flex gap-3 py-5 sm:gap-5 ${notification.readAt ? 'opacity-75' : ''}`}>
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee8df] text-[#776248]"><Icon size={17} strokeWidth={1.5} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-[#3d3933]">{notification.title}</p>
                    {!notification.readAt && <span className="h-1.5 w-1.5 rounded-full bg-[#a68c70]" aria-label="Unread" />}
                  </div>
                  <p className="mt-1 text-[0.68rem] leading-5 text-[#756d62]">{notification.body}</p>
                  <p className="mt-2 text-[0.59rem] uppercase tracking-[0.08em] text-[#9a8f82]">{label} · {formatDate(notification.createdAt)}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link to={notification.href || '/'} onClick={() => void markRead(notification.id)} className="text-[0.66rem] font-semibold text-[#8b7153] hover:underline">Open related page</Link>
                    {!notification.readAt && <button type="button" onClick={() => void markRead(notification.id)} className="text-[0.66rem] text-[#756d62] hover:underline">Mark as read</button>}
                    <button type="button" onClick={() => void remove(notification.id)} className="text-[0.66rem] text-[#805449] hover:underline">Delete</button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-5 py-16 text-center">
          <Bell size={28} className="mx-auto text-[#a68c70]" strokeWidth={1.4} />
          <p className="serif mt-3 text-3xl">{notifications.length ? 'No notes in this category.' : 'A quiet inbox, for now.'}</p>
          <p className="mt-2 text-sm text-[#82796e]">{notifications.length ? 'Choose another category to see more.' : 'Notifications appear when you save a story, add memories, or open a capsule. We do not invent activity from other people.'}</p>
        </div>
      )}

      {clearOpen && <ConfirmDialog title="Clear all notifications?" description="All saved notifications will be removed from this device. This does not affect your photographs, stories, or other memories." confirmLabel="Clear notifications" busy={busy} onCancel={() => setClearOpen(false)} onConfirm={() => void clearAll()} />}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
