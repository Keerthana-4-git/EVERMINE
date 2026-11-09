import { useState } from 'react'
import { Aperture } from 'lucide-react'
import { useMemory } from '../data/useMemory'
import { useToast } from './useToast'
import { MemoryDialog } from './MemoryDialog'

export function AlbumPickerDialog({
  photoIds,
  onClose,
}: {
  photoIds: string[]
  onClose: () => void
}) {
  const { albums, updateAlbum } = useMemory()
  const { showToast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    albums.filter((album) => photoIds.some((id) => album.photoIds.includes(id))).map((album) => album.id),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function save() {
    setBusy(true)
    setError('')
    try {
      await Promise.all(
        albums
          .filter((album) => {
            const shouldContain = selectedIds.includes(album.id)
            const currentlyContainsAll = photoIds.every((id) => album.photoIds.includes(id))
            return shouldContain ? !currentlyContainsAll : photoIds.some((id) => album.photoIds.includes(id))
          })
          .map((album) => {
            const shouldContain = selectedIds.includes(album.id)
            const nextIds = shouldContain
              ? [...new Set([...album.photoIds, ...photoIds])]
              : album.photoIds.filter((id) => !photoIds.includes(id))
            const coverPhotoId =
              album.coverPhotoId && nextIds.includes(album.coverPhotoId)
                ? album.coverPhotoId
                : nextIds[0] ?? null
            return updateAlbum(album.id, {
              name: album.name,
              description: album.description,
              category: album.category,
              photoIds: nextIds,
              coverPhotoId,
            })
          }),
      )
      showToast('Album selections updated.')
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Album selections could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MemoryDialog title="Find a home for these" eyebrow="Add to albums" onClose={onClose}>
      {albums.length ? (
        <div className="divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
          {albums.map((album) => (
            <label key={album.id} className="flex cursor-pointer items-center gap-3 py-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(album.id)}
                onChange={() => toggle(album.id)}
                className="accent-[#8e765d]"
              />
              <span className="flex h-9 w-9 items-center justify-center bg-[#eee8df] text-[#816e56]">
                <Aperture size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{album.name}</span>
                <span className="mt-0.5 block text-[0.65rem] text-[#8b8175]">{album.photoIds.length} photographs · {album.category}</span>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[#c8b7a2] bg-[#f7f3ed] p-5 text-sm leading-6 text-[#71685d]">
          You do not have an album yet. Create one from My Albums, then return to add these photographs.
        </div>
      )}
      {error && <p className="auth-error mt-4" role="alert">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="auth-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="auth-primary min-w-32" onClick={() => void save()} disabled={busy || albums.length === 0}>
          {busy ? 'Saving…' : 'Save selections'}
        </button>
      </div>
    </MemoryDialog>
  )
}
