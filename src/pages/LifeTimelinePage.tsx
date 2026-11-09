import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { MilestoneEditorDialog } from '../components/MilestoneEditorDialog'
import { PhotoViewer } from '../components/PhotoViewer'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import { formatCalendarDate, parseCalendarDate } from '../data/memoryDates'
import type { LifeMilestone, MemoryPhoto } from '../data/memoryTypes'

type TimelineEntry =
  | { kind: 'photo'; date: string; photo: MemoryPhoto }
  | { kind: 'milestone'; date: string; milestone: LifeMilestone }

interface TimelineMonth {
  year: number
  month: number
  entries: TimelineEntry[]
}

export function LifeTimelinePage() {
  const { photos, milestones, loading, storageError, deleteMilestone } = useMemory()
  const { showToast } = useToast()
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')
  const [editingMilestone, setEditingMilestone] = useState<LifeMilestone | null>(null)
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [deletingMilestone, setDeletingMilestone] = useState<LifeMilestone | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [viewerId, setViewerId] = useState<string | null>(null)

  const years = useMemo(() => {
    const values = new Set<number>()
    photos.forEach((photo) => {
      const date = parseCalendarDate(photo.date)
      if (date) values.add(date.year)
    })
    milestones.forEach((milestone) => {
      const date = parseCalendarDate(milestone.date)
      if (date) values.add(date.year)
    })
    return [...values].sort((a, b) => b - a)
  }, [milestones, photos])
  const effectiveYear =
    selectedYear !== 'all' && years.includes(selectedYear) ? selectedYear : 'all'

  const months = useMemo(() => {
    const grouped = new Map<number, Map<number, TimelineEntry[]>>()
    const addEntry = (entry: TimelineEntry) => {
      const date = parseCalendarDate(entry.date)
      if (!date || (effectiveYear !== 'all' && effectiveYear !== date.year)) return
      const yearMonths = grouped.get(date.year) ?? new Map<number, TimelineEntry[]>()
      const monthEntries = yearMonths.get(date.month) ?? []
      monthEntries.push(entry)
      yearMonths.set(date.month, monthEntries)
      grouped.set(date.year, yearMonths)
    }

    photos.forEach((photo) => addEntry({ kind: 'photo', date: photo.date, photo }))
    milestones.forEach((milestone) =>
      addEntry({ kind: 'milestone', date: milestone.date, milestone }),
    )

    const result: TimelineMonth[] = []
    ;[...grouped.entries()]
      .sort(([yearA], [yearB]) => yearA - yearB)
      .forEach(([year, yearMonths]) => {
        ;[...yearMonths.entries()]
          .sort(([monthA], [monthB]) => monthA - monthB)
          .forEach(([month, entries]) => {
            result.push({
              year,
              month,
              entries: entries.sort(
                (a, b) =>
                  a.date.localeCompare(b.date) ||
                  (a.kind === b.kind ? 0 : a.kind === 'milestone' ? -1 : 1),
              ),
            })
          })
      })
    return result
  }, [effectiveYear, milestones, photos])

  const newestYear = years[0]
  const oldestYear = years[years.length - 1]
  const navigationYear = effectiveYear === 'all' ? newestYear : effectiveYear
  const navigationIndex = navigationYear ? years.indexOf(navigationYear) : -1
  const activePhoto = viewerId ? photos.find((photo) => photo.id === viewerId) : undefined

  async function confirmDeleteMilestone() {
    if (!deletingMilestone) return
    setDeleteBusy(true)
    try {
      await deleteMilestone(deletingMilestone.id)
      setDeletingMilestone(null)
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'The milestone could not be deleted.',
        'error',
      )
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-2">The chapters that made you</p>
            <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Life Timeline</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#82796e]">
              Photographs and personal milestones, gathered in the order life unfolded.
            </p>
          </div>
          <button type="button" className="auth-primary" onClick={() => setAddingMilestone(true)}>
            <Plus size={16} /> Add a milestone
          </button>
        </header>

        <section className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-[#302d29]/12 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eae2d6] text-[#8b7861]">
              <CalendarDays size={16} />
            </span>
            <div>
              <p className="eyebrow text-[0.55rem]">Your memories through time</p>
              <p className="serif text-xl">
                {loading ? 'Gathering your memories…' : `${photos.length} photographs · ${milestones.length} milestones`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous year"
              title="Show the previous year"
              className="auth-secondary min-h-9 px-3"
              disabled={
                !navigationYear ||
                (effectiveYear === 'all' ? years.length < 2 : effectiveYear === oldestYear)
              }
              onClick={() => {
                const olderYear = effectiveYear === 'all' ? years[1] : years[navigationIndex + 1]
                if (olderYear) setSelectedYear(olderYear)
              }}
            >
              <ArrowLeft size={15} />
            </button>
            <label htmlFor="timeline-year" className="sr-only">Filter timeline by year</label>
            <select
              id="timeline-year"
              className="auth-input min-h-9 w-36 py-1.5 text-xs"
              value={effectiveYear === 'all' ? '' : effectiveYear}
              onChange={(event) =>
                setSelectedYear(event.target.value ? Number(event.target.value) : 'all')
              }
            >
              <option value="">All years</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <button
              type="button"
              aria-label="Next year"
              title="Show the next year"
              className="auth-secondary min-h-9 px-3"
              disabled={!navigationYear || effectiveYear === 'all' || effectiveYear === newestYear}
              onClick={() => {
                if (navigationIndex > 0) setSelectedYear(years[navigationIndex - 1])
                else setSelectedYear('all')
              }}
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {storageError && <p className="auth-error mb-6" role="alert">{storageError}</p>}

        {loading ? (
          <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">
            Gathering your chapters…
          </div>
        ) : months.length ? (
          <div className="relative">
            <div className="absolute bottom-0 left-[5.6rem] top-0 hidden w-px bg-[#cdbda8] md:block" />
            {months.map((group) => {
              const monthDate = `${group.year}-${String(group.month).padStart(2, '0')}-01`
              const monthLabel = formatCalendarDate(monthDate, { month: 'long' })
              return (
                <section key={`${group.year}-${group.month}`} className="relative mb-12 grid gap-5 md:grid-cols-[6rem_1fr] md:gap-9">
                  <div className="relative z-10 flex items-center gap-3 md:block md:pt-1">
                    <span className="serif text-3xl leading-none">{group.year}</span>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#8b7861] md:mt-2 md:block">
                      {monthLabel}
                    </span>
                    <span className="absolute right-[-1.95rem] top-2 hidden h-2.5 w-2.5 rounded-full border-2 border-[#f8f5ef] bg-[#a68c70] md:block" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.entries.map((entry) => {
                      if (entry.kind === 'photo') {
                        const photo = entry.photo
                        return (
                          <article key={`photo-${photo.id}`} className="group border border-[#302d29]/10 bg-[#fbf9f5] p-3 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(48,45,41,0.08)]">
                            <button type="button" className="block w-full text-left" onClick={() => setViewerId(photo.id)}>
                              <MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-[1.25] transition-transform" />
                              <span className="mt-3 flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-[#8b7861]">
                                <Camera size={12} /> {formatCalendarDate(photo.date)}
                              </span>
                              <span className="serif mt-1 block text-2xl leading-tight">{photo.title}</span>
                              {photo.caption && <span className="mt-1.5 block line-clamp-2 text-xs leading-5 text-[#82796e]">{photo.caption}</span>}
                            </button>
                          </article>
                        )
                      }

                      const milestone = entry.milestone
                      const image = milestone.photoId
                        ? photos.find((photo) => photo.id === milestone.photoId)
                        : undefined
                      return (
                        <article key={`milestone-${milestone.id}`} className="relative flex min-h-48 flex-col border border-[#c8b7a2] bg-[#eee8df] p-5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[0.6rem] uppercase tracking-[0.14em] text-[#8b7861]">
                              A milestone · {formatCalendarDate(milestone.date)}
                            </span>
                            <div className="flex shrink-0 gap-1">
                              <button type="button" aria-label={`Edit ${milestone.title}`} title="Edit milestone" onClick={() => setEditingMilestone(milestone)} className="rounded-full p-1.5 text-[#756d62] hover:bg-white/60"><Pencil size={14} /></button>
                              <button type="button" aria-label={`Delete ${milestone.title}`} title="Delete milestone" onClick={() => setDeletingMilestone(milestone)} className="rounded-full p-1.5 text-[#805449] hover:bg-white/60"><Trash2 size={14} /></button>
                            </div>
                          </div>
                          <h2 className="serif mt-4 text-3xl leading-tight">{milestone.title}</h2>
                          {milestone.description && <p className="mt-2 text-xs leading-5 text-[#71685d]">{milestone.description}</p>}
                          {image && (
                            <button type="button" onClick={() => setViewerId(image.id)} className="mt-4 block text-left">
                              <MemoryPhotoImage photo={image} alt={image.title} className="aspect-[2.2] w-full" />
                              <span className="mt-1 flex items-center gap-1 text-[0.6rem] text-[#8b7861]">View photograph <ArrowRight size={11} /></span>
                            </button>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="flex min-h-[25rem] flex-col items-center justify-center border border-dashed border-[#c8b7a2] bg-[#fbf9f5]/70 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eae2d6] text-[#8b7861]"><CalendarDays size={24} strokeWidth={1.4} /></span>
            <p className="eyebrow mt-5">A story takes shape one day at a time</p>
            <h2 className="serif mt-2 max-w-xl text-3xl">
              {photos.length || milestones.length ? 'Nothing is dated in this year yet.' : 'Your first chapters are waiting.'}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#82796e]">
              Add dates to photographs or mark a meaningful milestone to begin your personal timeline.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" className="auth-primary" onClick={() => setAddingMilestone(true)}><Plus size={15} /> Add a milestone</button>
              <Link to="/memories" className="auth-secondary"><ArrowDown size={14} /> Explore photographs</Link>
            </div>
          </div>
        )}
      </motion.div>

      {addingMilestone && <MilestoneEditorDialog onClose={() => setAddingMilestone(false)} />}
      {editingMilestone && (
        <MilestoneEditorDialog milestone={editingMilestone} onClose={() => setEditingMilestone(null)} />
      )}
      {deletingMilestone && (
        <ConfirmDialog
          title="Remove this milestone?"
          description="This removes the milestone from your timeline. Any linked photograph stays safely in My Memories."
          confirmLabel="Remove milestone"
          busy={deleteBusy}
          onCancel={() => setDeletingMilestone(null)}
          onConfirm={() => void confirmDeleteMilestone()}
        />
      )}
      {activePhoto && (
        <PhotoViewer photos={photos} photoId={activePhoto.id} onClose={() => setViewerId(null)} />
      )}
    </div>
  )
}
