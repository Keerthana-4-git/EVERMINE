import { useMemo, useState } from 'react'
import { Aperture, ArrowDownWideNarrow, ArrowRight, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AlbumEditorDialog } from '../components/AlbumEditorDialog'
import { ConfirmDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import { photoCategories, type MemoryAlbum } from '../data/memoryTypes'

type SortMode = 'newest' | 'oldest' | 'alphabetical'

export function AlbumsPage() {
  const { albums, loading, deleteAlbum, photos } = useMemory()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const [createOpen, setCreateOpen] = useState(false)
  const [editAlbum, setEditAlbum] = useState<MemoryAlbum | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MemoryAlbum | null>(null)
  const [busy, setBusy] = useState(false)

  const filteredAlbums = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return albums
      .filter((album) =>
        (!category || album.category === category) &&
        (!needle || `${album.name} ${album.description} ${album.category}`.toLocaleLowerCase().includes(needle)),
      )
      .sort((a, b) => sort === 'alphabetical'
        ? a.name.localeCompare(b.name)
        : sort === 'oldest'
          ? a.createdAt.localeCompare(b.createdAt)
          : b.createdAt.localeCompare(a.createdAt))
  }, [albums, category, query, sort])

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteAlbum(deleteTarget.id)
      showToast(`“${deleteTarget.name}” was deleted. Its photographs remain in My Memories.`)
      setDeleteTarget(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Album could not be deleted.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-8 grid gap-6 border-b border-[#302d29]/12 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow mb-2">Collections with a life of their own</p>
          <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">My Albums</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#82796e]">Gather the moments that belong together, and give each collection its own little story.</p>
        </div>
        <button type="button" className="auth-primary w-fit" onClick={() => setCreateOpen(true)}><Plus size={16} /> Create an album</button>
      </header>

      <section className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.68rem] text-[#8b8175]"><span className="serif mr-1 text-xl text-[#302d29]">{albums.length}</span> collections · {photos.length} photographs</p>
        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(13rem,1fr)_auto_auto]">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8175]" />
            <input aria-label="Search albums" className="auth-input min-h-10 py-2 pl-9 text-xs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an album…" />
          </label>
          <select aria-label="Filter albums by category" className="auth-input min-h-10 py-2 text-xs" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {photoCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <label className="relative">
            <ArrowDownWideNarrow size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8175]" />
            <select aria-label="Sort albums" className="auth-input min-h-10 py-2 pl-8 text-xs" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
              <option value="newest">Recently created</option>
              <option value="oldest">Oldest first</option>
              <option value="alphabetical">Name A–Z</option>
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">Opening your albums…</div>
      ) : filteredAlbums.length ? (
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAlbums.map((album, index) => (
            <AlbumCard
              key={album.id}
              album={album}
              index={index}
              onEdit={() => setEditAlbum(album)}
              onDelete={() => setDeleteTarget(album)}
            />
          ))}
        </div>
      ) : albums.length ? (
        <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-5 py-14 text-center">
          <p className="serif text-3xl">No collections found.</p>
          <p className="mt-2 text-sm text-[#82796e]">Try another search or category.</p>
          <button type="button" className="auth-secondary mt-4" onClick={() => { setQuery(''); setCategory('') }}>Clear filters</button>
        </div>
      ) : (
        <div className="grid border border-dashed border-[#c8b7a2] bg-[#fbf9f5] md:grid-cols-[1fr_0.85fr]">
          <div className="flex min-h-64 flex-col justify-center px-7 py-9 sm:px-12">
            <p className="eyebrow mb-3">Make a little room for a story</p>
            <h2 className="serif text-4xl leading-tight">Some moments find each other.</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#82796e]">Start a collection for a place, a person, a season, or simply the everyday things you want to keep.</p>
            <button type="button" className="auth-primary mt-6 w-fit" onClick={() => setCreateOpen(true)}><Plus size={15} /> Create your first album</button>
          </div>
          <div className="flex min-h-48 items-center justify-center bg-[#eae2d6] text-[#8a765e]"><Aperture size={40} strokeWidth={1} /></div>
        </div>
      )}

      {createOpen && <AlbumEditorDialog onClose={() => setCreateOpen(false)} />}
      {editAlbum && <AlbumEditorDialog album={editAlbum} onClose={() => setEditAlbum(null)} />}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete “${deleteTarget.name}”?`}
          description="The album and its arrangement will be removed. The original photographs will remain safely in My Memories."
          confirmLabel="Delete album"
          busy={busy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  )
}

function AlbumCard({
  album,
  index,
  onEdit,
  onDelete,
}: {
  album: MemoryAlbum
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const { photos } = useMemory()
  const cover = photos.find((photo) => photo.id === album.coverPhotoId) ??
    photos.find((photo) => album.photoIds.includes(photo.id))
  const offset = index % 3 === 1 ? 'sm:mt-8' : index % 3 === 2 ? 'sm:mt-3' : ''

  return (
    <article className={`group ${offset}`}>
      <Link to={`/albums/${album.id}`} className="block">
        <div className="relative aspect-[1.32/1] overflow-hidden border border-[#302d29]/10 bg-[#eae2d6]">
          {cover ? (
            <MemoryPhotoImage photo={cover} alt={`Cover of ${album.name}`} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.025]" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-[#8b7861]">
              <Aperture size={28} strokeWidth={1.2} />
              <span className="mt-2 text-[0.62rem]">Your cover photograph</span>
            </div>
          )}
          <span className="absolute bottom-3 left-3 border border-white/60 bg-[#fbf9f5]/90 px-2.5 py-1 text-[0.57rem] uppercase tracking-[0.12em] text-[#62584b]">{album.category}</span>
          <span className="absolute bottom-3 right-3 border border-white/60 bg-[#fbf9f5]/90 px-2.5 py-1 text-[0.57rem] text-[#62584b]">{album.photoIds.length} {album.photoIds.length === 1 ? 'photograph' : 'photographs'}</span>
        </div>
        <div className="flex items-start justify-between gap-4 pt-3">
          <div className="min-w-0">
            <h2 className="serif truncate text-2xl">{album.name}</h2>
            <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-[#82796e]">{album.description || 'A collection of moments, gathered in one place.'}</p>
          </div>
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#302d29]/15 text-[#766750] transition group-hover:border-[#a68c70] group-hover:bg-[#eee8df]"><ArrowRight size={15} /></span>
        </div>
      </Link>
      <div className="mt-2 flex gap-4 border-t border-[#302d29]/10 pt-2">
        <button type="button" onClick={onEdit} className="text-[0.65rem] text-[#82796e] hover:text-[#302d29]">Edit details</button>
        <button type="button" onClick={onDelete} className="inline-flex items-center gap-1 text-[0.65rem] text-[#8b8175] hover:text-[#805449]"><Trash2 size={12} /> Delete album</button>
      </div>
    </article>
  )
}
