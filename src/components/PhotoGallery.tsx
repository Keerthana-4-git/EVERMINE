import { Heart, Pencil, Square, SquareCheck } from 'lucide-react'
import { MemoryPhotoImage } from './MemoryPhotoImage'
import { useMemory } from '../data/useMemory'
import type { MemoryPhoto } from '../data/memoryTypes'

export function PhotoGallery({
  photos,
  selectedIds,
  selectionMode,
  onToggleSelection,
  onOpen,
  onEdit,
  onToggleFavorite,
}: {
  photos: MemoryPhoto[]
  selectedIds: string[]
  selectionMode: boolean
  onToggleSelection: (id: string) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onToggleFavorite: (id: string) => void
}) {
  const { settings } = useMemory()
  const compact = settings.galleryDensity === 'compact'
  if (!photos.length) return null

  return (
    <div className={`columns-2 ${compact ? 'gap-2 sm:columns-4 sm:gap-2 xl:columns-5' : 'gap-3 sm:columns-3 sm:gap-4 xl:columns-4'}`}>
      {photos.map((photo, index) => {
        const selected = selectedIds.includes(photo.id)
        const ratioClass = [
          'aspect-[0.82/1]',
          'aspect-[1.05/1]',
          'aspect-[0.94/1]',
          'aspect-[1.16/1]',
        ][index % 4]
        return (
          <article
            key={photo.id}
            className={`group relative ${compact ? 'mb-2 sm:mb-2' : 'mb-3 sm:mb-4'} break-inside-avoid border bg-[#fbf9f5] transition-all duration-200 ${
              selected ? 'border-[#a68c70] ring-1 ring-[#a68c70]' : 'border-[#302d29]/10 hover:border-[#c8b7a2]'
            }`}
          >
            <button
              type="button"
              onClick={() => selectionMode ? onToggleSelection(photo.id) : onOpen(photo.id)}
              className="block w-full text-left"
              aria-label={selectionMode ? `${selected ? 'Deselect' : 'Select'} ${photo.title}` : `Open ${photo.title}`}
            >
              <MemoryPhotoImage
                photo={photo}
                className={`w-full ${ratioClass}`}
                alt={photo.title}
              />
            </button>
            <div className="absolute left-2 top-2 flex gap-1.5">
              {selectionMode && (
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center bg-[#fbf9f5]/90 text-[#4c4338] shadow-sm"
                >
                  {selected ? <SquareCheck size={17} /> : <Square size={17} />}
                </span>
              )}
              {photo.category && (
                <span className="hidden bg-[#fbf9f5]/90 px-2 py-1.5 text-[0.55rem] uppercase tracking-[0.1em] text-[#6d6255] shadow-sm sm:inline">
                  {photo.category}
                </span>
              )}
            </div>
            <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button
                type="button"
                aria-label={`${photo.favorite ? 'Remove' : 'Add'} ${photo.title} ${photo.favorite ? 'from' : 'to'} favorites`}
                onClick={() => onToggleFavorite(photo.id)}
                className={`flex h-8 w-8 items-center justify-center bg-[#fbf9f5]/90 shadow-sm ${
                  photo.favorite ? 'text-[#9d6455]' : 'text-[#665d52]'
                }`}
              >
                <Heart size={16} fill={photo.favorite ? 'currentColor' : 'none'} />
              </button>
              {!selectionMode && (
                <button
                  type="button"
                  aria-label={`Edit ${photo.title}`}
                  onClick={() => onEdit(photo.id)}
                  className="flex h-8 w-8 items-center justify-center bg-[#fbf9f5]/90 text-[#665d52] shadow-sm"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
            <div className="px-3 py-2.5">
              <p className="truncate text-[0.76rem] font-semibold text-[#3e3933]">{photo.title}</p>
              <p className="mt-1 flex items-center justify-between gap-2 text-[0.62rem] text-[#91877b]">
                <span className="truncate">{photo.location || photo.date || 'A moment to remember'}</span>
                <span className="shrink-0">{photo.date ? new Date(`${photo.date}T12:00:00`).getFullYear() : ''}</span>
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
