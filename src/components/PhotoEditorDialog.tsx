import { useState, type FormEvent } from 'react'
import { useMemory } from '../data/useMemory'
import { photoCategories, type MemoryPhoto, type PhotoCategory } from '../data/memoryTypes'
import { useToast } from './useToast'
import { MemoryDialog } from './MemoryDialog'

export function PhotoEditorDialog({
  photo,
  onClose,
}: {
  photo: MemoryPhoto
  onClose: () => void
}) {
  const { updatePhoto } = useMemory()
  const { showToast } = useToast()
  const [title, setTitle] = useState(photo.title)
  const [caption, setCaption] = useState(photo.caption)
  const [date, setDate] = useState(photo.date)
  const [location, setLocation] = useState(photo.location)
  const [tags, setTags] = useState(photo.tags.join(', '))
  const [category, setCategory] = useState<PhotoCategory | ''>(photo.category)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Give this photograph a title before saving.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await updatePhoto(photo.id, {
        title: title.trim(),
        caption: caption.trim(),
        date,
        location: location.trim(),
        tags: [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))],
        category,
      })
      showToast('Photograph details saved.')
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The photograph could not be updated.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MemoryDialog title="Edit the details" eyebrow="Every picture has a story" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label htmlFor="photo-title" className="mb-1.5 block text-xs font-semibold">
            Title
          </label>
          <input
            id="photo-title"
            className="auth-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div>
          <label htmlFor="photo-caption" className="mb-1.5 block text-xs font-semibold">
            Caption
          </label>
          <textarea
            id="photo-caption"
            className="auth-input min-h-24 resize-y"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={1000}
            placeholder="What do you want to remember about this moment?"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="photo-date" className="mb-1.5 block text-xs font-semibold">
              Date
            </label>
            <input
              id="photo-date"
              type="date"
              className="auth-input"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="photo-location" className="mb-1.5 block text-xs font-semibold">
              Location
            </label>
            <input
              id="photo-location"
              className="auth-input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={100}
              placeholder="A place worth remembering"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="photo-category" className="mb-1.5 block text-xs font-semibold">
              Category
            </label>
            <select
              id="photo-category"
              className="auth-input"
              value={category}
              onChange={(event) => setCategory(event.target.value as PhotoCategory | '')}
            >
              <option value="">No category</option>
              {photoCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="photo-tags" className="mb-1.5 block text-xs font-semibold">
              Tags <span className="font-normal text-[#8b8175]">· comma separated</span>
            </label>
            <input
              id="photo-tags"
              className="auth-input"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              maxLength={300}
              placeholder="summer, home, 2024"
            />
          </div>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="auth-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="auth-primary min-w-32" disabled={busy}>
            {busy ? 'Saving…' : 'Save details'}
          </button>
        </div>
      </form>
    </MemoryDialog>
  )
}
