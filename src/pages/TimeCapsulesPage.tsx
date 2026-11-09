import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Clock3, LockKeyhole, MailOpen, Plus, Search, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog, MemoryDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import type { TimeCapsule, TimeCapsuleDetails } from '../data/memoryTypes'

type CapsuleFilter = 'all' | 'draft' | 'sealed' | 'ready' | 'opened'

export function TimeCapsulesPage() {
  const { capsuleId } = useParams()
  const location = useLocation()
  const { capsules, loading, storageError } = useMemory()
  if (location.pathname === '/capsules/new') return <CapsuleEditor />
  if (capsuleId && location.pathname.endsWith('/edit')) {
    if (loading) return <PageStatus>Opening your letter…</PageStatus>
    const capsule = capsules.find((item) => item.id === capsuleId)
    return capsule?.state === 'draft' ? <CapsuleEditor key={capsule.id} capsule={capsule} /> : <NotFound />
  }
  if (capsuleId) {
    if (loading) return <PageStatus>Preparing your keepsake…</PageStatus>
    const capsule = capsules.find((item) => item.id === capsuleId)
    return capsule ? <CapsuleDetail key={capsule.id} capsule={capsule} /> : <NotFound />
  }
  return <CapsuleLibrary capsules={capsules} loading={loading} storageError={storageError} />
}

