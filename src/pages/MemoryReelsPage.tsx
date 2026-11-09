import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Film, Pause, Play, Plus, Trash2, Video } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { useObjectUrl } from '../components/useObjectUrl'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import {
  memoryReelThemes,
  type MemoryReel,
  type MemoryReelSlide,
  type MemoryReelTheme,
  type MemoryReelTransition,
} from '../data/memoryTypes'

export function MemoryReelsPage() {
  const { reelId } = useParams()
  const location = useLocation()
  const { reels, loading, storageError } = useMemory()
  const reel = reelId ? reels.find((item) => item.id === reelId) : undefined
  if (location.pathname === '/reels/new') return <ReelEditor />
  if (reelId && location.pathname.endsWith('/edit')) {
    if (loading) return <PageStatus>Opening your reel…</PageStatus>
    return reel ? <ReelEditor key={reel.id} reel={reel} /> : <NotFound />
  }
  if (reelId && location.pathname.endsWith('/preview')) {
    if (loading) return <PageStatus>Preparing your reel…</PageStatus>
    return reel ? <ReelPreview reel={reel} /> : <NotFound />
  }
  return <ReelLibrary reels={reels} loading={loading} storageError={storageError} />
}

function ReelLibrary({
  reels,
  loading,
  storageError,
}: {
  reels: MemoryReel[]
  loading: boolean
  storageError: string
}) {
  const { photos, deleteReel } = useMemory()
  const { showToast } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<MemoryReel | null>(null)
  const [busy, setBusy] = useState(false)

  async function remove() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteReel(deleteTarget.id)
      showToast('Memory reel deleted.')
      setDeleteTarget(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The reel could not be deleted.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-2">A few frames, moving through time</p>
            <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Memory Reels</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#82796e]">Arrange photographs into a quiet, personal slideshow with your captions and soundtrack.</p>
          </div>
          <Link to="/reels/new" className="auth-primary"><Plus size={16} /> Create a reel</Link>
        </header>
        {storageError && <p className="auth-error mb-6" role="alert">{storageError}</p>}
        {loading ? <PageStatus>Gathering your reels…</PageStatus> : reels.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {reels.map((reel, index) => {
              const cover = reel.slides.map((slide) => photos.find((photo) => photo.id === slide.photoId)).find((photo) => photo !== undefined)
              return <article key={reel.id} className={`overflow-hidden border border-[#302d29]/10 bg-[#fbf9f5] ${index % 3 === 1 ? 'md:mt-6' : ''}`}>
                <Link to={`/reels/${reel.id}/preview`} className="relative block aspect-[1.55] overflow-hidden bg-[#eae2d6]">
                  {cover ? <MemoryPhotoImage photo={cover} alt={cover.title} className="h-full w-full" /> : <span className="flex h-full items-center justify-center text-[#8b7861]"><Film size={34} /></span>}
                  <span className="absolute inset-0 flex items-center justify-center bg-[#211f1c]/15 text-white"><Play size={26} fill="currentColor" /></span>
                </Link>
                <div className="p-4">
                  <p className="eyebrow text-[0.55rem]">{reel.theme}</p>
                  <h2 className="serif mt-1 truncate text-2xl">{reel.title}</h2>
                  <div className="mt-3 flex items-center justify-between gap-2"><span className="text-[0.62rem] text-[#8b8175]">{reel.slides.length} frames · {reel.musicName ? 'Your audio' : 'No music'}</span><div className="flex gap-1"><Link aria-label={`Preview ${reel.title}`} to={`/reels/${reel.id}/preview`} className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df]"><Play size={15} /></Link><Link aria-label={`Edit ${reel.title}`} to={`/reels/${reel.id}/edit`} className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df]"><Film size={15} /></Link><button type="button" aria-label={`Delete ${reel.title}`} className="rounded-full p-2 text-[#805449] hover:bg-[#f5e9e4]" onClick={() => setDeleteTarget(reel)}><Trash2 size={15} /></button></div></div>
                </div>
              </article>
            })}
          </div>
        ) : (
          <div className="flex min-h-[26rem] flex-col items-center justify-center border border-dashed border-[#c8b7a2] bg-[#fbf9f5]/70 px-6 text-center">
            <Film size={30} className="text-[#8b7861]" strokeWidth={1.3} /><p className="eyebrow mt-5">A sequence of your own</p><h2 className="serif mt-2 max-w-xl text-3xl">Let your photographs take a little journey.</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#82796e]">Choose a few photographs, arrange the moments, and add captions to make your own slideshow.</p><Link to="/reels/new" className="auth-primary mt-5"><Plus size={15} /> Create your first reel</Link>
          </div>
        )}
      </motion.div>
      {deleteTarget && <ConfirmDialog title="Delete this reel?" description="This removes the slideshow and its sequence. Your original photographs and any user-provided audio remain in your personal library." confirmLabel="Delete reel" busy={busy} onCancel={() => setDeleteTarget(null)} onConfirm={() => void remove()} />}
    </div>
  )
}

