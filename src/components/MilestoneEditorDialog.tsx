import { useState, type FormEvent } from 'react'
import { useMemory } from '../data/useMemory'
import type { LifeMilestone } from '../data/memoryTypes'
import { MemoryDialog } from './MemoryDialog'

export function MilestoneEditorDialog({
  milestone,
  initialDate,
  onClose,
}: {
  milestone?: LifeMilestone
  initialDate?: string
  onClose: () => void
}) {
  const { photos, createMilestone, updateMilestone } = useMemory()
  const [title, setTitle] = useState(milestone?.title ?? '')
  const [date, setDate] = useState(milestone?.date ?? initialDate ?? '')
  const [description, setDescription] = useState(milestone?.description ?? '')
  const [photoId, setPhotoId] = useState(milestone?.photoId ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !date) {
      setError('Add a title and date for this milestone.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const details = {
        title: title.trim(),
        date,
        description: description.trim(),
        photoId: photoId || null,
      }
      if (milestone) await updateMilestone(milestone.id, details)
      else await createMilestone(details)
      onClose()
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'The milestone could not be saved.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <MemoryDialog
      title={milestone ? 'Remember this milestone' : 'Mark a meaningful day'}
      eyebrow="A chapter in your story"
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <div>
          <label htmlFor="milestone-title" className="mb-1.5 block text-xs font-semibold">
            Title
          </label>
          <input
            id="milestone-title"
            className="auth-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="A day that changed something"
            required
          />
        </div>
        <div>
          <label htmlFor="milestone-date" className="mb-1.5 block text-xs font-semibold">
            Date
          </label>
          <input
            id="milestone-date"
            type="date"
            className="auth-input"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="milestone-description" className="mb-1.5 block text-xs font-semibold">
            Description <span className="font-normal text-[#8b8175]">· optional</span>
          </label>
          <textarea
            id="milestone-description"
            className="auth-input min-h-24 resize-y"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1200}
            placeholder="Keep a few words about what made this moment yours."
          />
        </div>
        <div>
          <label htmlFor="milestone-photo" className="mb-1.5 block text-xs font-semibold">
            Photograph <span className="font-normal text-[#8b8175]">· optional</span>
          </label>
          <select
            id="milestone-photo"
            className="auth-input"
            value={photoId}
            onChange={(event) => setPhotoId(event.target.value)}
          >
            <option value="">No photograph</option>
            {photos.map((photo) => (
              <option key={photo.id} value={photo.id}>
                {photo.title}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="auth-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="auth-primary min-w-36" disabled={busy}>
            {busy ? 'Saving…' : milestone ? 'Save milestone' : 'Add to timeline'}
          </button>
        </div>
      </form>
    </MemoryDialog>
  )
}
