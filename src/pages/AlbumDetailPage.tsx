import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Images, Pencil, SquareCheck, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AlbumEditorDialog } from '../components/AlbumEditorDialog'
import { ConfirmDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { PhotoGallery } from '../components/PhotoGallery'
import { PhotoEditorDialog } from '../components/PhotoEditorDialog'
import { PhotoViewer } from '../components/PhotoViewer'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import type { MemoryPhoto } from '../data/memoryTypes'

export function AlbumDetailPage() {
  const { albumId } = useParams()
  const { albums, photos, loading, updateAlbum, toggleFavorite } = useMemory()
  const { showToast } = useToast()
  const album = albums.find((item) => item.id === albumId)
  const [editOpen, setEditOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [busy, setBusy] = useState(false)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [editPhotoId, setEditPhotoId] = useState<string | null>(null)

  const albumPhotos = useMemo(
    () => album
      ? album.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is MemoryPhoto => Boolean(photo))
      : [],
    [album, photos],
  )

  if (!album && loading) {
    return <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">Opening your album…</div>
  }
  if (!album) {
    return (
      <div className="mx-auto max-w-3xl border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-6 py-16 text-center">
        <p className="eyebrow mb-2">Collection not found</p>
        <h1 className="serif text-4xl">This album has moved on.</h1>
        <Link className="auth-secondary mt-5" to="/albums">Back to My Albums</Link>
      </div>
    )
  }

  const currentAlbum = album
  const cover = photos.find((photo) => photo.id === currentAlbum.coverPhotoId) ??
    photos.find((photo) => currentAlbum.photoIds.includes(photo.id))

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function removeSelected() {
    setBusy(true)
    try {
      const photoIds = currentAlbum.photoIds.filter((id) => !selectedIds.includes(id))
      const coverPhotoId = currentAlbum.coverPhotoId && photoIds.includes(currentAlbum.coverPhotoId)
        ? currentAlbum.coverPhotoId
        : photoIds[0] ?? null
      await updateAlbum(currentAlbum.id, {
        name: currentAlbum.name,
        description: currentAlbum.description,
        category: currentAlbum.category,
        photoIds,
        coverPhotoId,
      })
      showToast(`${selectedIds.length} ${selectedIds.length === 1 ? 'photograph removed' : 'photographs removed'} from this album. Originals are safe in My Memories.`)
      setSelectedIds([])
      setSelectionMode(false)
      setConfirmRemove(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Photographs could not be removed from this album.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function removeOne(photo: MemoryPhoto) {
    const photoIds = currentAlbum.photoIds.filter((id) => id !== photo.id)
    await updateAlbum(currentAlbum.id, {
      name: currentAlbum.name,
      description: currentAlbum.description,
      category: currentAlbum.category,
      photoIds,
      coverPhotoId: currentAlbum.coverPhotoId === photo.id ? photoIds[0] ?? null : currentAlbum.coverPhotoId,
    })
  }

  function selectVisible() {
    const allSelected = albumPhotos.length > 0 && albumPhotos.every((photo) => selectedIds.includes(photo.id))
    setSelectedIds(allSelected ? [] : albumPhotos.map((photo) => photo.id))
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <Link to="/albums" className="mb-5 inline-flex items-center gap-2 text-xs text-[#82796e] hover:text-[#302d29]"><ArrowLeft size={14} /> All albums</Link>
      <section className="grid overflow-hidden border border-[#302d29]/10 bg-[#eae2d6] lg:min-h-[22rem] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-56 lg:order-2 lg:min-h-0">
          {cover
            ? <MemoryPhotoImage photo={cover} alt={`Cover photograph for ${currentAlbum.name}`} className="absolute inset-0 h-full w-full" />
            : <div className="flex h-full min-h-56 items-center justify-center text-[#8b7861]"><Images size={40} strokeWidth={1} /></div>}
          <div className="absolute bottom-4 left-4 border border-white/60 bg-[#fbf9f5]/90 px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-[#62584b]">{currentAlbum.category}</div>
        </div>
        <div className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:order-1 lg:px-14">
          <p className="eyebrow mb-3">A collection of moments</p>
          <h1 className="serif text-5xl leading-[0.98] sm:text-6xl">{currentAlbum.name}</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#71685d]">{currentAlbum.description || 'A collection of moments, gathered in one place.'}</p>
          <p className="mt-4 text-[0.68rem] text-[#8b8175]">{albumPhotos.length} {albumPhotos.length === 1 ? 'photograph' : 'photographs'} · Created {new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(currentAlbum.createdAt))}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" className="auth-secondary" onClick={() => setEditOpen(true)}><Pencil size={14} /> Edit album</button>
            <Link to="/memories" className="auth-secondary"><Images size={14} /> Add photographs</Link>
          </div>
        </div>
      </section>

      <section className="mb-5 mt-9 flex flex-wrap items-center justify-between gap-3 border-b border-[#302d29]/12 pb-3">
        <div>
          <p className="eyebrow">Collected here</p>
          <p className="serif mt-1 text-2xl">{albumPhotos.length ? 'The moments in this album' : 'Ready when you are'}</p>
        </div>
        {albumPhotos.length > 0 && (
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <button type="button" className="auth-secondary min-h-9" onClick={selectVisible}><SquareCheck size={14} /> Select all</button>
                <button type="button" className="inline-flex min-h-9 items-center gap-2 border border-[#805449]/40 px-3 text-xs text-[#805449] hover:bg-[#f5e9e4] disabled:opacity-40" onClick={() => setConfirmRemove(true)} disabled={!selectedIds.length}><Trash2 size={14} /> Remove ({selectedIds.length})</button>
                <button type="button" aria-label="Exit selection mode" className="rounded-full p-2 text-[#756d62] hover:bg-[#eee8df]" onClick={() => { setSelectionMode(false); setSelectedIds([]) }}>Cancel</button>
              </>
            ) : (
              <button type="button" className="auth-secondary min-h-9" onClick={() => setSelectionMode(true)}><Check size={14} /> Select photos</button>
            )}
          </div>
        )}
      </section>

      {albumPhotos.length ? (
        <PhotoGallery
          photos={albumPhotos}
          selectedIds={selectedIds}
          selectionMode={selectionMode}
          onToggleSelection={toggleSelection}
          onOpen={setViewerId}
          onEdit={setEditPhotoId}
          onToggleFavorite={(id) => void toggleFavorite(id).catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Favorite could not be updated.', 'error'))}
        />
      ) : (
        <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-5 py-12 text-center">
          <p className="serif text-3xl">A little space for what comes next.</p>
          <p className="mt-2 text-sm text-[#82796e]">Add photographs from My Memories, or edit this album to choose them.</p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" className="auth-secondary" onClick={() => setEditOpen(true)}>Choose photographs</button>
            <Link to="/memories" className="auth-primary">Browse memories</Link>
          </div>
        </div>
      )}

      {editOpen && <AlbumEditorDialog album={currentAlbum} onClose={() => setEditOpen(false)} />}
      {editPhotoId && photos.find((photo) => photo.id === editPhotoId) && (
        <PhotoEditorDialog photo={photos.find((photo) => photo.id === editPhotoId)!} onClose={() => setEditPhotoId(null)} />
      )}
      {viewerId && albumPhotos.some((photo) => photo.id === viewerId) && (
        <PhotoViewer
          photos={albumPhotos}
          photoId={viewerId}
          onClose={() => setViewerId(null)}
          onRemoveFromAlbum={removeOne}
        />
      )}
      {confirmRemove && (
        <ConfirmDialog
          title={`Remove ${selectedIds.length} ${selectedIds.length === 1 ? 'photograph' : 'photographs'} from this album?`}
          description="Only the album arrangement changes. The original photographs remain in My Memories and any other albums."
          confirmLabel="Remove from album"
          busy={busy}
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => void removeSelected()}
        />
      )}
    </div>
  )
}