function ReelEditor({ reel }: { reel?: MemoryReel }) {
  const { photos, createReel, updateReel } = useMemory()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [title, setTitle] = useState(reel?.title ?? '')
  const [theme, setTheme] = useState<MemoryReelTheme>(reel?.theme ?? memoryReelThemes[0])
  const [slides, setSlides] = useState<MemoryReelSlide[]>(reel?.slides ?? [])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [musicName, setMusicName] = useState(reel?.musicName ?? '')
  const [musicBlob, setMusicBlob] = useState<Blob | null>(reel?.musicBlob ?? null)
  const [musicError, setMusicError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [savedAt, setSavedAt] = useState(reel?.updatedAt ?? '')
  const previewPhotos = slides.map((slide) => photos.find((photo) => photo.id === slide.photoId)).filter((photo) => photo !== undefined)
  const audioUrl = useObjectUrl(musicBlob)

  useEffect(() => {
    if (!playing || !slides.length) return
    const activeSlide = slides[Math.min(currentIndex, slides.length - 1)]
    const timer = window.setTimeout(() => {
      setCurrentIndex((index) => {
        if (index >= slides.length - 1) {
          setPlaying(false)
          return 0
        }
        return index + 1
      })
    }, (activeSlide?.duration ?? 4) * 1000)
    return () => window.clearTimeout(timer)
  }, [currentIndex, playing, slides])

  function addSelected() {
    const next = selectedIds.map((photoId) => {
      const photo = photos.find((item) => item.id === photoId)
      return { id: crypto.randomUUID(), photoId, caption: photo?.caption ?? '', duration: 4, transition: 'fade' as const }
    })
    setSlides((current) => [...current, ...next])
    setSelectedIds([])
    if (!slides.length && next.length) setCurrentIndex(0)
  }

  function patchSlide(id: string, patch: Partial<MemoryReelSlide>) {
    setSlides((current) => current.map((slide) => slide.id === id ? { ...slide, ...patch } : slide))
  }

  function reorderSlide(target: number) {
    if (draggedIndex === null || draggedIndex === target) return
    setSlides((current) => reorder(current, draggedIndex, target))
    setCurrentIndex(target)
    setDraggedIndex(null)
  }

  async function chooseAudio(file?: File) {
    setMusicError('')
    if (!file) return
    const supported = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/mp4'])
    if (!supported.has(file.type) && !/\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name)) {
      setMusicError('Choose an MP3, WAV, OGG, M4A, or WEBM audio file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setMusicError('Audio must be 20 MB or smaller.')
      return
    }
    setMusicName(file.name)
    setMusicBlob(file)
  }

  async function save() {
    if (!title.trim()) {
      setError('Give your reel a title.')
      return
    }
    if (!slides.length) {
      setError('Add at least one photograph to your reel.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const details = { title: title.trim(), theme, slides, musicName: musicName || null, musicBlob }
      if (reel) {
        await updateReel(reel.id, details)
        setSavedAt(new Date().toISOString())
        showToast('Reel changes saved.')
      } else {
        const id = await createReel(details)
        showToast('Your reel is saved.')
        navigate(`/reels/${id}/edit`, { replace: true })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The reel could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[88rem]">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link to="/reels" className="inline-flex items-center gap-2 text-xs text-[#8b7861]"><ArrowLeft size={15} /> All reels</Link><span className="text-[0.63rem] text-[#8b8175]">{savedAt ? `Last saved ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(savedAt))}` : 'Draft · saved on this device when you choose Save reel'}</span></header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <section className="min-w-0">
          <header className="mb-5 border-b border-[#302d29]/12 pb-5">
            <p className="eyebrow mb-2">Compose a moving keepsake</p><input aria-label="Reel title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="w-full border-0 bg-transparent p-0 serif text-4xl outline-none placeholder:text-[#b6aa9c] focus:ring-0" placeholder="Name your memory reel…" />
          </header>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="text-xs font-semibold">Visual theme</span><select aria-label="Reel theme" className="auth-input min-h-10 py-2 text-xs" value={theme} onChange={(event) => setTheme(event.target.value as MemoryReelTheme)}>{memoryReelThemes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="space-y-1.5"><label htmlFor="reel-audio" className="block text-xs font-semibold">Soundtrack · your own audio only</label><div className="flex flex-wrap items-center gap-2"><input id="reel-audio" type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,.mp3,.wav,.ogg,.m4a,.webm" className="min-w-0 flex-1 text-[0.65rem] file:mr-2 file:border-0 file:bg-[#eee8df] file:px-2 file:py-2" onChange={(event) => void chooseAudio(event.target.files?.[0])} /><button type="button" className="text-[0.65rem] text-[#805449]" onClick={() => { setMusicName(''); setMusicBlob(null); setMusicError('') }}>No music</button></div>{musicName && <span className="block truncate text-[0.62rem] text-[#8b8175]">Selected: {musicName}</span>}{musicError && <p role="alert" className="auth-field-error">{musicError}</p>}{audioUrl && <audio controls src={audioUrl} className="mt-1 h-8 w-full" aria-label="Preview your selected soundtrack" />}</div>
          </div>

          <ReelStage title={title} theme={theme} slide={slides[currentIndex]} photo={previewPhotos[currentIndex]} playing={playing} onTogglePlay={() => setPlaying((current) => !current)} onPrevious={() => setCurrentIndex((index) => Math.max(0, index - 1))} onNext={() => setCurrentIndex((index) => Math.min(slides.length - 1, index + 1))} position={slides.length ? `${currentIndex + 1} / ${slides.length}` : 'Preview'} />

          <section className="mt-7 border-y border-[#302d29]/12 py-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow mb-1">The sequence</p><h2 className="serif text-3xl">{slides.length} {slides.length === 1 ? 'frame' : 'frames'}</h2></div><span className="text-[0.62rem] text-[#8b8175]">Drag thumbnails to reorder</span></div>
            {slides.length ? <div className="space-y-3">
              {slides.map((slide, index) => {
                const photo = photos.find((item) => item.id === slide.photoId)
                return <article key={slide.id} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderSlide(index)} className={`grid gap-3 border p-3 sm:grid-cols-[8rem_1fr_auto] ${currentIndex === index ? 'border-[#a68c70] bg-[#eee8df]/60' : 'border-[#302d29]/10 bg-[#fbf9f5]'}`}>
                  <button type="button" className="relative cursor-grab text-left" onClick={() => setCurrentIndex(index)}>{photo ? <MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-[1.35]" /> : <div className="flex aspect-[1.35] items-center justify-center bg-[#eee8df] text-xs text-[#805449]">Photo unavailable</div>}<span className="absolute bottom-1 left-1 bg-[#211f1c]/70 px-1.5 py-0.5 text-[0.6rem] text-white">{index + 1}</span></button>
                  <div className="grid gap-2 sm:grid-cols-2"><label className="text-[0.62rem] font-semibold">Caption<textarea aria-label={`Caption for frame ${index + 1}`} className="auth-input mt-1 min-h-14 py-2 text-xs" value={slide.caption} onChange={(event) => patchSlide(slide.id, { caption: event.target.value })} maxLength={500} placeholder="A line to hold this moment…" /></label><div className="grid gap-2"><label className="text-[0.62rem] font-semibold">Duration<select aria-label={`Duration for frame ${index + 1}`} className="auth-input mt-1 min-h-9 py-1.5 text-xs" value={slide.duration} onChange={(event) => patchSlide(slide.id, { duration: Number(event.target.value) })}>{[2, 3, 4, 5, 6, 8, 10, 12].map((seconds) => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select></label><label className="text-[0.62rem] font-semibold">Transition<select aria-label={`Transition for frame ${index + 1}`} className="auth-input mt-1 min-h-9 py-1.5 text-xs" value={slide.transition} onChange={(event) => patchSlide(slide.id, { transition: event.target.value as MemoryReelTransition })}><option value="fade">Fade</option><option value="dissolve">Dissolve</option><option value="slide">Slide</option><option value="cut">Cut</option></select></label></div></div>
                  <button type="button" aria-label={`Remove frame ${index + 1}`} className="flex h-9 items-center justify-center gap-1 self-start px-2 text-[0.65rem] text-[#805449] hover:bg-[#f5e9e4]" onClick={() => { setSlides((current) => current.filter((item) => item.id !== slide.id)); setCurrentIndex((current) => Math.max(0, Math.min(current, slides.length - 2))) }}><Trash2 size={14} /><span className="sm:hidden">Remove</span></button>
                </article>
              })}
            </div> : <p className="border border-dashed border-[#c8b7a2] px-4 py-8 text-center text-xs text-[#82796e]">Select photographs below to begin your sequence.</p>}
          </section>

          <section className="mt-6">
            <p className="mb-3 text-xs font-semibold">Add photographs from My Memories</p>
            {photos.length ? <div className="grid max-h-60 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 lg:grid-cols-5">{photos.map((photo) => {
              const selected = selectedIds.includes(photo.id)
              const alreadyAdded = slides.some((slide) => slide.photoId === photo.id)
              return <label key={photo.id} className={`relative cursor-pointer border p-1.5 ${selected ? 'border-[#805449] bg-[#eee8df]' : 'border-transparent bg-[#fbf9f5]'}`}><input aria-label={`Add ${photo.title} to reel`} className="absolute left-2 top-2 z-10 h-4 w-4 accent-[#805449]" type="checkbox" checked={selected} onChange={() => setSelectedIds((current) => current.includes(photo.id) ? current.filter((id) => id !== photo.id) : [...current, photo.id])} /><MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-square" /><span className="mt-1 block truncate text-[0.6rem]">{photo.title}</span>{alreadyAdded && <span className="absolute right-2 top-2 bg-[#302d29]/75 px-1 text-[0.53rem] text-white">In reel</span>}</label>
            })}</div> : <p className="text-xs text-[#82796e]">Add photographs in My Memories first.</p>}
            <button type="button" className="auth-secondary mt-3 min-h-9" disabled={!selectedIds.length} onClick={addSelected}><Plus size={14} /> Add selected frames</button>
          </section>
          {error && <p role="alert" className="auth-error mt-5">{error}</p>}
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#302d29]/12 pt-4"><span className="text-[0.62rem] text-[#8b8175]">Video export is not available in this browser prototype.</span><button type="button" className="auth-primary min-h-10" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save reel'}</button></footer>
        </section>
        <aside className="h-fit xl:sticky xl:top-24"><p className="eyebrow mb-2">Reel notes</p><div className="border border-[#302d29]/10 bg-[#eee8df]/60 p-5"><Video size={20} className="text-[#8b7861]" /><h2 className="serif mt-3 text-2xl">{theme}</h2><p className="mt-2 text-xs leading-5 text-[#82796e]">Each frame keeps its own caption, duration, and transition. Your photos always stay in the original library.</p><p className="mt-4 border-t border-[#302d29]/10 pt-4 text-[0.65rem] leading-5 text-[#8b8175]">Music is limited to audio you provide yourself. No commercial tracks are included.</p></div></aside>
      </div>
    </div>
  )
}

function ReelPreview({ reel }: { reel: MemoryReel }) {
  const { photos } = useMemory()
  const navigate = useNavigate()
  const [playing, setPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentSlide = reel.slides[currentIndex]
  const photo = currentSlide ? photos.find((item) => item.id === currentSlide.photoId) : undefined
  const audioUrl = useObjectUrl(reel.musicBlob)
  useEffect(() => {
    if (!playing || !reel.slides.length) return
    const timer = window.setTimeout(() => setCurrentIndex((index) => {
      if (index >= reel.slides.length - 1) {
        setPlaying(false)
        return 0
      }
      return index + 1
    }), (currentSlide?.duration ?? 4) * 1000)
    return () => window.clearTimeout(timer)
  }, [currentIndex, currentSlide?.duration, playing, reel.slides])
  return <div className="mx-auto max-w-[82rem]"><header className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link to={`/reels/${reel.id}/edit`} className="inline-flex items-center gap-2 text-xs text-[#8b7861]"><ArrowLeft size={15} /> Return to the editor</Link><span className="text-[0.63rem] text-[#8b8175]">Slideshow preview · Video export unavailable</span></header><div className="mx-auto max-w-5xl"><ReelStage title={reel.title} theme={reel.theme} slide={currentSlide} photo={photo} playing={playing} onTogglePlay={() => setPlaying((current) => !current)} onPrevious={() => setCurrentIndex((index) => Math.max(0, index - 1))} onNext={() => setCurrentIndex((index) => Math.min(reel.slides.length - 1, index + 1))} position={`${reel.slides.length ? currentIndex + 1 : 0} / ${reel.slides.length}`} /><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-1">{reel.slides.map((slide, index) => {const item = photos.find((photoItem) => photoItem.id === slide.photoId);return <button key={slide.id} type="button" aria-label={`Go to frame ${index + 1}`} onClick={() => { setPlaying(false); setCurrentIndex(index) }} className={`w-14 border-2 ${index === currentIndex ? 'border-[#805449]' : 'border-transparent'}`}>{item ? <MemoryPhotoImage photo={item} alt={item.title} className="aspect-[1.3]" /> : <span className="flex aspect-[1.3] items-center justify-center bg-[#eee8df] text-[0.55rem]">Missing</span>}</button>})}</div>{audioUrl ? <audio controls src={audioUrl} className="h-8 max-w-full" aria-label={`Audio selected for ${reel.title}`} /> : <span className="text-xs text-[#8b8175]">No soundtrack selected</span>}</div><button type="button" className="auth-secondary mt-5" onClick={() => navigate(`/reels/${reel.id}/edit`)}>Edit this reel</button></div></div>
}

function ReelStage({
  title,
  theme,
  slide,
  photo,
  playing,
  onTogglePlay,
  onPrevious,
  onNext,
  position,
}: {
  title: string
  theme: MemoryReelTheme
  slide?: MemoryReelSlide
  photo?: ReturnType<typeof useMemory>['photos'][number]
  playing: boolean
  onTogglePlay: () => void
  onPrevious: () => void
  onNext: () => void
  position: string
}) {
  const themeClass = theme === 'Nostalgic Film' ? 'bg-[#3c3934]' : theme === 'Travel Diary' ? 'bg-[#d9cbbb]' : theme === 'Family Moments' ? 'bg-[#eae2d6]' : theme === 'Warm Memories' ? 'bg-[#e8d7c6]' : 'bg-[#eee8df]'
  const transitionType = slide?.transition ?? 'fade'
  const transitionInitial = transitionType === 'cut'
    ? false
    : transitionType === 'slide'
      ? { opacity: 0, x: 24 }
      : { opacity: 0 }
  return <section className={`relative overflow-hidden border border-[#302d29]/15 ${themeClass}`}>
    <div className="relative flex aspect-video min-h-[16rem] items-center justify-center sm:min-h-[25rem]">
      {photo ? <motion.div key={slide?.id} initial={transitionInitial} animate={{ opacity: 1, x: 0 }} transition={{ duration: transitionType === 'cut' ? 0 : transitionType === 'dissolve' ? 0.8 : 0.45, ease: 'easeOut' }} className="absolute inset-0"><MemoryPhotoImage photo={photo} alt={photo.title} className="h-full w-full" /></motion.div> : <div className="relative z-10 text-center text-[#71685d]"><Film size={30} className="mx-auto" strokeWidth={1.2} /><p className="serif mt-3 text-2xl">{slide ? 'This photograph is unavailable' : 'Your reel preview'}</p><p className="mt-1 text-xs">{slide ? 'Remove this frame or choose another photograph.' : 'Add a frame to see your sequence come to life.'}</p></div>}
      {photo && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#211f1c]/85 via-[#211f1c]/25 to-transparent px-5 pb-5 pt-16 text-white sm:px-8 sm:pb-7"><p className="eyebrow text-white/65">{theme}</p><h2 className="serif mt-1 text-2xl sm:text-3xl">{slide?.caption || photo.title}</h2></div>}
      <div className="absolute left-3 top-3 rounded bg-[#211f1c]/55 px-2 py-1 text-[0.62rem] text-white">{title || 'Untitled reel'}</div>
      <span className="absolute right-3 top-3 rounded bg-[#211f1c]/55 px-2 py-1 text-[0.62rem] text-white">{position}</span>
    </div>
    <footer className="flex items-center justify-center gap-3 border-t border-[#302d29]/10 px-4 py-3"><button type="button" aria-label="Previous frame" onClick={onPrevious} className="rounded-full p-2 text-[#514a40] hover:bg-white/50"><ArrowLeft size={17} /></button><button type="button" aria-label={playing ? 'Pause slideshow' : 'Play slideshow'} onClick={onTogglePlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#302d29] text-white hover:bg-[#4a433a]">{playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}</button><button type="button" aria-label="Next frame" onClick={onNext} className="rounded-full p-2 text-[#514a40] hover:bg-white/50"><ArrowRight size={17} /></button>{slide && <span className="ml-2 text-[0.62rem] text-[#71685d]">Next in {slide.duration}s · {slide.transition}</span>}</footer>
  </section>
}

function reorder<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [item] = next.splice(from, 1)
  if (item) next.splice(to, 0, item)
  return next
}

function PageStatus({ children }: { children: React.ReactNode }) {
  return <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">{children}</div>
}

function NotFound() {
  return <div className="mx-auto max-w-xl py-20 text-center"><p className="eyebrow">Reel not found</p><h1 className="serif mt-2 text-4xl">This sequence is not in your collection.</h1><Link to="/reels" className="auth-secondary mt-5">Return to Memory Reels</Link></div>
}
