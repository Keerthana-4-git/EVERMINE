import { useState, type FormEvent } from 'react'
import { useMemory } from '../data/useMemory'
import { photoCategories, type MemoryAlbum, type PhotoCategory } from '../data/memoryTypes'
import { MemoryPhotoImage } from './MemoryPhotoImage'
import { MemoryDialog } from './MemoryDialog'

export function AlbumEditorDialog({
  album,
  onClose,
  onSaved,
}: {
  album?: MemoryAlbum
  onClose: () => void
  onSaved?: (id: string) => void
}) {
  const { photos, createAlbum, updateAlbum } = useMemory()
  const [name, setName] = useState(album?.name ?? '')
  const [description, setDescription] = useState(album?.description ?? '')
  const [category, setCategory] = useState<PhotoCategory>(album?.category ?? 'Everyday Moments')
  const [photoIds, setPhotoIds] = useState<string[]>(album?.photoIds ?? [])
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(album?.coverPhotoId ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function togglePhoto(id: string) {
    const next = photoIds.includes(id)
      ? photoIds.filter((item) => item !== id)
      : [...photoIds, id]
    setPhotoIds(next)
    if (coverPhotoId === id && !next.includes(id)) {
      setCoverPhotoId(next[0] ?? null)
    } else if (!coverPhotoId && next.includes(id)) {
      setCoverPhotoId(id)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Give your album a name.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const details = {
        name: name.trim(),
        description: description.trim(),
        category,
        photoIds,
        coverPhotoId,
      }
      if (album) await updateAlbum(album.id, details)
      else await createAlbum(details)
      onSaved?.(album?.id ?? '')
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The album could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MemoryDialog
      title={album ? 'Shape your album' : 'Gather a few moments'}
      eyebrow={album ? 'Album details' : 'A new collection'}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_0.7fr]">
          <div>
            <label htmlFor="album-name" className="mb-1.5 block text-xs font-semibold">Album name</label>
            <input
              id="album-name"
              className="auth-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="A summer to remember"
              required
            />
          </div>
          <div>
            <label htmlFor="album-category" className="mb-1.5 block text-xs font-semibold">Category</label>
            <select
              id="album-category"
              className="auth-input"
              value={category}
              onChange={(event) => setCategory(event.target.value as PhotoCategory)}
            >
              {photoCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="album-description" className="mb-1.5 block text-xs font-semibold">A few words about it</label>
          <textarea
            id="album-description"
            className="auth-input min-h-20 resize-y"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            placeholder="What makes these moments belong together?"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold">Choose photographs <span className="font-normal text-[#8b8175]">· optional</span></p>
            <span className="text-[0.68rem] text-[#8b8175]">{photoIds.length} selected</span>
          </div>
          {photos.length === 0 ? (
            <div className="border border-dashed border-[#c8b7a2] bg-[#f7f3ed] p-5 text-center text-xs leading-5 text-[#82796e]">
              Your album can be ready now. Add photographs whenever you like.
            </div>
          ) : (
            <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <label className="relative block cursor-pointer">
                    <input
                      type="checkbox"
                      checked={photoIds.includes(photo.id)}
                      onChange={() => togglePhoto(photo.id)}
                      className="peer absolute left-2 top-2 z-10 h-4 w-4 accent-[#8e765d]"
                      aria-label={`Add ${photo.title} to album`}
                    />
                    <MemoryPhotoImage
                      photo={photo}
                      className="pointer-events-none aspect-square transition group-hover:opacity-80 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[#a68c70] peer-checked:ring-2 peer-checked:ring-[#a68c70]"
                    />
                    <span className="block truncate pt-1 text-[0.62rem] text-[#71685d]">{photo.title}</span>
                  </label>
                  {coverPhotoId === photo.id && photoIds.includes(photo.id) && (
                    <span className="pointer-events-none absolute left-1 top-1 bg-[#f8f5ef]/90 px-1.5 py-0.5 text-[0.52rem] uppercase tracking-wide text-[#6d5b44]">Cover</span>
                  )}
                  {photoIds.includes(photo.id) && (
                    <button
                      type="button"
                      onClick={() => setCoverPhotoId(photo.id)}
                      aria-label={`Set ${photo.title} as album cover`}
                      className="absolute bottom-5 right-1 bg-[#302d29]/80 px-1.5 py-1 text-[0.52rem] text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                    >
                      Set cover
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-[#302d29]/10 pt-4">
          <button type="button" className="auth-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="auth-primary min-w-36" disabled={busy}>
            {busy ? 'Saving…' : album ? 'Save album' : 'Create album'}
          </button>
        </div>
      </form>
    </MemoryDialog>
  )
}