function CapsuleLibrary({
  capsules,
  loading,
  storageError,
}: {
  capsules: TimeCapsule[]
  loading: boolean
  storageError: string
}) {
  const { deleteCapsule } = useMemory()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CapsuleFilter>('all')
  const [deleteTarget, setDeleteTarget] = useState<TimeCapsule | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const filtered = useMemo(() => capsules.filter((capsule) => {
    const ready = capsule.state === 'sealed' && capsule.unlockDate <= localDate(now)
    const matchesState = filter === 'all' ||
      (filter === 'ready' && ready) ||
      (filter === 'sealed' && capsule.state === 'sealed' && !ready) ||
      (filter === 'draft' && capsule.state === 'draft') ||
      (filter === 'opened' && capsule.state === 'opened')
    const searchableText = capsule.state === 'sealed'
      ? capsule.title
      : `${capsule.title} ${capsule.description}`
    const matchesQuery = searchableText.toLowerCase().includes(query.trim().toLowerCase())
    return matchesState && matchesQuery
  }), [capsules, filter, now, query])
  const counts = {
    all: capsules.length,
    draft: capsules.filter((item) => item.state === 'draft').length,
    sealed: capsules.filter((item) => item.state === 'sealed' && item.unlockDate > localDate(now)).length,
    ready: capsules.filter((item) => item.state === 'sealed' && item.unlockDate <= localDate(now)).length,
    opened: capsules.filter((item) => item.state === 'opened').length,
  }

  async function remove() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteCapsule(deleteTarget.id)
      showToast('Draft capsule deleted.')
      setDeleteTarget(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The capsule could not be deleted.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const filters: Array<{ id: CapsuleFilter; label: string }> = [
    { id: 'all', label: 'All capsules' },
    { id: 'draft', label: 'Drafts' },
    { id: 'sealed', label: 'Sealed' },
    { id: 'ready', label: 'Ready to open' },
    { id: 'opened', label: 'Opened' },
  ]

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><p className="eyebrow mb-2">A letter to the person you will be</p><h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Time Capsules</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#82796e]">Set a memory aside for another day. Capsules are stored on this device and will not be delivered or synced elsewhere.</p></div>
        <Link to="/capsules/new" className="auth-primary"><Plus size={16} /> Create a capsule</Link>
      </header>
      {storageError && <p className="auth-error mb-5" role="alert">{storageError}</p>}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-[#302d29]/12 py-3">
        <div role="tablist" aria-label="Filter capsules" className="flex flex-wrap gap-1">
          {filters.map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)} className={`px-3 py-2 text-[0.67rem] ${filter === item.id ? 'bg-[#302d29] text-white' : 'text-[#71685d] hover:bg-[#eee8df]'}`}>{item.label} <span className="ml-1 opacity-65">{counts[item.id]}</span></button>)}
        </div>
        <label className="flex min-w-48 items-center gap-2 border-b border-[#302d29]/20 px-1 py-1.5"><Search size={14} className="text-[#8b8175]" /><input aria-label="Search capsules" className="w-full border-0 bg-transparent text-xs outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a capsule…" /></label>
      </div>
      {loading ? <PageStatus>Gathering your time capsules…</PageStatus> : filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((capsule, index) => {
            const ready = capsule.state === 'sealed' && capsule.unlockDate <= localDate(now)
            const isOpened = capsule.state === 'opened'
            return (
              <article key={capsule.id} className={`group relative overflow-hidden border border-[#302d29]/10 bg-[#fbf9f5] ${index % 3 === 1 ? 'md:mt-6' : ''}`}>
                <Link to={capsule.state === 'draft' ? `/capsules/${capsule.id}/edit` : `/capsules/${capsule.id}`} className="block">
                  <div className={`relative flex aspect-[1.55] items-center justify-center overflow-hidden ${isOpened ? 'bg-[#eae2d6]' : 'bg-[#e8dfd3]'}`}>
                    {isOpened && capsule.coverPhotoId ? <CapsuleCover capsule={capsule} /> : <EnvelopeArt opened={isOpened} />}
                    <span className="absolute left-3 top-3 border border-white/60 bg-[#f8f5ef]/90 px-2 py-1 text-[0.55rem] uppercase tracking-[0.13em]">{isOpened ? 'Opened' : ready ? 'Ready to open' : capsule.state}</span>
                  </div>
                  <div className="p-4"><p className="eyebrow text-[0.54rem]">{isOpened ? 'A memory returned' : ready ? 'Today is the day' : `Opens ${formatDate(capsule.unlockDate)}`}</p><h2 className="serif mt-1 truncate text-2xl">{capsule.title}</h2><p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-[#82796e]">{isOpened ? capsule.description || 'A message from an earlier day.' : ready ? 'Your capsule is ready when you are.' : `A private keepsake, sealed until ${formatDate(capsule.unlockDate)}.`}</p><div className="mt-4 flex items-center justify-between border-t border-[#302d29]/10 pt-3"><span className="inline-flex items-center gap-1.5 text-[0.62rem] text-[#8b8175]">{isOpened ? <MailOpen size={13} /> : ready ? <Check size={13} /> : <LockKeyhole size={13} />}{isOpened ? 'Opened' : ready ? 'Available now' : countdown(capsule.unlockDate, now)}</span></div></div>
                </Link>
                {capsule.state === 'draft' && <div className="flex justify-end border-t border-[#302d29]/10 px-3 py-2"><button type="button" aria-label={`Delete ${capsule.title}`} onClick={() => setDeleteTarget(capsule)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.62rem] text-[#805449] hover:bg-[#f5e9e4]"><Trash2 size={13} /> Delete draft</button></div>}
              </article>
            )
          })}
        </div>
      ) : <div className="flex min-h-[24rem] flex-col items-center justify-center border border-dashed border-[#c8b7a2] bg-[#fbf9f5]/70 px-6 text-center"><Clock3 size={29} strokeWidth={1.3} className="text-[#8b7861]" /><p className="eyebrow mt-5">{query ? 'No matching letters' : filter === 'all' ? 'A little message for later' : `No ${filters.find((item) => item.id === filter)?.label.toLowerCase()} yet`}</p><h2 className="serif mt-2 max-w-xl text-3xl">{query ? 'Try another search.' : 'Save something lovely for another day.'}</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#82796e]">Choose a future date, add a letter and a few moments, then seal your capsule on this device.</p><Link to="/capsules/new" className="auth-primary mt-5"><Plus size={15} /> Create a capsule</Link></div>}
      {deleteTarget && <ConfirmDialog title="Delete this draft?" description="This draft and its letter will be removed. The photographs and stories linked to it stay in your library." confirmLabel="Delete draft" busy={busy} onCancel={() => setDeleteTarget(null)} onConfirm={() => void remove()} />}
    </div>
  )
}

function CapsuleCover({ capsule }: { capsule: TimeCapsule }) {
  const { photos } = useMemory()
  const photo = photos.find((item) => item.id === capsule.coverPhotoId)
  return photo ? <MemoryPhotoImage photo={photo} alt={photo.title} className="absolute inset-0 h-full w-full" /> : <EnvelopeArt opened />
}

