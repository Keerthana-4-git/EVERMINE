import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, ImagePlus, RefreshCw, Sparkles, Tags, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { PhotoViewer } from '../components/PhotoViewer'
import { useToast } from '../components/useToast'
import { useAuth } from '../auth/useAuth'
import { useMemory } from '../data/useMemory'
import { generateLocalCuratorSuggestions } from '../data/memoryCurator'
import type { CuratorSuggestion, MemoryPhoto } from '../data/memoryTypes'

type SuggestionFilter = 'all' | 'collection' | 'details' | 'reviewed'

export function MemoryCuratorPage() {
  const { user } = useAuth()
  const { photos, albums, curatorSuggestions, loading, updatePhoto, createAlbum, saveCuratorSuggestion } = useMemory()
  const { showToast } = useToast()
  const [filter, setFilter] = useState<SuggestionFilter>('all')
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ photos: MemoryPhoto[]; id: string } | null>(null)

  const generated = useMemo(
    () => generateLocalCuratorSuggestions(photos, albums, user?.email ?? ''),
    [albums, photos, user?.email],
  )
  const suggestions = useMemo(() => {
    const generatedIds = new Set(generated.map((item) => item.id))
    return [
      ...generated.map((item) => curatorSuggestions.find((saved) => saved.id === item.id) ?? item),
      ...curatorSuggestions.filter((saved) =>
        saved.status !== 'suggested' &&
        !generatedIds.has(saved.id) &&
        saved.photoIds.some((id) => photos.some((photo) => photo.id === id)),
      ),
    ]
  }, [curatorSuggestions, generated, photos])

  useEffect(() => {
    if (loading) return
    for (const suggestion of generated) {
      if (!curatorSuggestions.some((saved) => saved.id === suggestion.id)) {
        void saveCuratorSuggestion(suggestion).catch((error: unknown) => {
          showToast(error instanceof Error ? error.message : 'A local suggestion could not be saved.', 'error')
        })
      }
    }
  }, [curatorSuggestions, generated, loading, saveCuratorSuggestion, showToast])

  const active = suggestions.filter((item) => item.status === 'suggested')
  const reviewed = suggestions.filter((item) => item.status !== 'suggested')
  const visible = filter === 'reviewed'
    ? reviewed
    : active.filter((item) => filter === 'all' ||
      (filter === 'collection' && (item.kind === 'collection' || item.kind === 'similar')) ||
      (filter === 'details' && ['caption', 'tags', 'category', 'duplicate'].includes(item.kind)))
  const featured = active[0]

  async function review(suggestion: CuratorSuggestion, status: 'accepted' | 'dismissed') {
    setBusyId(suggestion.id)
    try {
      if (status === 'accepted') {
        if (suggestion.kind === 'collection' || suggestion.kind === 'similar') {
          const photosInSuggestion = suggestion.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is MemoryPhoto => photo !== undefined)
          await createAlbum({
            name: suggestion.collectionName ?? suggestion.title,
            description: `A collection suggested locally from shared memory details. ${suggestion.description}`,
            category: photosInSuggestion.find((photo) => photo.category)?.category || 'Everyday Moments',
            photoIds: photosInSuggestion.map((photo) => photo.id),
            coverPhotoId: photosInSuggestion[0]?.id ?? null,
          })
        } else if (suggestion.kind !== 'duplicate') {
          for (const photoId of suggestion.photoIds) {
            const photo = photos.find((item) => item.id === photoId)
            if (!photo) continue
            await updatePhoto(photo.id, {
              title: photo.title,
              caption: suggestion.suggestedCaption ?? photo.caption,
              date: photo.date,
              location: photo.location,
              tags: suggestion.suggestedTags.length ? [...new Set([...photo.tags, ...suggestion.suggestedTags])] : photo.tags,
              category: suggestion.suggestedCategory ?? photo.category,
            })
          }
        }
      }
      await saveCuratorSuggestion({ ...suggestion, status })
      showToast(status === 'dismissed'
        ? 'Suggestion dismissed on this device.'
        : suggestion.kind === 'duplicate'
          ? 'Possible copies marked as reviewed. No photographs were removed.'
          : 'Suggestion applied to your local memories.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The suggestion could not be applied.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  function refresh() {
    setLastChecked(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
    showToast(`Reviewed ${photos.length} saved photograph${photos.length === 1 ? '' : 's'} using local metadata only.`)
  }

  function openRelated(suggestion: CuratorSuggestion) {
    const related = suggestion.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is MemoryPhoto => photo !== undefined)
    if (!related.length) {
      showToast('Those photographs are no longer in My Memories.', 'error')
      return
    }
    setViewer({ photos: related, id: related[0].id })
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="relative mb-8 overflow-hidden bg-[#eae2d6] px-6 py-8 sm:px-10 sm:py-11">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-[#a68c70]/30" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl"><p className="eyebrow mb-2">A thoughtful second look</p><h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Memory Curator</h1><p className="mt-4 text-sm leading-6 text-[#71685d]">A quiet helper for finding connections in the details you have already saved. Suggestions are generated on this device from titles, captions, dates, places, tags and album membership. This is not a real AI model; your photographs are never sent to an AI service.</p></div>
          <div className="flex flex-col items-start gap-2"><button type="button" className="auth-secondary min-h-10" onClick={refresh}><RefreshCw size={14} /> Recheck memories</button>{lastChecked && <span className="text-[0.58rem] text-[#8b8175]">Last checked at {lastChecked}</span>}</div>
        </div>
      </header>

      <section className="mb-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-y border-[#302d29]/12 py-5"><p className="eyebrow mb-2">Your personal assistant</p><h2 className="serif max-w-lg text-3xl leading-tight">The meaning is already in your memories.</h2><p className="mt-3 max-w-xl text-xs leading-6 text-[#82796e]">These local, deterministic suggestions can help surface a collection, fill in helpful details, or spot photographs that may be copies. Review each one before anything changes.</p><div className="mt-5 flex flex-wrap gap-2"><Link to="/memories" className="auth-secondary min-h-9">Visit My Memories <ArrowRight size={13} /></Link><Link to="/albums" className="auth-secondary min-h-9">Browse albums <ArrowRight size={13} /></Link></div></div>
        <div className="relative min-h-48 overflow-hidden bg-[#d8cdbc] p-5 sm:p-7">{featured ? <><div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-45">{featured.photoIds.slice(0, 3).map((id) => { const photo = photos.find((item) => item.id === id); return <div key={id} className="min-w-0">{photo && <MemoryPhotoImage photo={photo} alt="" className="h-full w-full" />}</div> })}</div><div className="absolute inset-0 bg-gradient-to-r from-[#f7f3ed]/95 via-[#f7f3ed]/80 to-[#f7f3ed]/40" /></> : <div className="absolute inset-0 bg-[#e6ded2]" />}<div className="relative max-w-sm"><p className="eyebrow mb-2 flex items-center gap-1"><Sparkles size={12} /> A first thought</p><h2 className="serif text-2xl">{featured?.title ?? 'Your next discovery starts here.'}</h2><p className="mt-2 text-xs leading-5 text-[#71685d]">{featured?.description ?? (photos.length ? 'Recheck your library to look for photo details that could use a little care.' : 'Add a few photographs to My Memories and the curator can look for useful patterns.')}</p></div></div>
      </section>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[#302d29]/12 pb-3"><div><p className="eyebrow mb-1">Consider, then decide</p><h2 className="serif text-3xl">Suggestions for you</h2></div><div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter curator suggestions">{([{ id: 'all', label: `All · ${active.length}` }, { id: 'collection', label: 'Collections' }, { id: 'details', label: 'Photo details' }, { id: 'reviewed', label: 'Reviewed' }] as const).map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)} className={`px-3 py-2 text-[0.63rem] ${filter === item.id ? 'bg-[#302d29] text-white' : 'text-[#71685d] hover:bg-[#eee8df]'}`}>{item.label}</button>)}</div></div>

      {loading ? <div role="status" className="flex min-h-48 items-center justify-center text-sm text-[#8b8175]">Reading your saved details…</div> : visible.length ? (
        <div className="space-y-5">
          {visible.map((suggestion, index) => <SuggestionCard key={suggestion.id} suggestion={suggestion} photos={photos} index={index} busy={busyId === suggestion.id} onReview={(status) => void review(suggestion, status)} onView={() => openRelated(suggestion)} />)}
        </div>
      ) : (
        <div className="grid border border-dashed border-[#c8b7a2] bg-[#fbf9f5] md:grid-cols-[1fr_0.72fr]"><div className="flex min-h-56 flex-col justify-center px-6 py-8 sm:px-10"><p className="eyebrow mb-2">{filter === 'reviewed' ? 'Nothing set aside yet' : photos.length ? 'No suggestions in this view' : 'A quiet beginning'}</p><h2 className="serif text-3xl">{filter === 'reviewed' ? 'Your choices will be gathered here.' : photos.length ? 'Your memory details are looking lovely.' : 'Add a few memories to begin.'}</h2><p className="mt-2 max-w-lg text-xs leading-5 text-[#82796e]">{filter === 'reviewed' ? 'Accepted and dismissed suggestions remain on this device.' : photos.length ? 'Try another suggestion filter or recheck your library after adding details.' : 'The local curator uses saved photo details only. It never uploads your images.'}</p><div className="mt-4 flex gap-2"><Link to="/memories" className="auth-secondary min-h-9">Open My Memories</Link><button type="button" onClick={refresh} className="auth-secondary min-h-9"><RefreshCw size={13} /> Recheck</button></div></div><div className="flex items-center justify-center bg-[#eee8df] text-[#8b7861]"><Sparkles size={42} strokeWidth={1} /></div></div>
      )}
      {viewer && <PhotoViewer photos={viewer.photos} photoId={viewer.id} onClose={() => setViewer(null)} />}
    </div>
  )
}

function SuggestionCard({ suggestion, photos, index, busy, onReview, onView }: {
  suggestion: CuratorSuggestion
  photos: MemoryPhoto[]
  index: number
  busy: boolean
  onReview: (status: 'accepted' | 'dismissed') => void
  onView: () => void
}) {
  const related = suggestion.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is MemoryPhoto => photo !== undefined)
  const reviewed = suggestion.status !== 'suggested'
  return (
    <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.15) }} className={`grid gap-4 border border-[#302d29]/10 bg-[#fbf9f5] p-4 sm:grid-cols-[minmax(10rem,0.44fr)_1fr] sm:p-5 ${index % 2 ? 'sm:ml-8' : ''}`}>
      <div className="grid aspect-[1.7] grid-cols-3 gap-1 overflow-hidden bg-[#eae2d6] sm:aspect-auto sm:min-h-40">{related.slice(0, 3).map((photo) => <MemoryPhotoImage key={photo.id} photo={photo} alt={photo.title} className="h-full min-h-28 w-full" />)}{related.length === 0 && <div className="col-span-3 flex items-center justify-center text-[#8b7861]"><ImagePlus size={24} /></div>}</div>
      <div className="flex min-w-0 flex-col justify-center"><div className="flex flex-wrap items-center gap-2"><span className="eyebrow text-[0.54rem]">{kindLabel(suggestion.kind)}</span>{reviewed && <span className="inline-flex items-center gap-1 text-[0.58rem] text-[#8b7861]"><Check size={11} />{suggestion.status}</span>}</div><h3 className="serif mt-1 text-2xl">{suggestion.title}</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-[#71685d]">{suggestion.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{suggestion.suggestedCategory && <span className="bg-[#eee8df] px-2 py-1 text-[0.58rem]">Category · {suggestion.suggestedCategory}</span>}{suggestion.suggestedTags.map((tag) => <span key={tag} className="bg-[#eee8df] px-2 py-1 text-[0.58rem]"><Tags size={10} className="mr-1 inline" />{tag}</span>)}{suggestion.suggestedCaption && <span className="max-w-full truncate bg-[#eee8df] px-2 py-1 text-[0.58rem]">Caption · {suggestion.suggestedCaption}</span>}{suggestion.collectionName && <span className="bg-[#eee8df] px-2 py-1 text-[0.58rem]">Collection · {suggestion.collectionName}</span>}</div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#302d29]/10 pt-3"><button type="button" onClick={onView} disabled={!related.length} className="auth-secondary min-h-8 px-3 text-[0.62rem]">View related photographs <ArrowRight size={12} /></button>{!reviewed && <><button type="button" onClick={() => onReview('accepted')} disabled={busy || !related.length} className="auth-primary min-h-8 px-3 text-[0.62rem]">{busy ? 'Saving…' : suggestion.kind === 'duplicate' ? 'Mark reviewed' : 'Accept suggestion'}</button><button type="button" onClick={() => onReview('dismissed')} disabled={busy} aria-label={`Dismiss ${suggestion.title}`} className="inline-flex min-h-8 items-center gap-1 px-2 text-[0.62rem] text-[#8b8175] hover:bg-[#eee8df]"><X size={12} /> Dismiss</button></>}</div>
      </div>
    </motion.article>
  )
}

function kindLabel(kind: CuratorSuggestion['kind']) {
  return ({
    collection: 'A possible collection',
    similar: 'Similar memories',
    caption: 'Caption idea',
    tags: 'Tag idea',
    category: 'Category idea',
    duplicate: 'Possible duplicates',
  })[kind]
}
