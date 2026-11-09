import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, RotateCcw, Search, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'

type ConfirmAction = 'permanent' | 'empty' | null
type SortMode = 'newest' | 'oldest' | 'title'

export function RecentlyDeletedPage() {
  const { deletedPhotos, restorePhotos, permanentlyDeletePhotos, loading } = useMemory()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return deletedPhotos
      .filter(({ photo }) => !needle || `${photo.title} ${photo.caption} ${photo.location} ${photo.tags.join(' ')}`.toLocaleLowerCase().includes(needle))
      .sort((a, b) => sort === 'title'
        ? a.photo.title.localeCompare(b.photo.title)
        : sort === 'oldest'
          ? a.deletedAt.localeCompare(b.deletedAt)
          : b.deletedAt.localeCompare(a.deletedAt))
  }, [deletedPhotos, query, sort])

  async function restore(ids: string[]) {
    try {
      await restorePhotos(ids)
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)))
      showToast(`${ids.length} ${ids.length === 1 ? 'photograph was' : 'photographs were'} restored to My Memories.`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The photographs could not be restored.', 'error')
    }
  }

  async function permanentlyRemove() {
    const ids = confirmAction === 'empty'
      ? deletedPhotos.map((item) => item.id)
      : selectedIds.length ? selectedIds : filtered.map((item) => item.id)
    if (!ids.length) return
    setBusy(true)
    try {
      await permanentlyDeletePhotos(ids)
      setSelectedIds([])
      setConfirmAction(null)
      showToast(`${ids.length} ${ids.length === 1 ? 'photograph was' : 'photographs were'} permanently deleted.`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The photographs could not be permanently deleted.', 'error')
    } finally {
      setBusy(false)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id])
  }

  const deleteCount = confirmAction === 'empty'
    ? deletedPhotos.length
    : selectedIds.length || filtered.length

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-7 border-b border-[#302d29]/12 pb-6">
        <p className="eyebrow mb-2">A gentle pause before anything is gone</p>
        <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Recently Deleted</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#82796e]">
          Deleted photographs stay here until you restore them or permanently remove them. Albums and stories reconnect when a photograph is restored.
        </p>
      </header>

      <section className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-[#302d29]/10 py-3">
        <p className="text-[0.68rem] text-[#8b8175]"><span className="serif mr-1 text-xl text-[#302d29]">{deletedPhotos.length}</span> photographs in Recently Deleted</p>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <button type="button" className="auth-secondary min-h-9" onClick={() => void restore(selectedIds)}><RotateCcw size={14} /> Restore selected ({selectedIds.length})</button>
          )}
          {selectedIds.length > 0 && (
            <button type="button" className="auth-secondary min-h-9 text-[#805449]" onClick={() => setConfirmAction('permanent')}><Trash2 size={14} /> Delete selected</button>
          )}
          <button type="button" className="inline-flex min-h-9 items-center gap-2 border border-[#805449]/40 px-3 text-xs text-[#805449] hover:bg-[#f5e9e4] disabled:opacity-40" disabled={!deletedPhotos.length} onClick={() => setConfirmAction('empty')}>
            <Trash2 size={14} /> Empty Recently Deleted
          </button>
        </div>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8175]" />
          <input aria-label="Search deleted photographs" value={query} onChange={(event) => setQuery(event.target.value)} className="auth-input min-h-10 py-2 pl-9 text-xs" placeholder="Search title, caption, place or tag…" />
        </label>
        <label className="flex items-center gap-2 border border-[#302d29]/12 px-3">
          <ArrowDownWideNarrow size={14} className="text-[#8b8175]" />
          <select aria-label="Sort deleted photographs" value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="min-h-10 bg-transparent text-xs outline-none">
            <option value="newest">Recently deleted</option>
            <option value="oldest">Earliest deleted</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p role="status" className="py-16 text-center text-sm text-[#82796e]">Checking your local trash…</p>
      ) : filtered.length ? (
        <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ id, photo, deletedAt }) => (
            <article key={id} className="group border border-[#302d29]/10 bg-[#fbf9f5]">
              <div className="relative">
                <MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-[1.25] w-full" />
                <label className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center bg-[#fbf9f5]/90 shadow-sm" aria-label={`Select ${photo.title}`}>
                  <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelection(id)} className="accent-[#756149]" />
                </label>
              </div>
              <div className="p-3.5">
                <h2 className="serif truncate text-2xl">{photo.title}</h2>
                <p className="mt-1 line-clamp-2 min-h-8 text-[0.68rem] leading-5 text-[#82796e]">{photo.caption || photo.location || 'A photograph from your archive.'}</p>
                <p className="mt-2 text-[0.62rem] text-[#9a8f82]">Deleted {formatDate(deletedAt)}</p>
                <div className="mt-3 flex gap-2 border-t border-[#302d29]/10 pt-3">
                  <button type="button" className="auth-secondary min-h-9 flex-1" onClick={() => void restore([id])}><RotateCcw size={14} /> Restore</button>
                  <button type="button" aria-label={`Permanently delete ${photo.title}`} className="auth-secondary min-h-9 px-3 text-[#805449]" onClick={() => { setSelectedIds([id]); setConfirmAction('permanent') }}><Trash2 size={14} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : deletedPhotos.length ? (
        <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-5 py-14 text-center">
          <p className="serif text-3xl">No deleted photographs match.</p>
          <p className="mt-2 text-sm text-[#82796e]">Try another search phrase.</p>
        </div>
      ) : (
        <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-5 py-16 text-center">
          <RotateCcw size={28} className="mx-auto text-[#a68c70]" strokeWidth={1.4} />
          <p className="serif mt-3 text-3xl">Nothing has been set aside.</p>
          <p className="mt-2 text-sm text-[#82796e]">When you delete a photograph from your library, it will appear here first.</p>
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction === 'empty' ? 'Empty Recently Deleted?' : 'Permanently delete photographs?'}
          description={`This permanently removes ${deleteCount} ${deleteCount === 1 ? 'photograph and its stored image data' : 'photographs and their stored image data'}. Related album, story, and keepsake references will be safely cleared. This cannot be undone.`}
          confirmLabel="Delete permanently"
          busy={busy}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => void permanentlyRemove()}
        />
      )}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'date unavailable'
    : new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
}
