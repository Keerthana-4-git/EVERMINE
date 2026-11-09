import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BookHeart,
  Eye,
  Italic,
  Pencil,
  Plus,
  Search,
  Trash2,
  Type,
} from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { PhotoAttachmentPicker } from '../components/PhotoAttachmentPicker'
import { PhotoViewer } from '../components/PhotoViewer'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import { formatCalendarDate } from '../data/memoryDates'
import { storyCategories, type MemoryStory, type StoryState } from '../data/memoryTypes'

type StorySort = 'newest' | 'oldest' | 'alphabetical'
type StoryFilter = 'all' | StoryState

export function MemoryStoriesPage() {
  const { storyId } = useParams()
  const location = useLocation()
  const { stories, photos, loading, storageError } = useMemory()
  const editing = location.pathname.endsWith('/edit')

  if (location.pathname === '/stories/new') {
    return <StoryEditor />
  }
  if (storyId) {
    const story = stories.find((item) => item.id === storyId)
    if (loading) {
      return <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">Opening your story…</div>
    }
    if (!story) {
      return (
        <div className="mx-auto max-w-2xl py-20 text-center">
          <p className="eyebrow">Story not found</p>
          <h1 className="serif mt-2 text-4xl">This page has turned.</h1>
          <Link to="/stories" className="auth-secondary mt-5">Return to Memory Stories</Link>
        </div>
      )
    }
    return editing ? <StoryEditor key={story.id} story={story} /> : <StoryDetail story={story} />
  }

  return <StoryLibrary stories={stories} photos={photos} loading={loading} storageError={storageError} />
}

