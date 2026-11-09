import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookHeart, Check, Feather, Heart, Lightbulb, Pencil, Search, Shuffle, Trash2 } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ConfirmDialog, MemoryDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { PhotoAttachmentPicker } from '../components/PhotoAttachmentPicker'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import { toCalendarDate } from '../data/memoryDates'
import { getDailyPrompt, memoryPrompts, categoryForStory, type MemoryPrompt } from '../data/memoryPrompts'
import { promptCategories, type MemoryPromptResponse, type MemoryStory, type PromptCategory, type PromptResponseState, type StoryDetails } from '../data/memoryTypes'

export function MemoryPromptsPage() {
  const [searchParams] = useSearchParams()
  const initialPromptId = searchParams.get('prompt')
  const initialPrompt = initialPromptId
    ? memoryPrompts.find((prompt) => prompt.id === initialPromptId)
    : undefined
  const [category, setCategory] = useState<PromptCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const [activePrompt, setActivePrompt] = useState<MemoryPrompt | null>(initialPrompt ?? null)
  const [activeResponse, setActiveResponse] = useState<MemoryPromptResponse | undefined>()
  const [deletingResponse, setDeletingResponse] = useState<MemoryPromptResponse | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [convertingResponseId, setConvertingResponseId] = useState<string | null>(null)
  const { promptResponses, photos, stories, loading, storageError, deletePromptResponse, createStory, updatePromptResponse } = useMemory()
  const navigate = useNavigate()
  const [today] = useState(() => new Date())
  const [featuredPrompt, setFeaturedPrompt] = useState(() => initialPrompt ?? getDailyPrompt(today))
  const filteredPrompts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return memoryPrompts.filter((prompt) =>
      (category === 'all' || prompt.category === category) &&
      (!needle || `${prompt.text} ${prompt.category}`.toLocaleLowerCase().includes(needle)),
    )
  }, [category, query])
  const filteredResponses = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return promptResponses.filter((response) =>
      !needle || `${response.prompt} ${response.response} ${response.category}`.toLocaleLowerCase().includes(needle),
    )
  }, [promptResponses, query])
  const { showToast } = useToast()

  function startPrompt(prompt: MemoryPrompt) {
    setActiveResponse(undefined)
    setActivePrompt(prompt)
  }

  function showAnotherPrompt() {
    const candidates = memoryPrompts.filter((prompt) => prompt.id !== featuredPrompt.id)
    const next = candidates[Math.floor(Math.random() * candidates.length)]
    if (next) setFeaturedPrompt(next)
  }

  async function confirmDelete() {
    if (!deletingResponse) return
    setDeleteBusy(true)
    try {
      await deletePromptResponse(deletingResponse.id)
      showToast('Prompt response deleted.')
      setDeletingResponse(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The response could not be deleted.', 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  async function convertSavedResponse(response: MemoryPromptResponse) {
    setConvertingResponseId(response.id)
    try {
      await convertResponse(response, stories, createStory, updatePromptResponse, showToast, navigate)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The story could not be created.', 'error')
    } finally {
      setConvertingResponseId(null)
    }
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-2">A small question can open a whole world</p>
            <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Memory Prompts</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#82796e]">Gentle starting points for the memories you mean to write down.</p>
          </div>
          <Link to="/stories/new" className="auth-secondary"><BookHeart size={15} /> Write a freeform story</Link>
        </header>

        {storageError && <p className="auth-error mb-6" role="alert">{storageError}</p>}

        <section className="relative mb-10 overflow-hidden bg-[#eae2d6] px-6 py-7 sm:px-10 sm:py-9">
          <span className="absolute -right-4 -top-8 serif text-[12rem] leading-none text-[#c8b7a2]/35" aria-hidden="true">“</span>
          <div className="relative max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow flex items-center gap-2"><Lightbulb size={14} /> {featuredPrompt.id === getDailyPrompt(today).id ? 'Today’s prompt' : 'A prompt for you'} · {featuredPrompt.category}</p>
              <button type="button" className="inline-flex items-center gap-1 text-[0.65rem] text-[#8b7861] hover:text-[#302d29]" onClick={showAnotherPrompt}><Shuffle size={13} /> Another prompt</button>
            </div>
            <h2 className="serif text-3xl leading-tight sm:text-4xl">{featuredPrompt.text}</h2>
            <button type="button" className="auth-primary mt-5 min-h-10" onClick={() => startPrompt(featuredPrompt)}><Feather size={15} /> Write about this</button>
          </div>
        </section>

        <section className="mb-12">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">Choose a thread to follow</p>
              <h2 className="serif text-3xl">Browse prompts</h2>
            </div>
            <label className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8175]" />
              <input aria-label="Search memory prompts and responses" className="auth-input min-h-10 py-2 pl-9 text-xs" placeholder="Search prompts and responses…" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </header>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            <CategoryPill active={category === 'all'} onClick={() => setCategory('all')}>All prompts</CategoryPill>
            {promptCategories.map((item) => <CategoryPill key={item} active={category === item} onClick={() => setCategory(item)}>{item}</CategoryPill>)}
          </div>
          {filteredPrompts.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPrompts.map((prompt, index) => (
                <button key={prompt.id} type="button" onClick={() => startPrompt(prompt)} className={`group flex min-h-40 flex-col border border-[#302d29]/10 bg-[#fbf9f5] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#c8b7a2] hover:bg-white ${index % 3 === 1 ? 'xl:mt-4' : ''}`}>
                  <span className="eyebrow text-[0.55rem]">{prompt.category}</span>
                  <span className="serif mt-3 text-2xl leading-snug">{prompt.text}</span>
                  <span className="mt-auto flex items-center gap-1 pt-4 text-[0.64rem] text-[#8b7861]">Write a response <ArrowRight size={13} className="transition group-hover:translate-x-1" /></span>
                </button>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#c8b7a2] p-10 text-center text-sm text-[#82796e]">No prompts match this search. Try another word or category.</div>
          )}
        </section>

        <section className="border-t border-[#302d29]/12 pt-8">
          <header className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">Your words, kept safe</p>
              <h2 className="serif text-3xl">Saved reflections</h2>
            </div>
            <span className="text-[0.68rem] text-[#8b8175]">{promptResponses.length} saved</span>
          </header>
          {loading ? (
            <div role="status" className="py-12 text-center text-sm text-[#8b8175]">Opening your reflections…</div>
          ) : filteredResponses.length ? (
            <div className="divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
              {filteredResponses.map((response) => {
                const linkedStory = response.storyId ? stories.find((story) => story.id === response.storyId) : undefined
                const attached = response.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo) => photo !== undefined)
                return (
                  <article key={response.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <button type="button" className="min-w-0 text-left" onClick={() => { setActivePrompt({ id: response.promptId, category: response.category, text: response.prompt }); setActiveResponse(response) }}>
                      <span className="eyebrow text-[0.55rem]">{response.category} · {response.state}</span>
                      <h3 className="serif mt-1 text-2xl">{response.prompt}</h3>
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-[#82796e]">{response.response || 'A draft waiting for a few words.'}</p>
                      {attached.length > 0 && <span className="mt-2 flex items-center gap-1.5">{attached.slice(0, 4).map((photo) => <MemoryPhotoImage key={photo.id} photo={photo} alt="" className="h-8 w-10" />)}<span className="text-[0.6rem] text-[#8b8175]">{attached.length} attached</span></span>}
                    </button>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {linkedStory ? <Link to={`/stories/${linkedStory.id}`} className="auth-secondary min-h-9">Open story <ArrowRight size={13} /></Link> : response.state === 'completed' && <button type="button" className="auth-secondary min-h-9" disabled={convertingResponseId === response.id} onClick={() => void convertSavedResponse(response)}>{convertingResponseId === response.id ? 'Creating…' : 'Turn into story'} <BookHeart size={13} /></button>}
                      <button type="button" aria-label="Edit response" className="auth-secondary min-h-9 px-3" onClick={() => { setActivePrompt({ id: response.promptId, category: response.category, text: response.prompt }); setActiveResponse(response) }}><Pencil size={14} /></button>
                      <button type="button" aria-label="Delete response" className="auth-secondary min-h-9 px-3 text-[#805449]" onClick={() => setDeletingResponse(response)}><Trash2 size={14} /></button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="bg-[#eee8df]/70 px-6 py-10 text-center">
              <Heart size={21} className="mx-auto text-[#8b7861]" strokeWidth={1.4} />
              <h3 className="serif mt-3 text-2xl">{promptResponses.length ? 'No saved reflections match.' : 'Your reflections begin with a single sentence.'}</h3>
              <p className="mt-1 text-xs text-[#82796e]">Choose a prompt above and write as much or as little as you like.</p>
            </div>
          )}
        </section>
      </motion.div>

      {activePrompt && <PromptResponseEditor key={activeResponse?.id ?? activePrompt.id} prompt={activePrompt} response={activeResponse} onClose={() => { setActivePrompt(null); setActiveResponse(undefined) }} />}
      {deletingResponse && <ConfirmDialog title="Delete this reflection?" description="This removes the saved response. Any attached photographs and converted story remain in your library." confirmLabel="Delete response" busy={deleteBusy} onCancel={() => setDeletingResponse(null)} onConfirm={() => void confirmDelete()} />}
    </div>
  )
}

function PromptResponseEditor({
  prompt,
  response,
  onClose,
}: {
  prompt: MemoryPrompt
  response?: MemoryPromptResponse
  onClose: () => void
}) {
  const { photos, createPromptResponse, updatePromptResponse, stories, createStory } = useMemory()
  const [body, setBody] = useState(response?.response ?? '')
  const [photoIds, setPhotoIds] = useState(response?.photoIds ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState(response?.id)
  const [state, setState] = useState<PromptResponseState>(response?.state ?? 'draft')
  const { showToast } = useToast()
  const navigate = useNavigate()
  const linkedStory = response?.storyId ? stories.find((story) => story.id === response.storyId) : undefined
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0

  async function save(nextState: PromptResponseState) {
    if (nextState === 'completed' && !body.trim()) {
      setError('Write a few words before completing your reflection.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const details = {
        promptId: prompt.id,
        prompt: prompt.text,
        category: prompt.category,
        response: body,
        photoIds,
        state: nextState,
        storyId: response?.storyId ?? null,
      }
      const id = savedId
        ? (await updatePromptResponse(savedId, details), savedId)
        : await createPromptResponse(details)
      setSavedId(id)
      setState(nextState)
      showToast(nextState === 'completed' ? 'Reflection completed and saved.' : 'Draft saved on this device.')
      if (nextState === 'completed') onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The response could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  async function convert() {
    if (!savedId || state !== 'completed') return
    setBusy(true)
    setError('')
    try {
      const storyId = await convertResponse(
        {
          id: savedId,
          promptId: prompt.id,
          prompt: prompt.text,
          category: prompt.category,
          response: body,
          photoIds,
          state,
          storyId: response?.storyId ?? null,
          ownerEmail: '',
          createdAt: response?.createdAt ?? '',
          updatedAt: response?.updatedAt ?? '',
        },
        stories,
        createStory,
        updatePromptResponse,
        showToast,
        navigate,
      )
      if (storyId) onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The story could not be created.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MemoryDialog title={response ? 'Return to this reflection' : 'Give this memory a page'} eyebrow={prompt.category} onClose={onClose} wide>
      <div className="mb-5 border-l-2 border-[#a68c70] bg-[#eee8df]/70 px-4 py-3">
        <p className="serif text-2xl leading-snug">{prompt.text}</p>
      </div>
      <label htmlFor="prompt-response" className="mb-2 flex items-center justify-between text-xs font-semibold">
        <span>Your reflection</span><span className="font-normal text-[#8b8175]">{wordCount} words</span>
      </label>
      <textarea id="prompt-response" autoFocus value={body} onChange={(event) => setBody(event.target.value)} maxLength={12000} className="auth-input min-h-56 resize-y text-sm leading-7" placeholder="Take your time. Start with one detail you can still see clearly…" />
      <div className="mt-5">
        <PhotoAttachmentPicker photoIds={photoIds} onChange={setPhotoIds} />
        {response && response.photoIds.some((id) => !photos.some((photo) => photo.id === id)) && <p className="mt-2 text-[0.65rem] text-[#8f493e]">Some previously attached photographs are no longer available.</p>}
      </div>
      {linkedStory && <Link to={`/stories/${linkedStory.id}`} className="mt-4 inline-flex items-center gap-1 text-xs text-[#8b7861]">A story has been made from this reflection <ArrowRight size={13} /></Link>}
      {error && <p role="alert" className="auth-error mt-4">{error}</p>}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#302d29]/10 pt-4">
        <button type="button" className="text-[0.68rem] text-[#8b7861] hover:text-[#302d29]" onClick={onClose}>Close without saving</button>
        <div className="flex flex-wrap gap-2">
          {state === 'completed' && !linkedStory && <button type="button" className="auth-secondary min-h-9" disabled={busy} onClick={() => void convert()}>Turn into story <BookHeart size={14} /></button>}
          <button type="button" className="auth-secondary min-h-9" disabled={busy} onClick={() => void save('draft')}>{busy ? 'Saving…' : 'Save draft'}</button>
          <button type="button" className="auth-primary min-h-9" disabled={busy} onClick={() => void save('completed')}><Check size={14} /> Complete reflection</button>
        </div>
      </footer>
    </MemoryDialog>
  )
}

async function convertResponse(
  response: MemoryPromptResponse,
  stories: MemoryStory[],
  createStory: (details: StoryDetails) => Promise<string>,
  updatePromptResponse: (id: string, details: {
    promptId: string
    prompt: string
    category: PromptCategory
    response: string
    photoIds: string[]
    state: PromptResponseState
    storyId: string | null
  }) => Promise<void>,
  showToast: (message: string, type?: 'success' | 'error') => void,
  navigate: (path: string) => void,
) {
  if (response.storyId && stories.some((story) => story.id === response.storyId)) {
    navigate(`/stories/${response.storyId}`)
    return response.storyId
  }
  const storyId = await createStory({
    title: response.prompt,
    body: response.response,
    date: toCalendarDate(new Date()),
    location: '',
    people: [],
    category: categoryForStory(response.category),
    tags: [],
    photoIds: response.photoIds,
    state: 'draft',
  })
  await updatePromptResponse(response.id, {
    promptId: response.promptId,
    prompt: response.prompt,
    category: response.category,
    response: response.response,
    photoIds: response.photoIds,
    state: response.state,
    storyId,
  })
  showToast('A draft story was created from your reflection.')
  navigate(`/stories/${storyId}`)
  return storyId
}

function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`shrink-0 border px-3 py-2 text-[0.65rem] transition ${active ? 'border-[#302d29] bg-[#302d29] text-white' : 'border-[#302d29]/15 bg-[#fbf9f5] text-[#71685d] hover:bg-[#eee8df]'}`}>{children}</button>
}
