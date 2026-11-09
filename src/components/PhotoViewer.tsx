import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Heart,
  Images,
  Minus,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useMemory } from '../data/useMemory'
import type { MemoryPhoto } from '../data/memoryTypes'
import { AlbumPickerDialog } from './AlbumPickerDialog'
import { ConfirmDialog } from './MemoryDialog'
import { MemoryPhotoImage } from './MemoryPhotoImage'
import { PhotoEditorDialog } from './PhotoEditorDialog'
import { useObjectUrl } from './useObjectUrl'
import { useToast } from './useToast'

export function PhotoViewer({
  photos,
  photoId,
  onClose,
  onDeleted,
  onRemoveFromAlbum,
}: {
  photos: MemoryPhoto[]
  photoId: string
  onClose: () => void
  onDeleted?: () => void
  onRemoveFromAlbum?: (photo: MemoryPhoto) => Promise<void>
}) {
  const { deletePhotos, toggleFavorite } = useMemory()
  const { showToast } = useToast()
  const orderedPhotos = useMemo(
    () => [...photos].sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.createdAt.localeCompare(b.createdAt)),
    [photos],
  )
  const initialIndex = Math.max(0, orderedPhotos.findIndex((photo) => photo.id === photoId))
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [albumsOpen, setAlbumsOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'delete' | 'remove' | null>(null)
  const [busy, setBusy] = useState(false)
  const photo = orderedPhotos[index]
  const imageUrl = useObjectUrl(photo?.blob)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1))
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(orderedPhotos.length - 1, current + 1))
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, orderedPhotos.length])

  if (!photo) return null

  async function toggleHeart() {
    try {
      await toggleFavorite(photo.id)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Favorite could not be updated.', 'error')
    }
  }

  async function confirm() {
    setBusy(true)
    try {
      if (confirmAction === 'delete') {
        await deletePhotos([photo.id])
        showToast('Photograph moved to Recently Deleted.')
        onDeleted?.()
        onClose()
      } else if (confirmAction === 'remove' && onRemoveFromAlbum) {
        await onRemoveFromAlbum(photo)
        showToast('Photograph removed from this album. Your original is safe in My Memories.')
        if (orderedPhotos.length <= 1) onClose()
        else setIndex((current) => Math.max(0, current - 1))
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'That action could not be completed.', 'error')
    } finally {
      setBusy(false)
      setConfirmAction(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-[#211f1c]/[0.97] text-[#f8f5ef]">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-7">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{photo.title}</p>
            <p className="mt-0.5 text-[0.63rem] text-white/55">
              {photo.date || 'Date not set'}{photo.location ? ` · ${photo.location}` : ''}
              <span className="ml-2">{index + 1} / {orderedPhotos.length}</span>
            </p>
          </div>
          <button type="button" aria-label="Close photo viewer" onClick={onClose} className="ml-3 rounded-full p-2 text-white/75 hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 p-3 sm:gap-6 sm:p-6">
          <button
            type="button"
            aria-label="Previous photograph"
            disabled={index === 0}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/75 hover:bg-white/10 disabled:opacity-20"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-full min-w-0 flex-1 items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={photo.title}
                className={`max-h-full max-w-full object-contain transition-transform duration-300 ${zoom ? 'scale-[1.5] cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setZoom((current) => !current)}
              />
            ) : (
              <MemoryPhotoImage photo={photo} className="aspect-square h-full max-h-[60vh] w-full max-w-2xl" />
            )}
          </div>
          <button
            type="button"
            aria-label="Next photograph"
            disabled={index === orderedPhotos.length - 1}
            onClick={() => setIndex((current) => Math.min(orderedPhotos.length - 1, current + 1))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/75 hover:bg-white/10 disabled:opacity-20"
          >
            <ArrowRight size={20} />
          </button>
        </div>
        <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {photo.caption && <p className="line-clamp-2 text-sm leading-6 text-white/85">{photo.caption}</p>}
              <div className="mt-1 flex flex-wrap gap-2 text-[0.62rem] text-white/55">
                {photo.category && <span>{photo.category}</span>}
                {photo.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ViewerButton label={photo.favorite ? 'Remove from favorites' : 'Add to favorites'} onClick={() => void toggleHeart()}>
                <Heart size={16} fill={photo.favorite ? 'currentColor' : 'none'} className={photo.favorite ? 'text-[#d59b87]' : ''} />
              </ViewerButton>
              <ViewerButton label="Add to album" onClick={() => setAlbumsOpen(true)}><Images size={16} /></ViewerButton>
              <ViewerButton label="Edit details" onClick={() => setEditOpen(true)}><Pencil size={15} /></ViewerButton>
              {imageUrl && (
                <a
                  aria-label="Download original photograph"
                  href={imageUrl}
                  download={photo.fileName}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
                >
                  <ArrowDownToLine size={16} />
                </a>
              )}
              <ViewerButton label={zoom ? 'Zoom out' : 'Zoom in'} onClick={() => setZoom((current) => !current)}>
                {zoom ? <Minus size={16} /> : <Plus size={16} />}
              </ViewerButton>
              {onRemoveFromAlbum && (
                <ViewerButton label="Remove from this album" onClick={() => setConfirmAction('remove')}>
                  <X size={16} />
                </ViewerButton>
              )}
              <ViewerButton label="Delete from library" onClick={() => setConfirmAction('delete')}>
                <Trash2 size={16} />
              </ViewerButton>
            </div>
          </div>
        </footer>
      </div>
      {editOpen && <PhotoEditorDialog photo={photo} onClose={() => setEditOpen(false)} />}
      {albumsOpen && <AlbumPickerDialog photoIds={[photo.id]} onClose={() => setAlbumsOpen(false)} />}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction === 'delete' ? 'Let this photo go?' : 'Remove from this album?'}
          description={
            confirmAction === 'delete'
              ? 'This moves the photograph to Recently Deleted. Its album and story links will be restored if you bring it back; permanent deletion is available there.'
              : 'This only removes the photograph from this album. The original stays in My Memories.'
          }
          confirmLabel={confirmAction === 'delete' ? 'Move to Recently Deleted' : 'Remove from album'}
          busy={busy}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => void confirm()}
        />
      )}
    </>
  )
}

function ViewerButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  )
}