function StoryLibrary({
  stories,
  photos,
  loading,
  storageError,
}: {
  stories: MemoryStory[]
  photos: ReturnType<typeof useMemory>['photos']
  loading: boolean
  storageError: string
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [filter, setFilter] = useState<StoryFilter>('all')
  const [sort, setSort] = useState<StorySort>('newest')
  const filteredStories = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return stories
      .filter((story) => {
        if (category && story.category !== category) return false
        if (filter !== 'all' && story.state !== filter) return false
        if (!needle) return true
        return [
          story.title,
          story.body,
          story.location,
          story.category,
          ...story.people,
          ...story.tags,
        ].join(' ').toLocaleLowerCase().includes(needle)
      })
      .sort((a, b) => {
        if (sort === 'alphabetical') return a.title.localeCompare(b.title)
        const order = a.updatedAt.localeCompare(b.updatedAt)
        return sort === 'oldest' ? order : -order
      })
  }, [category, filter, query, sort, stories])

  return (
    <div className="mx-auto max-w-[82rem]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-2">The words around the photographs</p>
            <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Memory Stories</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#82796e]">Keep the voices, details, and meaning that a photograph cannot hold on its own.</p>
          </div>
          <Link to="/stories/new" className="auth-primary"><Plus size={16} /> Write a story</Link>
        </header>

        <section className="mb-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_12rem_10rem_10rem]">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8175]" />
            <input aria-label="Search stories" value={query} onChange={(event) => setQuery(event.target.value)} className="auth-input min-h-10 py-2 pl-9 text-xs" placeholder="Search stories, people, tags…" />
          </label>
          <select aria-label="Filter stories by category" className="auth-input min-h-10 py-2 text-xs" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {storyCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Filter stories by status" className="auth-input min-h-10 py-2 text-xs" value={filter} onChange={(event) => setFilter(event.target.value as StoryFilter)}>
            <option value="all">All stories</option>
            <option value="draft">Drafts</option>
            <option value="private">Private</option>
            <option value="published">Published</option>
          </select>
          <select aria-label="Sort stories" className="auth-input min-h-10 py-2 text-xs" value={sort} onChange={(event) => setSort(event.target.value as StorySort)}>
            <option value="newest">Recently edited</option>
            <option value="oldest">Least recent</option>
            <option value="alphabetical">Title A–Z</option>
          </select>
        </section>

        {storageError && <p className="auth-error mb-6" role="alert">{storageError}</p>}
        {loading ? (
          <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">Gathering your stories…</div>
        ) : filteredStories.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredStories.map((story, index) => {
              const cover = story.photoIds.map((id) => photos.find((photo) => photo.id === id)).find((photo) => photo !== undefined)
              return (
                <Link key={story.id} to={`/stories/${story.id}`} className={`group flex min-h-72 flex-col border border-[#302d29]/10 bg-[#fbf9f5] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(48,45,41,0.08)] ${index % 3 === 1 ? 'md:mt-6' : ''}`}>
                  {cover ? (
                    <MemoryPhotoImage photo={cover} alt={cover.title} className="mb-4 aspect-[1.7]" />
                  ) : (
                    <div className="mb-4 flex aspect-[1.7] items-center justify-center bg-[#eee8df] text-[#8b7861]"><BookHeart size={28} strokeWidth={1.3} /></div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="eyebrow text-[0.55rem]">{story.category}</span>
                      <span className="text-[0.58rem] uppercase tracking-[0.1em] text-[#8b8175]">{story.state}</span>
                    </div>
                    <h2 className="serif mt-2 line-clamp-2 text-3xl leading-tight group-hover:text-[#765b47]">{story.title || 'Untitled story'}</h2>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-[#82796e]">{story.body || 'A story waiting to be written.'}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-4 text-[0.62rem] text-[#8b8175]">
                      {story.date && <span>{formatCalendarDate(story.date)}</span>}
                      {story.location && <span>· {story.location}</span>}
                      <span className="ml-auto">{story.photoIds.length} photos</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : stories.length ? (
          <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5]/70 px-6 py-16 text-center">
            <p className="eyebrow">No stories found</p>
            <h2 className="serif mt-2 text-3xl">Try another search or filter.</h2>
            <button type="button" className="auth-secondary mt-4" onClick={() => { setQuery(''); setCategory(''); setFilter('all') }}>Clear filters</button>
          </div>
        ) : (
          <div className="flex min-h-[25rem] flex-col items-center justify-center border border-dashed border-[#c8b7a2] bg-[#fbf9f5]/70 px-6 text-center">
            <BookHeart size={28} className="text-[#8b7861]" strokeWidth={1.3} />
            <p className="eyebrow mt-5">Leave room for the story</p>
            <h2 className="serif mt-2 max-w-xl text-3xl">The little details are worth keeping.</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#82796e]">Begin with a title, a photograph, or one thing you never want to forget.</p>
            <Link to="/stories/new" className="auth-primary mt-5"><Plus size={15} /> Write your first story</Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function StoryEditor({ story }: { story?: MemoryStory }) {
  const { createStory, updateStory } = useMemory()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [title, setTitle] = useState(story?.title ?? '')
  const [body, setBody] = useState(story?.body ?? '')
  const [date, setDate] = useState(story?.date ?? '')
  const [location, setLocation] = useState(story?.location ?? '')
  const [people, setPeople] = useState(story?.people.join(', ') ?? '')
  const [category, setCategory] = useState(story?.category ?? storyCategories[0])
  const [tags, setTags] = useState(story?.tags.join(', ') ?? '')
  const [photoIds, setPhotoIds] = useState(story?.photoIds ?? [])
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState(story?.updatedAt ?? '')

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0

  async function save(state: StoryState) {
    if (!title.trim()) {
      setError('Give your story a title before saving.')
      return
    }
    if (state !== 'draft' && !body.trim()) {
      setError('Add a few words to your story before making it private or publishing it.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const details = {
        title: title.trim(),
        body,
        date,
        location: location.trim(),
        people: splitList(people),
        category,
        tags: splitList(tags),
        photoIds,
        state,
      }
      if (story) {
        await updateStory(story.id, details)
        setSavedAt(new Date().toISOString())
        showToast('Story changes saved.')
      } else {
        const id = await createStory(details)
        showToast(state === 'draft' ? 'Draft saved.' : 'Your story is saved.')
        navigate(`/stories/${id}`, { replace: true })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The story could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  function formatSelection(mark: '**' | '*') {
    const textarea = document.getElementById('story-body') as HTMLTextAreaElement | null
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = body.slice(start, end)
    const insertion = selected ? `${mark}${selected}${mark}` : `${mark}${mark}`
    const next = `${body.slice(0, start)}${insertion}${body.slice(end)}`
    setBody(next)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = selected ? start + insertion.length : start + mark.length
      textarea.setSelectionRange(cursor, selected ? cursor : cursor)
    })
  }

  return (
    <div className="mx-auto max-w-[68rem]">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link to={story ? `/stories/${story.id}` : '/stories'} className="inline-flex items-center gap-2 text-xs text-[#8b7861] hover:text-[#302d29]"><ArrowLeft size={15} /> Back to stories</Link>
        <button type="button" className="auth-secondary min-h-9" onClick={() => setPreview((value) => !value)}><Eye size={14} /> {preview ? 'Continue writing' : 'Preview'}</button>
      </header>
      <div className="border border-[#302d29]/10 bg-[#fbf9f5]">
        <div className="border-b border-[#302d29]/10 bg-[#eee8df]/55 px-5 py-5 sm:px-9 sm:py-7">
          <p className="eyebrow mb-2">{story ? 'A story in progress' : 'A page of your own'}</p>
          {preview ? (
            <h1 className="serif text-4xl leading-tight sm:text-5xl">{title || 'Your story title'}</h1>
          ) : (
            <input aria-label="Story title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} className="w-full border-0 bg-transparent p-0 serif text-4xl leading-tight outline-none placeholder:text-[#b6aa9c] focus:ring-0 sm:text-5xl" placeholder="Give this story a name…" />
          )}
        </div>
        <div className="grid gap-8 px-5 py-6 sm:px-9 sm:py-8 lg:grid-cols-[1fr_15rem]">
          <div className="min-w-0">
            {preview ? (
              <article className="min-h-72">
                <StoryBody text={body || 'Your words will find their place here.'} />
              </article>
            ) : (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#302d29]/10 pb-2">
                  <div className="flex gap-1">
                    <button type="button" aria-label="Format selection bold" title="Wrap selection in bold" className="rounded p-2 text-[#71685d] hover:bg-[#eee8df]" onClick={() => formatSelection('**')}><Type size={16} /></button>
                    <button type="button" aria-label="Format selection italic" title="Wrap selection in italics" className="rounded p-2 text-[#71685d] hover:bg-[#eee8df]" onClick={() => formatSelection('*')}><Italic size={15} /></button>
                  </div>
                  <span className="text-[0.63rem] text-[#8b8175]">{wordCount} words</span>
                </div>
                <textarea id="story-body" aria-label="Story" value={body} onChange={(event) => setBody(event.target.value)} maxLength={20000} className="min-h-[22rem] w-full resize-y border-0 bg-transparent p-0 text-[0.92rem] leading-8 text-[#514a40] outline-none placeholder:text-[#aaa197] focus:ring-0" placeholder="Begin anywhere. A voice, a place, the way the light fell that afternoon…" />
              </div>
            )}
            <div className="mt-6 border-t border-[#302d29]/10 pt-5">
              <PhotoAttachmentPicker photoIds={photoIds} onChange={setPhotoIds} />
            </div>
          </div>
          <aside className="space-y-4 border-t border-[#302d29]/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="eyebrow">The details around it</p>
            <Field label="Date"><input aria-label="Story date" type="date" className="auth-input min-h-10 py-2 text-xs" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
            <Field label="Place"><input aria-label="Story location" className="auth-input min-h-10 py-2 text-xs" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} placeholder="Where it happened" /></Field>
            <Field label="People"><input aria-label="People in story" className="auth-input min-h-10 py-2 text-xs" value={people} onChange={(event) => setPeople(event.target.value)} maxLength={400} placeholder="Names, separated by commas" /></Field>
            <Field label="Category"><select aria-label="Story category" className="auth-input min-h-10 py-2 text-xs" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>{storyCategories.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Tags"><input aria-label="Story tags" className="auth-input min-h-10 py-2 text-xs" value={tags} onChange={(event) => setTags(event.target.value)} maxLength={400} placeholder="Add tags, comma separated" /></Field>
            {savedAt && <p className="text-[0.62rem] text-[#8b8175]">Last saved {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(savedAt))}</p>}
          </aside>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#302d29]/10 bg-[#f7f3ed] px-5 py-4 sm:px-9">
          <span className="text-[0.65rem] text-[#8b8175]">{wordCount} words · Stored privately on this device</span>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="auth-secondary min-h-9" disabled={busy} onClick={() => void save('draft')}>{busy ? 'Saving…' : 'Save draft'}</button>
            <button type="button" className="auth-secondary min-h-9" disabled={busy} onClick={() => void save('private')}>Keep private</button>
            <button type="button" className="auth-primary min-h-9" disabled={busy} onClick={() => void save('published')}>Publish story</button>
          </div>
        </footer>
        {error && <p className="auth-error m-5 sm:mx-9" role="alert">{error}</p>}
      </div>
    </div>
  )
}

function StoryDetail({ story }: { story: MemoryStory }) {
  const { photos, deleteStory } = useMemory()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const attachedPhotos = story.photoIds.map((id) => photos.find((photo) => photo.id === id))
  const missingCount = attachedPhotos.filter((photo) => photo === undefined).length
  const viewerPhoto = viewerId ? photos.find((photo) => photo.id === viewerId) : undefined

  async function remove() {
    setBusy(true)
    try {
      await deleteStory(story.id)
      showToast('Story deleted.')
      navigate('/stories', { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The story could not be deleted.', 'error')
    } finally {
      setBusy(false)
      setConfirm(false)
    }
  }

  return (
    <article className="mx-auto max-w-[68rem]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/stories" className="inline-flex items-center gap-2 text-xs text-[#8b7861] hover:text-[#302d29]"><ArrowLeft size={15} /> All stories</Link>
        <div className="flex gap-2">
          <Link to={`/stories/${story.id}/edit`} className="auth-secondary min-h-9"><Pencil size={14} /> Edit story</Link>
          <button type="button" className="auth-secondary min-h-9 text-[#805449]" onClick={() => setConfirm(true)}><Trash2 size={14} /> Delete</button>
        </div>
      </div>
      <div className="border border-[#302d29]/10 bg-[#fbf9f5]">
        <header className="bg-[#eee8df]/70 px-6 py-9 sm:px-12 sm:py-14">
          <div className="flex flex-wrap gap-3 text-[0.62rem] uppercase tracking-[0.13em] text-[#8b7861]"><span>{story.category}</span><span>· {story.state}</span>{story.date && <span>· {formatCalendarDate(story.date)}</span>}</div>
          <h1 className="serif mt-4 max-w-4xl text-4xl leading-tight sm:text-6xl">{story.title}</h1>
          {(story.location || story.people.length > 0) && <p className="mt-4 text-xs text-[#82796e]">{[story.location, story.people.length ? `With ${story.people.join(', ')}` : ''].filter(Boolean).join(' · ')}</p>}
        </header>
        <div className="mx-auto max-w-3xl px-6 py-9 sm:px-12 sm:py-12">
          <StoryBody text={story.body} />
          {story.tags.length > 0 && <div className="mt-9 flex flex-wrap gap-2">{story.tags.map((tag) => <span key={tag} className="bg-[#eee8df] px-2.5 py-1 text-[0.65rem] text-[#71685d]">#{tag}</span>)}</div>}
          {story.photoIds.length > 0 && (
            <section className="mt-10 border-t border-[#302d29]/10 pt-6">
              <p className="eyebrow mb-4">Photographs that belong to this story</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {attachedPhotos.map((photo, index) => photo ? (
                  <button key={photo.id} type="button" onClick={() => setViewerId(photo.id)} className="text-left">
                    <MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-[1.15]" />
                    <span className="mt-1 block truncate text-xs text-[#71685d]">{photo.title}</span>
                  </button>
                ) : <div key={story.photoIds[index]} className="flex aspect-[1.15] items-center justify-center bg-[#eee8df] px-3 text-center text-xs text-[#8b8175]">Attached photo is no longer available.</div>)}
              </div>
              {missingCount > 0 && <p className="sr-only">{missingCount} missing photo attachments</p>}
            </section>
          )}
        </div>
      </div>
      {confirm && <ConfirmDialog title="Delete this story?" description="This removes the story, but all attached original photographs remain in My Memories." confirmLabel="Delete story" busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void remove()} />}
      {viewerPhoto && <PhotoViewer photos={photos} photoId={viewerPhoto.id} onClose={() => setViewerId(null)} />}
    </article>
  )
}

function StoryBody({ text }: { text: string }) {
  return (
    <div className="space-y-5 text-[0.96rem] leading-8 text-[#514a40]">
      {text.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 12)}`} className="whitespace-pre-wrap">{renderInline(paragraph)}</p>
      ))}
    </div>
  )
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-semibold text-[#302d29]">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    return part
  })
}

function splitList(value: string) {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="block text-[0.66rem] font-semibold text-[#71685d]">{label}</span>{children}</label>
}
