import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Clock3, Images } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { PhotoViewer } from '../components/PhotoViewer'
import { useMemory } from '../data/useMemory'
import {
  formatCalendarDate,
  photosOnThisDay,
  shiftCalendarDate,
  toCalendarDate,
} from '../data/memoryDates'

export function OnThisDayPage() {
  const { photos, loading, storageError } = useMemory()
  const [selectedDate, setSelectedDate] = useState(() => toCalendarDate(new Date()))
  const [today] = useState(() => toCalendarDate(new Date()))
  const [viewerId, setViewerId] = useState<string | null>(null)
  const memories = useMemo(
    () => photosOnThisDay(photos, selectedDate),
    [photos, selectedDate],
  )
  const currentPhoto = viewerId ? photos.find((photo) => photo.id === viewerId) : undefined

  function moveDate(days: number) {
    setSelectedDate((current) => shiftCalendarDate(current, days))
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-2">A small return through time</p>
            <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">On This Day</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#82796e]">
              The photographs you saved on this date in years gone by.
            </p>
          </div>
          <Link to="/timeline" className="auth-secondary">
            <Images size={15} /> Explore your life timeline
          </Link>
        </header>

        <section className="mb-9 flex flex-wrap items-center justify-between gap-4 border-y border-[#302d29]/12 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eae2d6] text-[#8b7861]"><Clock3 size={17} /></span>
            <div>
              <p className="eyebrow text-[0.55rem]">Looking back to</p>
              <p className="serif text-2xl">{formatCalendarDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="auth-secondary min-h-9 px-3" aria-label="Previous date" onClick={() => moveDate(-1)}>
              <ArrowLeft size={15} /> <span className="hidden sm:inline">Previous day</span>
            </button>
            <label htmlFor="rediscovery-date" className="sr-only">Choose a date to rediscover</label>
            <input
              id="rediscovery-date"
              type="date"
              className="auth-input min-h-9 w-40 py-1.5 text-xs"
              value={selectedDate}
              max={today}
              onChange={(event) => {
                if (event.target.value) setSelectedDate(event.target.value)
              }}
            />
            <button
              type="button"
              className="auth-secondary min-h-9 px-3"
              aria-label="Next date"
              disabled={selectedDate >= today}
              onClick={() => moveDate(1)}
            >
              <span className="hidden sm:inline">Next day</span> <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {storageError && <p className="auth-error mb-6" role="alert">{storageError}</p>}

        {loading ? (
          <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">
            Turning back the pages…
          </div>
        ) : memories.length ? (
          <div className="space-y-12">
            {memories.map((group) => (
              <section key={group.year}>
                <header className="mb-5 flex items-end justify-between border-b border-[#302d29]/12 pb-3">
                  <div>
                    <p className="eyebrow mb-1">On this date</p>
                    <h2 className="serif text-4xl">{group.year}</h2>
                  </div>
                  <span className="text-[0.68rem] text-[#8b8175]">
                    {group.photos.length} {group.photos.length === 1 ? 'photograph' : 'photographs'}
                  </span>
                </header>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.photos.map((photo, index) => (
                    <article key={photo.id} className={`group ${index % 3 === 1 ? 'lg:mt-7' : ''}`}>
                      <button type="button" className="block w-full text-left" onClick={() => setViewerId(photo.id)}>
                        <MemoryPhotoImage
                          photo={photo}
                          alt={photo.title}
                          className={`${index % 3 === 1 ? 'aspect-[0.95]' : 'aspect-[1.14]'} transition-transform duration-300 group-hover:-translate-y-1`}
                        />
                        <span className="mt-3 block text-[0.62rem] uppercase tracking-[0.12em] text-[#8b7861]">
                          {formatCalendarDate(photo.date)}
                          {photo.location ? ` · ${photo.location}` : ''}
                        </span>
                        <span className="serif mt-1 block text-2xl leading-tight">{photo.title}</span>
                        {photo.caption && <span className="mt-1.5 block text-xs leading-5 text-[#82796e]">{photo.caption}</span>}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[26rem] flex-col items-center justify-center bg-[#eee8df] px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c8b7a2] text-[#8b7861]"><Clock3 size={24} strokeWidth={1.4} /></span>
            <p className="eyebrow mt-5">A quiet day in your archive</p>
            <h2 className="serif mt-2 max-w-xl text-3xl">
              Nothing from {formatCalendarDate(selectedDate, { month: 'long', day: 'numeric' })} in earlier years, just yet.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#82796e]">
              As you add dated photographs, the moments that share this day will find their way here.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/memories" className="auth-primary"><Images size={15} /> Visit My Memories</Link>
              <Link to="/timeline" className="auth-secondary">View Life Timeline</Link>
            </div>
          </div>
        )}
      </motion.div>

      {currentPhoto && (
        <PhotoViewer photos={photos} photoId={currentPhoto.id} onClose={() => setViewerId(null)} />
      )}
    </div>
  )
}
