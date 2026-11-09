import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Copy, Eye, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import {
  memoryBookThemes,
  type MemoryBook,
  type MemoryBookLayout,
  type MemoryBookPage,
  type MemoryBookPageLayout,
} from '../data/memoryTypes'

export function MemoryBooksPage() {
  const { bookId } = useParams()
  const location = useLocation()
  const { books, photos, loading, storageError } = useMemory()
  const book = bookId ? books.find((item) => item.id === bookId) : undefined
  if (location.pathname === '/books/new') return <BookEditor />
  if (bookId && location.pathname.endsWith('/edit')) {
    if (loading) return <PageStatus>Opening your book…</PageStatus>
    return book ? <BookEditor key={book.id} book={book} /> : <NotFound />
  }
  if (bookId && location.pathname.endsWith('/preview')) {
    if (loading) return <PageStatus>Preparing your book…</PageStatus>
    return book ? <BookPreview book={book} /> : <NotFound />
  }
  return <BookLibrary books={books} photos={photos} loading={loading} storageError={storageError} />
}

function BookLibrary({
  books,
  photos,
  loading,
  storageError,
}: {
  books: MemoryBook[]
  photos: ReturnType<typeof useMemory>['photos']
  loading: boolean
  storageError: string
}) {
  const { deleteBook, duplicateBook } = useMemory()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<MemoryBook | null>(null)
  const [busy, setBusy] = useState(false)

  async function duplicate(book: MemoryBook) {
    try {
      const id = await duplicateBook(book.id)
      showToast('A draft copy of your book is ready.')
      navigate(`/books/${id}/edit`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The book could not be duplicated.', 'error')
    }
  }

  async function remove() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteBook(deleteTarget.id)
      showToast('Memory book deleted.')
      setDeleteTarget(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The memory book could not be deleted.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-2">A collection, bound in your own words</p>
            <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Memory Books</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#82796e]">Arrange photographs and stories into a keepsake you can turn through anytime.</p>
          </div>
          <Link to="/books/new" className="auth-primary"><Plus size={16} /> Create a book</Link>
        </header>
        {storageError && <p className="auth-error mb-6" role="alert">{storageError}</p>}
        {loading ? (
          <PageStatus>Gathering your books…</PageStatus>
        ) : books.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {books.map((book, index) => {
              const cover = photos.find((photo) => photo.id === book.coverPhotoId) ??
                book.pages.flatMap((page) => page.photoIds).map((id) => photos.find((photo) => photo.id === id)).find((photo) => photo !== undefined)
              return (
                <article key={book.id} className={`group overflow-hidden border border-[#302d29]/10 bg-[#fbf9f5] ${index % 3 === 1 ? 'md:mt-6' : ''}`}>
                  <Link to={`/books/${book.id}/preview`} className="relative block aspect-[1.35] overflow-hidden bg-[#eae2d6]">
                    {cover ? <MemoryPhotoImage photo={cover} alt={cover.title} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" /> : <span className="flex h-full items-center justify-center text-[#8b7861]"><BookOpen size={36} strokeWidth={1.2} /></span>}
                    <span className="absolute bottom-3 left-3 right-3 border border-white/40 bg-[#f8f5ef]/90 px-4 py-3 backdrop-blur-sm">
                      <span className="eyebrow block text-[0.52rem]">{book.theme}</span>
                      <span className="serif mt-1 block truncate text-2xl">{book.title || 'Untitled book'}</span>
                    </span>
                  </Link>
                  <div className="p-4">
                    <p className="line-clamp-2 min-h-10 text-xs leading-5 text-[#82796e]">{book.description || 'A personal collection of memories.'}</p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="text-[0.62rem] text-[#8b8175]">{book.pages.length} pages · {book.state}</span>
                      <div className="flex gap-1">
                        <Link to={`/books/${book.id}/preview`} aria-label={`Preview ${book.title}`} className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df]"><Eye size={15} /></Link>
                        <Link to={`/books/${book.id}/edit`} aria-label={`Edit ${book.title}`} className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df]"><BookOpen size={15} /></Link>
                        <button type="button" aria-label={`Duplicate ${book.title}`} title="Duplicate book" className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df]" onClick={() => void duplicate(book)}><Copy size={15} /></button>
                        <button type="button" aria-label={`Delete ${book.title}`} title="Delete book" className="rounded-full p-2 text-[#805449] hover:bg-[#f5e9e4]" onClick={() => setDeleteTarget(book)}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="flex min-h-[26rem] flex-col items-center justify-center border border-dashed border-[#c8b7a2] bg-[#fbf9f5]/70 px-6 text-center">
            <BookOpen size={30} className="text-[#8b7861]" strokeWidth={1.3} />
            <p className="eyebrow mt-5">Your pages are waiting</p>
            <h2 className="serif mt-2 max-w-xl text-3xl">Gather a few moments into a book of your own.</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#82796e]">Choose a cover, arrange the pages, and write the details you want to keep close.</p>
            <Link to="/books/new" className="auth-primary mt-5"><Plus size={15} /> Create your first book</Link>
          </div>
        )}
      </motion.div>
      {deleteTarget && <ConfirmDialog title="Delete this book?" description="This removes the book and its page arrangement. Your original photographs and stories remain in EVERMINE." confirmLabel="Delete book" busy={busy} onCancel={() => setDeleteTarget(null)} onConfirm={() => void remove()} />}
    </div>
  )
}

function BookEditor({ book }: { book?: MemoryBook }) {
  const { photos, stories, createBook, updateBook } = useMemory()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [title, setTitle] = useState(book?.title ?? '')
  const [description, setDescription] = useState(book?.description ?? '')
  const [coverPhotoId, setCoverPhotoId] = useState(book?.coverPhotoId ?? '')
  const [theme, setTheme] = useState(book?.theme ?? memoryBookThemes[0])
  const [layout, setLayout] = useState<MemoryBookLayout>(book?.layout ?? 'editorial')
  const [pages, setPages] = useState<MemoryBookPage[]>(book?.pages ?? [])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [storyToAdd, setStoryToAdd] = useState('')
  const [preview, setPreview] = useState(false)
  const [previewPageIndex, setPreviewPageIndex] = useState(-1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draggedPage, setDraggedPage] = useState<number | null>(null)
  const [savedAt, setSavedAt] = useState(book?.updatedAt ?? '')
  const availablePages = useMemo(() => pages.map((page) => ({
    ...page,
    photos: page.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo) => photo !== undefined),
    story: page.storyId ? stories.find((story) => story.id === page.storyId) : undefined,
  })), [pages, photos, stories])
  const coverPhoto = photos.find((photo) => photo.id === coverPhotoId)

  function addSelectedPhotos() {
    const newPages = selectedPhotoIds.map((photoId) => {
      const photo = photos.find((item) => item.id === photoId)
      return {
        id: crypto.randomUUID(),
        title: photo?.title ?? '',
        caption: photo?.caption ?? '',
        photoIds: [photoId],
        storyId: null,
        layout: 'full' as const,
      }
    })
    setPages((current) => [...current, ...newPages])
    if (!coverPhotoId && selectedPhotoIds[0]) setCoverPhotoId(selectedPhotoIds[0])
    setSelectedPhotoIds([])
  }

  function addStoryPage() {
    const story = stories.find((item) => item.id === storyToAdd)
    if (!story) return
    setPages((current) => [...current, {
      id: crypto.randomUUID(),
      title: story.title,
      caption: story.body,
      photoIds: [...story.photoIds],
      storyId: story.id,
      layout: 'story',
    }])
    setStoryToAdd('')
  }

  function patchPage(id: string, patch: Partial<MemoryBookPage>) {
    setPages((current) => current.map((page) => page.id === id ? { ...page, ...patch } : page))
  }

  function reorderPage(target: number) {
    if (draggedPage === null || draggedPage === target) return
    setPages((current) => reorder(current, draggedPage, target))
    setDraggedPage(null)
  }

  async function save(state: 'draft' | 'finished') {
    if (!title.trim()) {
      setError('Add a title for your memory book.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const details = {
        title: title.trim(),
        description: description.trim(),
        coverPhotoId: coverPhotoId || null,
        theme,
        layout,
        pages,
        state,
      }
      if (book) {
        await updateBook(book.id, details)
        setSavedAt(new Date().toISOString())
        showToast(state === 'finished' ? 'Your memory book is ready.' : 'Book changes saved.')
      } else {
        const id = await createBook(details)
        showToast('Your memory book draft is saved.')
        navigate(`/books/${id}/edit`, { replace: true })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The memory book could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[88rem]">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/books" className="inline-flex items-center gap-2 text-xs text-[#8b7861] hover:text-[#302d29]"><ArrowLeft size={15} /> All books</Link>
        <div className="flex gap-2">
          {book && <Link to={`/books/${book.id}/preview`} className="auth-secondary min-h-9"><Eye size={14} /> Preview book</Link>}
          <button type="button" className="auth-secondary min-h-9" onClick={() => { setPreview((current) => !current); setPreviewPageIndex(-1) }}><Eye size={14} /> {preview ? 'Close preview' : 'Live preview'}</button>
        </div>
      </header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <section className="min-w-0 border border-[#302d29]/10 bg-[#fbf9f5]">
          <header className="border-b border-[#302d29]/10 bg-[#eee8df]/60 px-5 py-5 sm:px-8">
            <p className="eyebrow mb-2">A keepsake in the making</p>
            <input aria-label="Book title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} className="w-full border-0 bg-transparent p-0 serif text-4xl outline-none placeholder:text-[#b6aa9c] focus:ring-0" placeholder="Name your memory book…" />
            <textarea aria-label="Book description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} className="mt-3 min-h-12 w-full resize-y border-0 bg-transparent p-0 text-sm leading-6 text-[#71685d] outline-none placeholder:text-[#aaa197] focus:ring-0" placeholder="A few words about this collection…" />
          </header>
          <div className="space-y-7 p-5 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-xs font-semibold">Book theme</span><select aria-label="Book theme" className="auth-input min-h-10 py-2 text-xs" value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)}>{memoryBookThemes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-xs font-semibold">Page layout</span><select aria-label="Book layout" className="auth-input min-h-10 py-2 text-xs" value={layout} onChange={(event) => setLayout(event.target.value as MemoryBookLayout)}><option value="editorial">Editorial</option><option value="full-page">Full-page photographs</option><option value="gallery">Photo gallery</option></select></label>
            </div>
            <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
              <label className="space-y-2"><span className="text-xs font-semibold">Cover photograph</span><select aria-label="Cover photograph" className="auth-input min-h-10 py-2 text-xs" value={coverPhotoId} onChange={(event) => setCoverPhotoId(event.target.value)}><option value="">No cover photo</option>{photos.map((photo) => <option key={photo.id} value={photo.id}>{photo.title}</option>)}</select>{coverPhoto ? <MemoryPhotoImage photo={coverPhoto} alt={coverPhoto.title} className="aspect-[0.86] w-full" /> : <div className="flex aspect-[0.86] items-center justify-center bg-[#eee8df] text-[#8b7861]"><BookOpen size={24} /></div>}</label>
              <div className="space-y-3">
                <p className="text-xs font-semibold">Add photographs from My Memories</p>
                {photos.length ? <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                  {photos.map((photo) => <label key={photo.id} className={`relative cursor-pointer border p-1.5 ${selectedPhotoIds.includes(photo.id) ? 'border-[#805449] bg-[#eee8df]' : 'border-transparent bg-white/70'}`}><input aria-label={`Add ${photo.title} to book`} className="absolute left-2 top-2 z-10 h-4 w-4 accent-[#805449]" type="checkbox" checked={selectedPhotoIds.includes(photo.id)} onChange={() => setSelectedPhotoIds((current) => current.includes(photo.id) ? current.filter((id) => id !== photo.id) : [...current, photo.id])} /><MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-[1.2]" /><span className="mt-1 block truncate text-[0.62rem]">{photo.title}</span></label>)}
                </div> : <p className="text-xs text-[#82796e]">Your library has no photographs yet. Add photographs in My Memories first.</p>}
                <button type="button" className="auth-secondary min-h-9" disabled={!selectedPhotoIds.length} onClick={addSelectedPhotos}><ImagePlus size={14} /> Add selected to pages</button>
              </div>
            </div>
            <div className="border-t border-[#302d29]/10 pt-5">
              <p className="mb-2 text-xs font-semibold">Add a Memory Story page</p>
              <div className="flex flex-wrap gap-2">
                <select aria-label="Choose a story to add" className="auth-input min-h-10 min-w-48 flex-1 py-2 text-xs" value={storyToAdd} onChange={(event) => setStoryToAdd(event.target.value)}><option value="">Choose one of your stories</option>{stories.map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}</select>
                <button type="button" className="auth-secondary min-h-10" disabled={!storyToAdd} onClick={addStoryPage}><Plus size={14} /> Add story page</button>
              </div>
            </div>
            <div className="border-t border-[#302d29]/10 pt-5">
              <div className="mb-4 flex items-end justify-between gap-3"><div><p className="eyebrow mb-1">The pages</p><h2 className="serif text-3xl">{pages.length} {pages.length === 1 ? 'page' : 'pages'}</h2></div><span className="text-[0.62rem] text-[#8b8175]">Drag to arrange</span></div>
              {pages.length ? <div className="space-y-3">
                {pages.map((page, index) => {
                  const linkedStory = page.storyId ? stories.find((item) => item.id === page.storyId) : undefined
                  const pagePhotos = page.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo) => photo !== undefined)
                  const missingCount = page.photoIds.length - pagePhotos.length
                  return <article key={page.id} draggable onDragStart={() => setDraggedPage(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderPage(index)} className="grid gap-3 border border-[#302d29]/10 bg-white/70 p-3 sm:grid-cols-[1fr_9rem]">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center bg-[#eee8df] serif text-lg">{index + 1}</span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <input aria-label={`Page ${index + 1} title`} className="auth-input min-h-9 py-1.5 text-xs" value={page.title} onChange={(event) => patchPage(page.id, { title: event.target.value })} maxLength={120} placeholder="Page title" />
                        {linkedStory && <p className="truncate text-[0.62rem] text-[#8b7861]">Story: {linkedStory.title}</p>}
                        <textarea aria-label={`Page ${index + 1} caption`} className="auth-input min-h-16 py-2 text-xs leading-5" value={page.caption} onChange={(event) => patchPage(page.id, { caption: event.target.value })} maxLength={1000} placeholder="Caption or a few lines to keep…" />
                        {missingCount > 0 && <p className="text-[0.62rem] text-[#8f493e]">{missingCount} photograph unavailable.</p>}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-[0.62rem] font-semibold">Page composition<select aria-label={`Page ${index + 1} layout`} className="auth-input mt-1 min-h-9 py-1.5 text-[0.65rem]" value={page.layout} onChange={(event) => patchPage(page.id, { layout: event.target.value as MemoryBookPageLayout })}><option value="full">Full photograph</option><option value="split">Editorial split</option><option value="grid">Photo grid</option><option value="story">Story page</option></select></label>
                      <div className="grid grid-cols-3 gap-1">{pagePhotos.slice(0, 3).map((photo) => <MemoryPhotoImage key={photo.id} photo={photo} alt={photo.title} className="aspect-square" />)}</div>
                      <div className="mt-2 flex justify-end"><button type="button" aria-label={`Remove page ${index + 1}`} className="inline-flex items-center gap-1 text-[0.62rem] text-[#805449]" onClick={() => setPages((current) => current.filter((item) => item.id !== page.id))}><Trash2 size={13} /> Remove page</button></div>
                    </div>
                  </article>
                })}
              </div> : <div className="border border-dashed border-[#c8b7a2] px-4 py-8 text-center text-xs text-[#82796e]">Add photographs or a story above to begin arranging your pages.</div>}
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#302d29]/10 bg-[#f7f3ed] px-5 py-4 sm:px-8">
            <span className="text-[0.62rem] text-[#8b8175]">{savedAt ? `Last saved ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(savedAt))}` : 'Your book stays on this device.'}</span>
            <div className="flex gap-2"><button type="button" className="auth-secondary min-h-9" disabled={busy} onClick={() => void save('draft')}>{busy ? 'Saving…' : 'Save draft'}</button><button type="button" className="auth-primary min-h-9" disabled={busy} onClick={() => void save('finished')}>Save finished book</button></div>
          </footer>
          {error && <p role="alert" className="auth-error m-5 sm:mx-8">{error}</p>}
        </section>
        <aside className="h-fit xl:sticky xl:top-24">
          <p className="eyebrow mb-2">{preview ? 'Live preview' : 'Design studio'}</p>
          {preview ? <><div className="border border-[#302d29]/10 bg-[#fbf9f5] p-4">{previewPageIndex < 0 ? <BookCover title={title} description={description} photo={coverPhoto} /> : previewPageIndex >= pages.length ? <BookBackCover theme={theme} /> : <BookPagePreview title={title} description={description} theme={theme} bookLayout={layout} pages={availablePages} pageIndex={previewPageIndex} />}<div className="mt-4 flex items-center justify-between border-t border-[#302d29]/10 pt-3"><button type="button" aria-label="Previous preview page" className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df] disabled:opacity-40" disabled={previewPageIndex < 0} onClick={() => setPreviewPageIndex((index) => index - 1)}><ArrowLeft size={15} /></button><span className="text-[0.62rem] text-[#8b8175]">{previewPageIndex < 0 ? 'Cover' : previewPageIndex >= pages.length ? 'Back cover' : `Page ${previewPageIndex + 1} of ${pages.length}`}</span><button type="button" aria-label="Next preview page" className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df] disabled:opacity-40" disabled={previewPageIndex >= pages.length} onClick={() => setPreviewPageIndex((index) => index + 1)}><ArrowRight size={15} /></button></div></div><p className="mt-3 text-[0.62rem] text-[#8b8175]">Browser preview · PDF export unavailable</p></> : <div className="border border-[#302d29]/10 bg-[#eee8df]/60 p-5"><BookOpen size={20} className="text-[#8b7861]" /><h2 className="serif mt-3 text-2xl">{theme}</h2><p className="mt-2 text-xs leading-5 text-[#82796e]">{layout === 'editorial' ? 'An editorial rhythm with generous space for words.' : layout === 'gallery' ? 'A gallery-first flow for a collection of photographs.' : 'A full-page image-led keepsake.'}</p><p className="mt-5 border-t border-[#302d29]/10 pt-4 text-[0.65rem] leading-5 text-[#8b8175]">Drag page cards to change their sequence. Your original photos remain in My Memories.</p></div>}
        </aside>
      </div>
    </div>
  )
}

function BookPreview({ book }: { book: MemoryBook }) {
  const { photos, stories } = useMemory()
  const [pageIndex, setPageIndex] = useState(-1)
  const currentPage = book.pages[pageIndex]
  const story = currentPage?.storyId ? stories.find((item) => item.id === currentPage.storyId) : undefined
  const currentPhotos = currentPage?.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo) => photo !== undefined) ?? []
  const cover = photos.find((photo) => photo.id === book.coverPhotoId)
  const backCover = pageIndex === book.pages.length
  return (
    <div className="mx-auto max-w-[70rem]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link to={`/books/${book.id}/edit`} className="inline-flex items-center gap-2 text-xs text-[#8b7861]"><ArrowLeft size={15} /> Return to the studio</Link><span className="text-[0.65rem] text-[#8b8175]">Browser preview · PDF export unavailable</span></header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className={`relative mx-auto flex min-h-[34rem] w-full max-w-[48rem] items-center justify-center overflow-hidden border border-[#302d29]/15 bg-[#fbf9f5] p-5 shadow-[0_20px_65px_rgba(48,45,41,0.12)] sm:p-10 ${book.theme === 'Travel Journal' ? 'bg-[#e9e0d1]' : book.theme === 'Family Heritage' ? 'bg-[#ede5d8]' : ''}`}>
          {pageIndex < 0 ? <BookCover title={book.title} description={book.description} photo={cover} /> : backCover ? <BookBackCover theme={book.theme} /> : <BookPagePreview title={currentPage?.title ?? ''} description={currentPage?.caption ?? story?.body ?? ''} theme={book.theme} bookLayout={book.layout} pages={currentPage ? [{ ...currentPage, photos: currentPhotos, story }] : []} pageIndex={0} />}
          <div className="absolute bottom-4 right-5 text-[0.62rem] text-[#8b8175]">{pageIndex < 0 || backCover ? '' : `${pageIndex + 1} / ${book.pages.length}`}</div>
        </div>
        <aside className="flex flex-col justify-center">
          <p className="eyebrow">{book.theme}</p><h2 className="serif mt-2 text-3xl">{book.title}</h2><p className="mt-2 text-xs leading-5 text-[#82796e]">{book.description}</p>
          <div className="mt-7 flex items-center justify-between"><button type="button" aria-label="Previous book page" disabled={pageIndex < 0} onClick={() => setPageIndex((index) => index - 1)} className="auth-secondary min-h-10 px-3 disabled:opacity-40"><ArrowLeft size={15} /></button><span className="text-xs text-[#8b8175]">{pageIndex < 0 ? 'Cover' : backCover ? 'Back cover' : `Page ${pageIndex + 1}`}</span><button type="button" aria-label="Next book page" disabled={backCover} onClick={() => setPageIndex((index) => index + 1)} className="auth-secondary min-h-10 px-3 disabled:opacity-40"><ArrowRight size={15} /></button></div>
          <Link to={`/books/${book.id}/edit`} className="auth-primary mt-5 justify-center">Return to editing</Link>
        </aside>
      </div>
    </div>
  )
}

function BookCover({ title, description, photo }: { title: string; description: string; photo?: ReturnType<typeof useMemory>['photos'][number] }) {
  return <div className="relative flex aspect-[0.78] max-h-[34rem] w-full max-w-[25rem] flex-col justify-end overflow-hidden bg-[#c8b7a2] p-7 sm:p-10">{photo && <MemoryPhotoImage photo={photo} alt={photo.title} className="absolute inset-0 h-full w-full" />}<div className="absolute inset-0 bg-gradient-to-t from-[#27231f]/75 via-[#27231f]/10 to-transparent" /><div className="relative z-10 text-white"><p className="eyebrow text-white/75">A memory book</p><h1 className="serif mt-2 text-4xl leading-tight sm:text-5xl">{title || 'A collection of moments'}</h1>{description && <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/80">{description}</p>}</div></div>
}

function BookBackCover({ theme }: { theme: string }) {
  return <div className="flex aspect-[0.78] max-h-[34rem] w-full max-w-[25rem] flex-col items-center justify-center bg-[#eee8df] p-7 text-center sm:p-10"><p className="eyebrow">{theme}</p><h2 className="serif mt-4 text-3xl">The end of this little volume.</h2><p className="mt-3 text-sm leading-6 text-[#82796e]">Your memories remain in your personal archive.</p></div>
}

function BookPagePreview({
  title,
  description,
  theme,
  bookLayout,
  coverPhoto,
  pages,
  pageIndex,
}: {
  title: string
  description: string
  theme: string
  bookLayout?: MemoryBookLayout
  coverPhoto?: ReturnType<typeof useMemory>['photos'][number]
  pages: Array<MemoryBookPage & { photos: ReturnType<typeof useMemory>['photos']; story?: ReturnType<typeof useMemory>['stories'][number] }>
  pageIndex: number
}) {
  const page = pages[pageIndex]
  if (!page) return <BookCover title={title} description={description} photo={coverPhoto} />
  const storyText = page.story?.body ?? page.caption
  const isSplit = page.layout === 'split'
  const photosClass = page.layout === 'grid' || bookLayout === 'gallery' ? 'grid-cols-2' : 'grid-cols-1'
  const imageRatio = page.layout === 'full' || bookLayout === 'full-page' ? 'aspect-[0.82]' : 'aspect-[1.5]'
  return <article className="w-full max-w-2xl">
    <p className="eyebrow text-[0.55rem]">{theme} · {page.layout === 'story' ? 'A story' : 'A photograph'}</p>
    <h2 className="serif mt-2 text-3xl sm:text-4xl">{page.title || page.story?.title || 'A page to remember'}</h2>
    {isSplit ? <div className="mt-5 grid gap-4 sm:grid-cols-[1.1fr_0.9fr] sm:items-center"><div>{page.photos[0] ? <MemoryPhotoImage photo={page.photos[0]} alt={page.photos[0].title} className="aspect-[0.9] max-h-[20rem]" /> : <div className="flex aspect-[0.9] max-h-[20rem] items-center justify-center bg-[#eee8df] text-[#8b7861]"><BookOpen size={24} /></div>}</div><div>{storyText && <p className="whitespace-pre-wrap text-sm leading-7 text-[#71685d]">{storyText}</p>}</div></div> : <>{page.photos.length ? <div className={`mt-5 grid gap-2 ${photosClass}`}>{page.photos.slice(0, page.layout === 'grid' || bookLayout === 'gallery' ? 4 : 1).map((photo) => <MemoryPhotoImage key={photo.id} photo={photo} alt={photo.title} className={`${imageRatio} max-h-[20rem]`} />)}</div> : <div className="mt-5 flex aspect-[1.5] max-h-[20rem] items-center justify-center bg-[#eee8df] text-[#8b7861]"><BookOpen size={24} /></div>}{page.photoIds.length > page.photos.length && <p className="mt-2 text-xs text-[#8f493e]">Some photographs on this page are no longer available.</p>}{storyText && <p className="mt-5 line-clamp-[10] whitespace-pre-wrap text-sm leading-7 text-[#71685d]">{storyText}</p>}</>}
  </article>
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
  return <div className="mx-auto max-w-xl py-20 text-center"><p className="eyebrow">Book not found</p><h1 className="serif mt-2 text-4xl">This volume is not in your collection.</h1><Link to="/books" className="auth-secondary mt-5">Return to Memory Books</Link></div>
}
