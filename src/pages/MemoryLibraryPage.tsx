import { useMemo, useState } from 'react'
import {
  ArrowDownWideNarrow,
  ArrowUpFromLine,
  Check,
  Heart,
  Images,
  ListFilter,
  Plus,
  Search,
  SquareCheck,
  Trash2,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AlbumPickerDialog } from '../components/AlbumPickerDialog'
import { ConfirmDialog } from '../components/MemoryDialog'
import { PhotoEditorDialog } from '../components/PhotoEditorDialog'
import { PhotoGallery } from '../components/PhotoGallery'
import { PhotoUploadDialog } from '../components/PhotoUploadDialog'
import { PhotoViewer } from '../components/PhotoViewer'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import { photoCategories } from '../data/memoryTypes'

type Props = { mode: 'memories' | 'favorites' }
type SortMode = 'newest' | 'oldest' | 'alphabetical'

export function MemoryLibraryPage({ mode }: Props) {
  const { photos, albums, loading, storageError, toggleFavorite, deletePhotos } = useMemory()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [albumId, setAlbumId] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [albumPickerOpen, setAlbumPickerOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const favoritePage = mode === 'favorites'

  const filteredPhotos = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    const result = photos.filter((photo) => {
      if (favoritePage && !photo.favorite) return false
      if (category && photo.category !== category) return false
      if (date && photo.date !== date) return false
      if (albumId && !albums.find((album) => album.id === albumId)?.photoIds.includes(photo.id)) return false
      if (needle) {
        const haystack = [
          photo.title,
          photo.caption,
          photo.location,
          photo.category,
          ...photo.tags,
        ].join(' ').toLocaleLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })
    return result.sort((a, b) => {
      if (sort === 'alphabetical') return a.title.localeCompare(b.title)
      const byDate = (a.date || a.createdAt).localeCompare(b.date || b.createdAt)
      return sort === 'oldest' ? byDate : -byDate
    })
  }, [albums, albumId, category, date, favoritePage, photos, query, sort])

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function favorite(id: string) {
    try {
      await toggleFavorite(id)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Favorite could not be updated.', 'error')
    }
  }

  async function confirmBulkDelete() {
    setDeleteBusy(true)
    try {
      await deletePhotos(selectedIds)
      showToast(`${selectedIds.length} ${selectedIds.length === 1 ? 'photograph' : 'photographs'} moved to Recently Deleted.`)
      setSelectedIds([])
      setSelectionMode(false)
      setConfirmDelete(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Selected photographs could not be deleted.', 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  function toggleAllVisible() {
    const allSelected = filteredPhotos.length > 0 && filteredPhotos.every((photo) => selectedIds.includes(photo.id))
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !filteredPhotos.some((photo) => photo.id === id))
        : [...new Set([...current, ...filteredPhotos.map((photo) => photo.id)])],
    )
  }

  const activePhoto = viewerId ? photos.find((photo) => photo.id === viewerId) : undefined
  const editingPhoto = editId ? photos.find((photo) => photo.id === editId) : undefined
  const clearFilters = () => {
    setQuery('')
    setCategory('')
    setDate('')
    setAlbumId('')
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow mb-2">{favoritePage ? 'The moments closest to your heart' : 'Your personal archive'}</p>
          <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">
            {favoritePage ? 'Held a little closer.' : 'My Memories'}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#82796e]">
            {favoritePage
              ? 'A small collection of the photographs you chose to keep near.'
              : 'Photographs are only the beginning. Keep the little details that make each one yours.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!favoritePage && (
            <button type="button" className="auth-primary" onClick={() => setUploadOpen(true)}>
              <ArrowUpFromLine size={15} /> Upload photographs
            </button>
          )}
          {favoritePage && <Link className="auth-secondary" to="/memories"><Images size={15} /> Explore memories</Link>}
        </div>
      </header>

      <section className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-[#302d29]/12 py-3">
        <p className="text-[0.68rem] text-[#8b8175]">
          <span className="serif mr-1 text-xl text-[#302d29]">{favoritePage ? photos.filter((photo) => photo.favorite).length : photos.length}</span>
          {favoritePage ? 'favorite moments' : 'photographs in your library'}
          {!loading && filteredPhotos.length !== photos.length && <span> · {filteredPhotos.length} shown</span>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {selectionMode ? (
            <>
              <button type="button" className="auth-secondary min-h-9" onClick={toggleAllVisible}>
                <SquareCheck size={14} /> Select visible
              </button>
              <button type="button" className="auth-secondary min-h-9" onClick={() => setAlbumPickerOpen(true)} disabled={!selectedIds.length || !albums.length}>
                <Plus size={14} /> Add to album
              </button>
              <button type="button" className="inline-flex min-h-9 items-center gap-2 border border-[#805449]/40 px-3 text-xs text-[#805449] hover:bg-[#f5e9e4] disabled:opacity-40" onClick={() => setConfirmDelete(true)} disabled={!selectedIds.length}>
                <Trash2 size={14} /> Delete ({selectedIds.length})
              </button>
              <button type="button" aria-label="Exit selection mode" className="rounded-full p-2 text-[#756d62] hover:bg-[#eee8df]" onClick={() => { setSelectionMode(false); setSelectedIds([]) }}>
                <X size={16} />
              </button>
            </>
          ) : !favoritePage && (
            <button type="button" className="auth-secondary min-h-9" onClick={() => setSelectionMode(true)}>
              <Check size={14} /> Select
            </button>
          )}
        </div>
      </section>

      <section aria-label="Search and filter photographs" className="mb-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1.3fr)_repeat(3,minmax(8rem,0.75fr))_minmax(8rem,0.8fr)]">
        <label className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8175]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="auth-input min-h-10 pl-9 py-2 text-xs" placeholder={favoritePage ? 'Search favorites…' : 'Search photographs…'} aria-label="Search photographs" />
        </label>
        <label className="relative">
          <ListFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8175]" />
          <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="auth-input min-h-10 py-2 pl-8 text-xs">
            <option value="">All categories</option>
            {photoCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <input aria-label="Filter by date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="auth-input min-h-10 py-2 text-xs" />
        <select aria-label="Filter by album" value={albumId} onChange={(event) => setAlbumId(event.target.value)} className="auth-input min-h-10 py-2 text-xs">
          <option value="">All albums</option>
          {albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}
        </select>
        <label className="relative">
          <ArrowDownWideNarrow size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8175]" />
          <select aria-label="Sort photographs" value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="auth-input min-h-10 py-2 pl-8 text-xs">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="alphabetical">Title A–Z</option>
          </select>
        </label>
      </section>

      {storageError && <p className="auth-error mb-5" role="alert">{storageError}</p>}

      {loading ? (
        <div role="status" className="flex min-h-64 items-center justify-center text-sm text-[#8b8175]">Opening your local collection…</div>
      ) : filteredPhotos.length ? (
        <PhotoGallery
          photos={filteredPhotos}
          selectedIds={selectedIds}
          selectionMode={selectionMode}
          onToggleSelection={toggleSelection}
          onOpen={setViewerId}
          onEdit={setEditId}
          onToggleFavorite={(id) => void favorite(id)}
        />
      ) : (
        <EmptyCollection
          favoritePage={favoritePage}
          hasPhotos={photos.length > 0}
          hasFilters={Boolean(query || category || date || albumId)}
          onUpload={() => setUploadOpen(true)}
          onClear={clearFilters}
        />
      )}

      {uploadOpen && <PhotoUploadDialog onClose={() => setUploadOpen(false)} />}
      {albumPickerOpen && <AlbumPickerDialog photoIds={selectedIds} onClose={() => setAlbumPickerOpen(false)} />}
      {editingPhoto && <PhotoEditorDialog photo={editingPhoto} onClose={() => setEditId(null)} />}
      {activePhoto && (
        <PhotoViewer
          photos={filteredPhotos}
          photoId={activePhoto.id}
          onClose={() => setViewerId(null)}
          onDeleted={() => setViewerId(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${selectedIds.length} ${selectedIds.length === 1 ? 'photograph' : 'photographs'}?`}
          description="The selected photographs will move to Recently Deleted first. Their album and story links remain available if you restore them."
          confirmLabel={`Move ${selectedIds.length} to Recently Deleted`}
          busy={deleteBusy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void confirmBulkDelete()}
        />
      )}
    </div>
  )
}

function EmptyCollection({
  favoritePage,
  hasPhotos,
  hasFilters,
  onUpload,
  onClear,
}: {
  favoritePage: boolean
  hasPhotos: boolean
  hasFilters: boolean
  onUpload: () => void
  onClear: () => void
}) {
  if (hasFilters) {
    return (
      <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-5 py-14 text-center">
        <p className="serif text-3xl">Nothing in this little corner.</p>
        <p className="mt-2 text-sm text-[#82796e]">Try a different search or clear the filters.</p>
        <button type="button" className="auth-secondary mt-5" onClick={onClear}>Clear filters</button>
      </div>
    )
  }
  if (favoritePage && !hasPhotos) {
    return (
      <div className="grid border border-[#302d29]/10 bg-[#fbf9f5] md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex min-h-64 flex-col justify-center px-7 py-9 sm:px-12">
          <p className="eyebrow mb-3">Favorites</p>
          <h2 className="serif text-4xl leading-tight">A place for your most treasured moments.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#82796e]">Tap the heart on any photograph to keep it close. Your favorites will find their way here.</p>
          <Link className="auth-primary mt-6 w-fit" to="/memories">Explore My Memories <Images size={15} /></Link>
        </div>
        <div className="flex min-h-44 items-center justify-center bg-[#eae2d6] text-[#8a765e]">
          <Heart size={38} strokeWidth={1} />
        </div>
      </div>
    )
  }
  if (favoritePage) {
    return (
      <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-5 py-14 text-center">
        <Heart size={26} className="mx-auto text-[#a68c70]" strokeWidth={1.4} />
        <p className="serif mt-3 text-3xl">No favorites just yet.</p>
        <p className="mt-2 text-sm text-[#82796e]">Visit your memories and tap a heart to save a moment here.</p>
        <Link className="auth-secondary mt-5" to="/memories">Explore memories</Link>
      </div>
    )
  }
  return (
    <div className="grid border border-dashed border-[#c8b7a2] bg-[#fbf9f5] md:grid-cols-[0.9fr_1.1fr]">
      <div className="flex min-h-64 flex-col justify-center px-7 py-9 sm:px-12">
        <p className="eyebrow mb-3">Your collection begins here</p>
        <h2 className="serif text-4xl leading-tight">The first picture holds a thousand details.</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#82796e]">Bring in a photograph and add the place, the people, and the little story you want to remember.</p>
        <button type="button" className="auth-primary mt-6 w-fit" onClick={onUpload}><ArrowUpFromLine size={15} /> Upload your first photographs</button>
      </div>
      <div className="flex min-h-44 items-center justify-center bg-[#eae2d6] text-[#8a765e]">
        <Images size={38} strokeWidth={1} />
      </div>
    </div>
  )
}