function CapsuleEditor({ capsule }: { capsule?: TimeCapsule }) {
  const { photos, stories, createCapsule, updateCapsule } = useMemory()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [tomorrow] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    return localDate(date)
  })
  const [title, setTitle] = useState(capsule?.title ?? '')
  const [description, setDescription] = useState(capsule?.description ?? '')
  const [letter, setLetter] = useState(capsule?.letter ?? '')
  const [unlockDate, setUnlockDate] = useState(capsule?.unlockDate ?? tomorrow)
  const [coverPhotoId, setCoverPhotoId] = useState(capsule?.coverPhotoId ?? '')
  const [photoIds, setPhotoIds] = useState<string[]>(capsule?.photoIds ?? [])
  const [storyIds, setStoryIds] = useState<string[]>(capsule?.storyIds ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sealPrompt, setSealPrompt] = useState(false)

  async function save(state: 'draft' | 'sealed') {
    if (!title.trim()) { setError('Give this capsule a title.'); return }
    if (state === 'sealed' && !letter.trim()) { setError('Write a letter before sealing your capsule.'); return }
    if (state === 'sealed' && unlockDate <= localDate(new Date())) { setError('Choose a date in the future before sealing.'); return }
    setBusy(true)
    setError('')
    const details: TimeCapsuleDetails = {
      title: title.trim(),
      description: description.trim(),
      letter: letter.trim(),
      unlockDate,
      coverPhotoId: coverPhotoId || null,
      photoIds,
      storyIds,
      state,
    }
    try {
      if (capsule) {
        await updateCapsule(capsule.id, details)
        showToast(state === 'sealed' ? 'Your capsule is sealed.' : 'Draft changes saved.')
        navigate(state === 'sealed' ? `/capsules/${capsule.id}` : '/capsules')
      } else {
        const id = await createCapsule(details)
        showToast(state === 'sealed' ? 'Your capsule is sealed.' : 'Draft capsule saved.')
        navigate(state === 'sealed' ? `/capsules/${id}` : '/capsules')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The capsule could not be saved.')
    } finally {
      setBusy(false)
      setSealPrompt(false)
    }
  }

  return (
    <div className="mx-auto max-w-[76rem]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link to="/capsules" className="inline-flex items-center gap-2 text-xs text-[#8b7861]"><ArrowLeft size={15} /> All capsules</Link><span className="text-[0.63rem] text-[#8b8175]">A keepsake on this device · not a delivery service</span></header>
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
        <section className="border border-[#302d29]/10 bg-[#fbf9f5]">
          <header className="border-b border-[#302d29]/10 bg-[#eee8df]/60 px-5 py-5 sm:px-8"><p className="eyebrow mb-2">Write a note to another day</p><input aria-label="Capsule title" className="w-full border-0 bg-transparent p-0 serif text-4xl outline-none placeholder:text-[#b6aa9c] focus:ring-0" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A name for this keepsake…" /><textarea aria-label="Capsule description" className="mt-3 min-h-12 w-full resize-y border-0 bg-transparent p-0 text-sm leading-6 text-[#71685d] outline-none placeholder:text-[#aaa197] focus:ring-0" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A hint about what future-you will find…" /></header>
          <div className="space-y-6 p-5 sm:p-8">
            <label className="block"><span className="mb-2 block text-xs font-semibold">Your letter</span><textarea aria-label="Capsule letter" className="auth-input min-h-48 resize-y bg-[#fffefa] text-sm leading-7" maxLength={10000} value={letter} onChange={(event) => setLetter(event.target.value)} placeholder="What would you like to tell yourself, or remember, when this date arrives?" /><span className="mt-1 block text-right text-[0.6rem] text-[#8b8175]">{letter.trim() ? letter.trim().split(/\s+/).length : 0} words</span></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="text-xs font-semibold">Unlock date</span><input aria-label="Unlock date" type="date" min={tomorrow} className="auth-input min-h-10 py-2 text-xs" value={unlockDate} onChange={(event) => setUnlockDate(event.target.value)} /></label><label className="space-y-1.5"><span className="text-xs font-semibold">Cover photograph</span><select aria-label="Capsule cover photograph" className="auth-input min-h-10 py-2 text-xs" value={coverPhotoId} onChange={(event) => setCoverPhotoId(event.target.value)}><option value="">Keepsake envelope</option>{photos.map((photo) => <option key={photo.id} value={photo.id}>{photo.title}</option>)}</select></label></div>
            <PhotoPicker photos={photos} selected={photoIds} onChange={setPhotoIds} heading="Photographs tucked inside" kind="capsule" />
            <section><p className="mb-2 text-xs font-semibold">Related Memory Stories</p>{stories.length ? <div className="max-h-44 space-y-2 overflow-auto border-y border-[#302d29]/10 py-2">{stories.map((story) => <label key={story.id} className="flex items-start gap-2 py-1 text-xs"><input type="checkbox" checked={storyIds.includes(story.id)} onChange={() => setStoryIds((current) => current.includes(story.id) ? current.filter((id) => id !== story.id) : [...current, story.id])} /><span><span className="block">{story.title}</span><span className="mt-0.5 block text-[0.62rem] text-[#8b8175]">{story.category}</span></span></label>)}</div> : <p className="text-xs text-[#82796e]">Stories you have written will appear here.</p>}</section>
          </div>
          {error && <p role="alert" className="auth-error mx-5 mb-4 sm:mx-8">{error}</p>}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#302d29]/10 bg-[#f7f3ed] px-5 py-4 sm:px-8"><span className="text-[0.62rem] text-[#8b8175]">Sealing makes this capsule read-only until its unlock date.</span><div className="flex gap-2"><button type="button" className="auth-secondary min-h-9" disabled={busy} onClick={() => void save('draft')}>{busy ? 'Saving…' : 'Save draft'}</button><button type="button" className="auth-primary min-h-9" disabled={busy} onClick={() => setSealPrompt(true)}><LockKeyhole size={14} /> Seal capsule</button></div></footer>
        </section>
        <aside className="h-fit border border-[#302d29]/10 bg-[#eae2d6] p-6 sm:p-8"><EnvelopeArt /><p className="eyebrow mt-6">A promise for later</p><h2 className="serif mt-2 text-3xl">Opens {formatDate(unlockDate)}</h2><p className="mt-3 text-sm leading-6 text-[#71685d]">Your letter and its attached memories stay sealed until the chosen calendar date, on this device. The unlock is enforced when you try to open it.</p><div className="mt-5 border-t border-[#302d29]/10 pt-4 text-[0.67rem] leading-5 text-[#82796e]">This local prototype cannot send the capsule to another person, deliver it in the future, or sync it to another device.</div></aside>
      </div>
      {sealPrompt && <MemoryDialog title="Seal this capsule?" eyebrow="One quiet promise" onClose={() => setSealPrompt(false)}><p className="text-sm leading-6 text-[#71685d]">Once sealed, this capsule cannot be edited or opened before <strong>{formatDate(unlockDate)}</strong>. Your letter and attachments will stay hidden in the app until that date.</p><div className="mt-6 flex justify-end gap-2"><button type="button" className="auth-secondary" onClick={() => setSealPrompt(false)}>Go back</button><button type="button" className="auth-primary" disabled={busy} onClick={() => void save('sealed')}>{busy ? 'Sealing…' : 'Seal until this date'}</button></div></MemoryDialog>}
    </div>
  )
}

function CapsuleDetail({ capsule }: { capsule: TimeCapsule }) {
  const { photos, stories, openCapsule, updateCapsuleReflection } = useMemory()
  const { showToast } = useToast()
  const [now, setNow] = useState(() => new Date())
  const [opening, setOpening] = useState(false)
  const [reflection, setReflection] = useState(capsule.reflection)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const eligible = capsule.state === 'sealed' && capsule.unlockDate <= localDate(now)
  const isDraft = capsule.state === 'draft'
  const attachedPhotos = capsule.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo) => photo !== undefined)
  const attachedStories = capsule.storyIds.map((id) => stories.find((story) => story.id === id)).filter((story) => story !== undefined)
  const cover = photos.find((photo) => photo.id === capsule.coverPhotoId)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  async function unlock() {
    setError('')
    if (capsule.state !== 'sealed' || capsule.unlockDate > localDate(new Date())) {
      setError('This capsule is not ready to open yet. It remains sealed until its unlock date.')
      return
    }
    setOpening(true)
    try {
      await openCapsule(capsule.id)
      showToast('Your capsule is open.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The capsule could not be opened.')
    } finally {
      setOpening(false)
    }
  }

  async function saveReflection() {
    setSaving(true)
    try {
      await updateCapsuleReflection(capsule.id, reflection)
      showToast('Your reflection is saved.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your reflection could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[74rem]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link to="/capsules" className="inline-flex items-center gap-2 text-xs text-[#8b7861]"><ArrowLeft size={15} /> All capsules</Link>{isDraft && <Link to={`/capsules/${capsule.id}/edit`} className="auth-secondary min-h-9">Edit draft</Link>}</header>
      {isDraft ? <div className="mx-auto max-w-2xl border border-[#302d29]/10 bg-[#fbf9f5] p-6 sm:p-10"><EnvelopeArt /><p className="eyebrow mt-6">A draft, not yet sealed</p><h1 className="serif mt-2 text-4xl">{capsule.title}</h1><p className="mt-3 text-sm leading-6 text-[#82796e]">This letter is still a draft. Seal it when you are ready to set its unlock date.</p><Link to={`/capsules/${capsule.id}/edit`} className="auth-primary mt-5">Continue writing <ArrowRight size={14} /></Link></div> : capsule.state === 'sealed' ? (
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0.6, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} className="border border-[#302d29]/10 bg-[#eee8df] px-6 py-10 sm:px-14 sm:py-14">
            <EnvelopeArt /><p className="eyebrow mt-7">Sealed on this device</p><h1 className="serif mt-2 text-4xl sm:text-5xl">{capsule.title}</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#71685d]">The contents are resting here until the day you chose. Your letter and attachments remain hidden.</p>
            <div className="mx-auto mt-8 max-w-sm border-y border-[#302d29]/15 py-5"><p className="eyebrow">Unlock date</p><p className="serif mt-2 text-3xl">{formatDate(capsule.unlockDate)}</p><p aria-live="polite" className="mt-2 inline-flex items-center gap-2 text-xs text-[#71685d]"><Clock3 size={14} />{eligible ? 'Ready to open, whenever you are.' : countdown(capsule.unlockDate, now)}</p></div>
            {error && <p role="alert" className="auth-error mt-5 text-left">{error}</p>}
            <button type="button" className="auth-primary mt-6" disabled={!eligible || opening} onClick={() => void unlock()}><MailOpen size={15} />{opening ? 'Opening…' : eligible ? 'Open your capsule' : 'Still sealed'}</button>
            <p className="mt-5 text-[0.63rem] leading-5 text-[#8b8175]">Unlock checks use the current local calendar date and are enforced in the save layer too.</p>
          </motion.div>
        </div>
      ) : (
        <AnimatePresence mode="wait"><motion.article key="opened" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="overflow-hidden border border-[#302d29]/10 bg-[#fbf9f5]">
            {cover ? <MemoryPhotoImage photo={cover} alt={cover.title} className="aspect-[2.2] w-full" /> : <div className="flex aspect-[2.2] items-center justify-center bg-[#eae2d6]"><EnvelopeArt opened /></div>}
            <div className="p-6 sm:p-10"><p className="eyebrow">Opened {capsule.openedAt ? formatDate(capsule.openedAt.slice(0, 10)) : formatDate(capsule.unlockDate)}</p><h1 className="serif mt-2 text-4xl sm:text-5xl">{capsule.title}</h1>{capsule.description && <p className="mt-3 text-sm leading-6 text-[#82796e]">{capsule.description}</p>}<div className="my-7 h-px bg-[#302d29]/12" /><div className="mx-auto max-w-2xl whitespace-pre-wrap font-serif text-lg leading-9 text-[#514a40]">{capsule.letter || 'A note left for this day.'}</div>
              {attachedPhotos.length > 0 && <section className="mt-10"><p className="eyebrow mb-3">Tucked inside</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{attachedPhotos.map((photo) => <figure key={photo.id}><MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-[1.1]" /><figcaption className="mt-1 truncate text-[0.65rem] text-[#71685d]">{photo.caption || photo.title}</figcaption></figure>)}</div></section>}
              {capsule.photoIds.length > attachedPhotos.length && <p className="mt-3 text-xs text-[#8f493e]">Some attached photographs are no longer in your library.</p>}
              {attachedStories.length > 0 && <section className="mt-9 border-t border-[#302d29]/10 pt-6"><p className="eyebrow mb-3">Stories beside this letter</p><div className="space-y-4">{attachedStories.map((story) => <article key={story.id} className="border-l border-[#a68c70] pl-4"><Link to={`/stories/${story.id}`} className="serif text-2xl hover:text-[#805449]">{story.title}</Link><p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-[#82796e]">{story.body}</p></article>)}</div></section>}
              {capsule.storyIds.length > attachedStories.length && <p className="mt-3 text-xs text-[#8f493e]">Some linked stories are no longer available.</p>}
            </div>
          </div>
          <aside className="h-fit border border-[#302d29]/10 bg-[#eee8df]/70 p-5 sm:p-6"><p className="eyebrow">Now, from today</p><h2 className="serif mt-2 text-3xl">A note back</h2><p className="mt-2 text-xs leading-5 text-[#82796e]">What does this message bring back? Leave a reflection for yourself.</p><textarea aria-label="Reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} maxLength={3000} className="auth-input mt-4 min-h-36 resize-y bg-[#fbf9f5] text-sm leading-6" placeholder="Write what you would like to remember about opening this…" />{error && <p role="alert" className="auth-field-error mt-2">{error}</p>}<button type="button" className="auth-primary mt-3 w-full" disabled={saving} onClick={() => void saveReflection()}>{saving ? 'Saving…' : 'Save reflection'}</button><p className="mt-4 border-t border-[#302d29]/10 pt-3 text-[0.62rem] leading-5 text-[#8b8175]">Local-device keepsake · no future delivery or cross-device sync.</p></aside>
        </motion.article></AnimatePresence>
      )}
    </div>
  )
}

function PhotoPicker({
  photos,
  selected,
  onChange,
  heading,
  kind,
}: {
  photos: ReturnType<typeof useMemory>['photos']
  selected: string[]
  onChange: (ids: string[]) => void
  heading: string
  kind: 'capsule' | 'family'
}) {
  return <section><p className="mb-2 text-xs font-semibold">{heading}</p>{photos.length ? <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">{photos.map((photo) => <label key={photo.id} className={`relative cursor-pointer border p-1.5 ${selected.includes(photo.id) ? 'border-[#805449] bg-[#eee8df]' : 'border-transparent bg-white/70'}`}><input aria-label={`Add ${photo.title} to ${kind}`} className="absolute left-2 top-2 z-10 h-4 w-4 accent-[#805449]" type="checkbox" checked={selected.includes(photo.id)} onChange={() => onChange(selected.includes(photo.id) ? selected.filter((id) => id !== photo.id) : [...selected, photo.id])} /><MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-square" /><span className="mt-1 block truncate text-[0.6rem]">{photo.title}</span></label>)}</div> : <p className="text-xs text-[#82796e]">Your photo library is empty.</p>}</section>
}

function EnvelopeArt({ opened = false }: { opened?: boolean }) {
  return <div aria-hidden="true" className={`relative flex h-28 w-40 items-center justify-center border ${opened ? 'border-[#a68c70]/60 bg-[#f8f5ef]/70' : 'border-[#b9a991] bg-[#f8f5ef]/55'} shadow-[0_8px_24px_rgba(48,45,41,0.08)]`}>
    <div className="absolute inset-x-0 top-0 h-1/2 border-b border-[#b9a991]/70" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: opened ? '#e5d7c6' : '#eadfcf' }} />
    <span className="relative mt-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#a68c70]/50 bg-[#eee3d3] text-[#805449]"><LockKeyhole size={16} strokeWidth={1.4} /></span>
  </div>
}

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date)
}

function countdown(unlockDate: string, now: Date) {
  const target = new Date(`${unlockDate}T00:00:00`)
  const remaining = Math.max(0, target.getTime() - now.getTime())
  const days = Math.floor(remaining / 86_400_000)
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000)
  if (!days && !hours) return 'Unlocks later today'
  return `${days ? `${days} ${days === 1 ? 'day' : 'days'}` : ''}${days && hours ? ', ' : ''}${hours ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : ''} remaining`
}

function PageStatus({ children }: { children: React.ReactNode }) {
  return <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">{children}</div>
}

function NotFound() {
  return <div className="mx-auto max-w-xl py-20 text-center"><p className="eyebrow">Capsule unavailable</p><h1 className="serif mt-2 text-4xl">This keepsake is not in your collection.</h1><Link to="/capsules" className="auth-secondary mt-5">Return to Time Capsules</Link></div>
}
