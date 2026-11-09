import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { ArrowUpFromLine, ImagePlus, Trash2 } from 'lucide-react'
import { useMemory } from '../data/useMemory'
import { photoCategories, type PhotoCategory } from '../data/memoryTypes'
import { MemoryDialog } from './MemoryDialog'
import { useObjectUrl } from './useObjectUrl'
import { useToast } from './useToast'

const maximumSize = 25 * 1024 * 1024
const acceptedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const acceptedExtensions = /\.(jpe?g|png|webp)$/i

type PendingPhoto = {
  id: string
  file: File
  title: string
  date: string
}

export function PhotoUploadDialog({ onClose }: { onClose: () => void }) {
  const { addPhoto } = useMemory()
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingPhoto[]>([])
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState<PhotoCategory | ''>('')
  const [tags, setTags] = useState('')
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  function addFiles(files: FileList | File[]) {
    const accepted: PendingPhoto[] = []
    const issues: string[] = []
    for (const file of Array.from(files)) {
      if (!acceptedMimeTypes.has(file.type) && !acceptedExtensions.test(file.name)) {
        issues.push(`${file.name}: choose a JPG, PNG, or WEBP image.`)
        continue
      }
      if (file.size > maximumSize) {
        issues.push(`${file.name}: maximum image size is 25 MB.`)
        continue
      }
      if (file.size === 0) {
        issues.push(`${file.name}: this image file is empty.`)
        continue
      }
      const baseName = file.name.replace(/\.[^.]+$/, '')
      accepted.push({
        id: crypto.randomUUID(),
        file,
        title: baseName.slice(0, 100),
        date: localDateFromTimestamp(file.lastModified),
      })
    }
    if (accepted.length) {
      setPending((current) => [...current, ...accepted])
      setError('')
    }
    if (issues.length) {
      const shown = issues.slice(0, 2).join(' ')
      const message = issues.length > 2 ? `${shown} And ${issues.length - 2} more.` : shown
      setError(message)
      showToast(message, 'error')
    }
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files)
    event.target.value = ''
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  function updatePending(id: string, patch: Partial<Pick<PendingPhoto, 'title' | 'date'>>) {
    setPending((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const invalid = pending.find((item) => !item.title.trim())
    if (!pending.length) {
      setError('Choose at least one photograph to add.')
      return
    }
    if (invalid) {
      setError('Every photograph needs a title.')
      return
    }
    setBusy(true)
    setProgress(0)
    setError('')
    let completed = 0
    try {
      for (const item of pending) {
        await verifyImage(item.file)
        const now = new Date().toISOString()
        await addPhoto({
          id: crypto.randomUUID(),
          fileName: item.file.name,
          mimeType: normalizedMimeType(item.file),
          blob: item.file,
          title: item.title.trim(),
          caption: caption.trim(),
          date: item.date,
          location: location.trim(),
          tags: [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))],
          category,
          favorite: false,
          createdAt: now,
          updatedAt: now,
        })
        completed += 1
        setProgress(Math.round((completed / pending.length) * 100))
      }
      showToast(`${completed} ${completed === 1 ? 'photograph' : 'photographs'} added to My Memories.`)
      onClose()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? `${reason.message} ${completed} of ${pending.length} saved before the error.`
          : `Upload stopped after ${completed} of ${pending.length} photographs.`,
      )
      showToast('Some photographs could not be saved.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MemoryDialog title="Bring a moment home" eyebrow="Add to My Memories" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-5">
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex min-h-36 flex-col items-center justify-center border border-dashed px-5 py-6 text-center transition ${
            dragging ? 'border-[#a68c70] bg-[#eee8df]' : 'border-[#c8b7a2] bg-[#f7f3ed]'
          }`}
        >
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#eae2d6] text-[#816e56]">
            <ImagePlus size={19} />
          </span>
          <p className="text-sm font-medium">Drop photographs here, or choose from your device</p>
          <p className="mt-1 text-[0.67rem] text-[#8b8175]">JPG, PNG or WEBP · Up to 25 MB each · Stored on this device</p>
          <button type="button" className="auth-secondary mt-3 min-h-9" onClick={() => inputRef.current?.click()}>
            <ArrowUpFromLine size={14} /> Choose photographs
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={onInput}
          />
        </div>

        {pending.length > 0 && (
          <section aria-label="Photograph previews">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold">{pending.length} ready to add</p>
              <button
                type="button"
                onClick={() => setPending([])}
                className="text-[0.66rem] text-[#8b8175] underline underline-offset-2 hover:text-[#302d29]"
              >
                Clear all
              </button>
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {pending.map((item) => (
                <PendingPhotoRow
                  key={item.id}
                  item={item}
                  onChange={updatePending}
                  onRemove={() => setPending((current) => current.filter((entry) => entry.id !== item.id))}
                  disabled={busy}
                />
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="upload-caption" className="mb-1.5 block text-xs font-semibold">Caption <span className="font-normal text-[#8b8175]">· applied to all</span></label>
            <input id="upload-caption" className="auth-input" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={1000} placeholder="A small detail worth keeping…" />
          </div>
          <div>
            <label htmlFor="upload-location" className="mb-1.5 block text-xs font-semibold">Location <span className="font-normal text-[#8b8175]">· applied to all</span></label>
            <input id="upload-location" className="auth-input" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={100} placeholder="Where was this?" />
          </div>
          <div>
            <label htmlFor="upload-category" className="mb-1.5 block text-xs font-semibold">Category <span className="font-normal text-[#8b8175]">· applied to all</span></label>
            <select id="upload-category" className="auth-input" value={category} onChange={(event) => setCategory(event.target.value as PhotoCategory | '')}>
              <option value="">No category</option>
              {photoCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="upload-tags" className="mb-1.5 block text-xs font-semibold">Tags <span className="font-normal text-[#8b8175]">· applied to all</span></label>
            <input id="upload-tags" className="auth-input" value={tags} onChange={(event) => setTags(event.target.value)} maxLength={300} placeholder="home, summer, 2025" />
          </div>
        </div>
        {busy && (
          <div aria-live="polite">
            <div className="mb-1 flex justify-between text-[0.66rem] text-[#71685d]">
              <span>Saving photographs to this device…</span><span>{progress}%</span>
            </div>
            <div className="h-1 bg-[#e5ddd1]"><div className="h-full bg-[#a68c70] transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-[#302d29]/10 pt-4">
          <button type="button" className="auth-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="auth-primary min-w-36" disabled={busy || pending.length === 0}>
            {busy ? `Saving ${progress}%…` : `Add ${pending.length || ''} ${pending.length === 1 ? 'photograph' : 'photographs'}`}
          </button>
        </div>
      </form>
    </MemoryDialog>
  )
}

function PendingPhotoRow({
  item,
  onChange,
  onRemove,
  disabled,
}: {
  item: PendingPhoto
  onChange: (id: string, patch: Partial<Pick<PendingPhoto, 'title' | 'date'>>) => void
  onRemove: () => void
  disabled: boolean
}) {
  const url = useObjectUrl(item.file)
  return (
    <div className="flex items-center gap-3 border border-[#302d29]/10 bg-white/70 p-2">
      {url ? (
        <img src={url} alt="" className="h-12 w-14 shrink-0 object-cover" />
      ) : (
        <span className="flex h-12 w-14 shrink-0 items-center justify-center bg-[#eae2d6] text-[#8b8175]"><ImagePlus size={17} /></span>
      )}
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_9rem]">
        <input aria-label={`Title for ${item.file.name}`} className="auth-input py-2 text-xs" value={item.title} onChange={(event) => onChange(item.id, { title: event.target.value })} maxLength={100} required />
        <input aria-label={`Date for ${item.file.name}`} type="date" className="auth-input py-2 text-xs" value={item.date} onChange={(event) => onChange(item.id, { date: event.target.value })} />
      </div>
      <span className="hidden text-[0.6rem] text-[#948a7e] sm:inline">{formatFileSize(item.file.size)}</span>
      <button type="button" aria-label={`Remove ${item.file.name}`} onClick={onRemove} disabled={disabled} className="flex h-8 w-8 shrink-0 items-center justify-center text-[#8b8175] hover:bg-[#eee8df] hover:text-[#805449]">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function localDateFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function normalizedMimeType(file: File): string {
  if (acceptedMimeTypes.has(file.type)) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'
}

async function verifyImage(file: File): Promise<void> {
  try {
    if ('createImageBitmap' in window) {
      const bitmap = await createImageBitmap(file)
      bitmap.close()
      return
    }
    const url = URL.createObjectURL(file)
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve()
        image.onerror = () => reject(new Error(`${file.name} is not a readable image.`))
        image.src = url
      })
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch {
    throw new Error(`${file.name} is not a readable image. Choose a valid JPG, PNG, or WEBP file.`)
  }
}
