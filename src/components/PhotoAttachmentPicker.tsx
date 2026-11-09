import { useState } from 'react'
import { ImagePlus, Images } from 'lucide-react'
import { useMemory } from '../data/useMemory'
import { MemoryPhotoImage } from './MemoryPhotoImage'
import { PhotoUploadDialog } from './PhotoUploadDialog'

export function PhotoAttachmentPicker({
  photoIds,
  onChange,
}: {
  photoIds: string[]
  onChange: (photoIds: string[]) => void
}) {
  const { photos } = useMemory()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const selectedPhotos = photoIds
    .map((id) => photos.find((photo) => photo.id === id))
    .filter((photo) => photo !== undefined)
  const unavailableCount = photoIds.length - selectedPhotos.length

  function toggle(photoId: string) {
    onChange(
      photoIds.includes(photoId)
        ? photoIds.filter((id) => id !== photoId)
        : [...photoIds, photoId],
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">Photographs</p>
          <p className="mt-1 text-[0.65rem] text-[#8b8175]">Attach saved photographs; originals stay in My Memories.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="auth-secondary min-h-9 px-3" onClick={() => setPickerOpen((open) => !open)}>
            <Images size={14} /> {pickerOpen ? 'Done' : 'Choose photos'}
          </button>
          <button type="button" className="auth-secondary min-h-9 px-3" onClick={() => setUploadOpen(true)}>
            <ImagePlus size={14} /> Upload
          </button>
        </div>
      </div>

      {unavailableCount > 0 && (
        <div className="flex items-center justify-between gap-3 bg-[#f5e9e4] px-3 py-2 text-[0.68rem] text-[#714337]">
          <span>{unavailableCount} attached {unavailableCount === 1 ? 'photo is' : 'photos are'} no longer in My Memories.</span>
          <button
            type="button"
            className="shrink-0 underline underline-offset-2"
            onClick={() => onChange(selectedPhotos.map((photo) => photo.id))}
          >
            Remove missing
          </button>
        </div>
      )}

      {selectedPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {selectedPhotos.map((photo) => (
            <button key={photo.id} type="button" className="group min-w-0 text-left" onClick={() => toggle(photo.id)} title={`Remove ${photo.title}`}>
              <MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-square" />
              <span className="mt-1 block truncate text-[0.62rem] text-[#71685d]">{photo.title} · remove</span>
            </button>
          ))}
        </div>
      )}

      {pickerOpen && (
        <div className="max-h-64 overflow-y-auto border border-[#302d29]/10 bg-white/70 p-2">
          {photos.length ? (
            <div className="grid gap-1 sm:grid-cols-2">
              {photos.map((photo) => (
                <label key={photo.id} className="flex cursor-pointer items-center gap-2 p-2 hover:bg-[#eee8df]/70">
                  <input
                    type="checkbox"
                    checked={photoIds.includes(photo.id)}
                    onChange={() => toggle(photo.id)}
                    className="accent-[#805449]"
                  />
                  <MemoryPhotoImage photo={photo} alt="" className="h-10 w-12 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{photo.title}</span>
                    <span className="block truncate text-[0.6rem] text-[#8b8175]">{photo.date || 'Date not set'}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="p-3 text-xs text-[#82796e]">No photographs are saved yet. Upload one to add it here.</p>
          )}
        </div>
      )}

      {!photos.length && !photoIds.length && (
        <p className="text-[0.68rem] text-[#8b8175]">No photos attached yet.</p>
      )}
      {uploadOpen && <PhotoUploadDialog onClose={() => setUploadOpen(false)} />}
    </section>
  )
}
