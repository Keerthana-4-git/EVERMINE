import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Heart,
  ImagePlus,
  LayoutGrid,
  Maximize2,
  MonitorPlay,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ConfirmDialog, MemoryDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import type {
  MemoryWallBackground,
  MemoryWallLayout,
  MemoryWallLayoutDetails,
  MemoryWallTile,
} from '../data/memoryTypes'

const layouts = [
  'Editorial Grid',
  'Masonry Wall',
  'Film Strip',
  'Minimal Collage',
  'Family Memories',
] as const

const backgrounds: { value: MemoryWallBackground; label: string; className: string }[] = [
  { value: 'ivory', label: 'Soft ivory', className: 'bg-[#f3eee6]' },
  { value: 'sand', label: 'Warm sand', className: 'bg-[#e2d4c2]' },
  { value: 'sage', label: 'Quiet sage', className: 'bg-[#dce1d7]' },
  { value: 'charcoal', label: 'Evening charcoal', className: 'bg-[#393630]' },
]

export function MemoryWallPage() {
  const { loading } = useMemory()
  if (loading) {
    return <p role="status" className="py-16 text-center text-sm text-[#82796e]">Gathering your photographs…</p>
  }
  return <MemoryWallEditor />
}

function MemoryWallEditor() {
  const { photos, memoryWalls, loading, saveMemoryWall, deleteMemoryWall, toggleFavorite } = useMemory()
  const { showToast } = useToast()
  const [name, setName] = useState(() => memoryWalls[0]?.name ?? 'My Memory Wall')
  const [layout, setLayout] = useState<MemoryWallLayout['layout']>(() => memoryWalls[0]?.layout ?? 'Editorial Grid')
  const [background, setBackground] = useState<MemoryWallBackground>(() => memoryWalls[0]?.background ?? 'ivory')
  const [tiles, setTiles] = useState<MemoryWallTile[]>(() =>
    memoryWalls[0]?.tiles ??
    photos.map((photo) => ({ photoId: photo.id, size: 'regular', caption: '' })),
  )
  const [selectedWallId, setSelectedWallId] = useState(() => memoryWalls[0]?.id ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MemoryWallLayout | null>(null)
  const visibleTiles = useMemo(
    () => tiles.filter((tile) => photos.some((photo) => photo.id === tile.photoId)),
    [photos, tiles],
  )
  const activePhoto = viewerId ? photos.find((photo) => photo.id === viewerId) : undefined
  const boardColor = backgrounds.find((item) => item.value === background)?.className ?? 'bg-[#f3eee6]'

  function loadWall(wall: MemoryWallLayout) {
    setSelectedWallId(wall.id)
    setName(wall.name)
    setLayout(wall.layout)
    setBackground(wall.background)
    setTiles(wall.tiles)
    setPreview(false)
  }

  function startNewArrangement() {
    setSelectedWallId('')
    setName(`Memory Wall ${memoryWalls.length + 1}`)
    setLayout('Editorial Grid')
    setBackground('ivory')
    setPreview(false)
  }

  function togglePhoto(photoId: string) {
    setTiles((current) =>
      current.some((tile) => tile.photoId === photoId)
        ? current.filter((tile) => tile.photoId !== photoId)
        : [...current, { photoId, size: 'regular', caption: '' }],
    )
  }

  function reorderTile(targetId: string) {
    if (!draggedPhotoId || draggedPhotoId === targetId) return
    setTiles((current) => {
      const sourceIndex = current.findIndex((tile) => tile.photoId === draggedPhotoId)
      const targetIndex = current.findIndex((tile) => tile.photoId === targetId)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const next = [...current]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setDraggedPhotoId(null)
  }

  function moveTile(photoId: string, direction: -1 | 1) {
    setTiles((current) => {
      const index = current.findIndex((tile) => tile.photoId === photoId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  function updateTile(photoId: string, change: Partial<MemoryWallTile>) {
    setTiles((current) =>
      current.map((tile) => tile.photoId === photoId ? { ...tile, ...change } : tile),
    )
  }

  async function saveWall() {
    const details: MemoryWallLayoutDetails = { name, layout, background, tiles }
    try {
      const id = await saveMemoryWall(details, selectedWallId || undefined)
      setSelectedWallId(id)
      showToast('Your memory wall arrangement is saved on this device.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The memory wall could not be saved.', 'error')
    }
  }

  async function removeWall() {
    if (!deleteTarget) return
    try {
      await deleteMemoryWall(deleteTarget.id)
      if (selectedWallId === deleteTarget.id) startNewArrangement()
      showToast('Saved wall arrangement deleted.')
      setDeleteTarget(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The saved wall could not be deleted.', 'error')
    }
  }

  const layoutClass = layout === 'Film Strip'
    ? 'flex min-h-[15rem] items-start gap-4 overflow-x-auto pb-5'
    : layout === 'Masonry Wall'
      ? 'columns-2 gap-3 sm:columns-3 lg:columns-4'
      : layout === 'Family Memories'
        ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-3'
        : 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4'

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#302d29]/12 pb-6">
        <div>
          <p className="eyebrow mb-2">A composition of moments, arranged by you</p>
          <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">My Memory Wall</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#82796e]">
            Gather photographs from your library, shape the room around them, and keep more than one arrangement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="auth-secondary" onClick={() => setPreview((value) => !value)}>
            <MonitorPlay size={15} /> {preview ? 'Return to editing' : 'Preview wall'}
          </button>
          <button type="button" className="auth-primary" onClick={() => void saveWall()} disabled={!tiles.length}>
            <Save size={15} /> Save arrangement
          </button>
        </div>
      </header>

      <div className="mb-7 grid gap-6 lg:grid-cols-[17rem_1fr]">
        {!preview && (
          <aside className="space-y-5 border-y border-[#302d29]/10 py-5 lg:border-y-0 lg:border-r lg:pr-6">
            <label className="block text-xs font-semibold text-[#574f45]">
              Saved arrangements
              <select
                aria-label="Restore a saved wall arrangement"
                value={selectedWallId}
                onChange={(event) => {
                  const wall = memoryWalls.find((item) => item.id === event.target.value)
                  if (wall) loadWall(wall)
                }}
                className="auth-input mt-2 min-h-10 py-2 text-xs"
              >
                <option value="">New arrangement</option>
                {memoryWalls.map((wall) => <option key={wall.id} value={wall.id}>{wall.name}</option>)}
              </select>
            </label>
            <div className="flex gap-2">
              <button type="button" className="auth-secondary min-h-9 flex-1" onClick={startNewArrangement}>
                <Plus size={14} /> New wall
              </button>
              {selectedWallId && (
                <button type="button" aria-label="Delete saved arrangement" className="auth-secondary min-h-9 px-3 text-[#805449]" onClick={() => setDeleteTarget(memoryWalls.find((wall) => wall.id === selectedWallId) ?? null)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <label className="block text-xs font-semibold text-[#574f45]">
              Arrangement name
              <input value={name} onChange={(event) => setName(event.target.value)} className="auth-input mt-2 min-h-10 py-2 text-xs" maxLength={70} />
            </label>

            <fieldset>
              <legend className="text-xs font-semibold text-[#574f45]">Choose a layout</legend>
              <div className="mt-2 grid gap-1">
                {layouts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={layout === item}
                    onClick={() => setLayout(item)}
                    className={`flex min-h-9 items-center justify-between border px-3 text-left text-xs ${layout === item ? 'border-[#a68c70] bg-[#eee8df]' : 'border-transparent hover:bg-[#f3eee6]'}`}
                  >
                    {item}{layout === item && <Check size={14} />}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-semibold text-[#574f45]">Wall background</legend>
              <div className="mt-2 flex gap-2">
                {backgrounds.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-label={item.label}
                    aria-pressed={background === item.value}
                    onClick={() => setBackground(item.value)}
                    className={`h-8 w-8 rounded-full border ${item.className} ${background === item.value ? 'border-[#6c5943] ring-2 ring-[#a68c70] ring-offset-2' : 'border-[#302d29]/20'}`}
                  />
                ))}
              </div>
            </fieldset>

            <div className="border-t border-[#302d29]/10 pt-4">
              <button type="button" className="auth-secondary min-h-9 w-full" onClick={() => setPickerOpen((value) => !value)}>
                <ImagePlus size={14} /> {pickerOpen ? 'Close photo library' : 'Add or remove photographs'}
              </button>
              {pickerOpen && (
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  {photos.map((photo) => {
                    const selected = tiles.some((tile) => tile.photoId === photo.id)
                    return (
                      <button key={photo.id} type="button" onClick={() => togglePhoto(photo.id)} className={`flex w-full items-center gap-2 border p-1.5 text-left ${selected ? 'border-[#a68c70] bg-[#f3eee6]' : 'border-transparent hover:bg-[#f3eee6]'}`}>
                        <MemoryPhotoImage photo={photo} alt="" className="h-12 w-12 shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-[0.68rem]">{photo.title}</span>
                        {selected ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                    )
                  })}
                  {!photos.length && <p className="py-3 text-xs leading-5 text-[#82796e]">Upload photographs to My Memories before building a wall.</p>}
                </div>
              )}
            </div>
            <p className="text-[0.65rem] leading-5 text-[#8b8175]">Drag tiles to arrange them. Size and captions are saved with each arrangement.</p>
          </aside>
        )}

        <section className={`min-w-0 p-4 sm:p-6 ${boardColor} ${background === 'charcoal' ? 'text-[#f6f1e9]' : 'text-[#302d29]'}`}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={`eyebrow mb-1 ${background === 'charcoal' ? 'text-[#d3c4b1]' : ''}`}>{layout}</p>
              <h2 className="serif text-3xl">{name || 'Untitled wall'}</h2>
            </div>
            <span className="text-[0.65rem] opacity-70">{visibleTiles.length} photographs</span>
          </div>
          {loading ? (
            <p role="status" className="py-14 text-center text-sm opacity-70">Gathering your photographs…</p>
          ) : visibleTiles.length ? (
            <div className={layoutClass}>
              {visibleTiles.map((tile, index) => {
                const photo = photos.find((item) => item.id === tile.photoId)
                if (!photo) return null
                const featured = tile.size === 'featured'
                const tileClass = layout === 'Film Strip'
                  ? 'w-[min(68vw,15rem)] shrink-0'
                  : layout === 'Masonry Wall'
                    ? 'mb-3 break-inside-avoid'
                    : `${featured ? 'sm:col-span-2 sm:row-span-2' : ''} ${layout === 'Minimal Collage' && index % 3 === 1 ? 'sm:translate-y-5' : ''}`
                return (
                  <article
                    key={photo.id}
                    draggable={!preview}
                    onDragStart={() => setDraggedPhotoId(photo.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => reorderTile(photo.id)}
                    onDragEnd={() => setDraggedPhotoId(null)}
                    className={`group relative border border-[#302d29]/10 bg-[#fbf9f5] ${tileClass}`}
                  >
                    <button type="button" className="block w-full text-left" aria-label={`Open ${photo.title}`} onClick={() => setViewerId(photo.id)}>
                      <MemoryPhotoImage photo={photo} alt={photo.title} className={`w-full ${featured ? 'aspect-[1.4/1]' : layout === 'Film Strip' ? 'aspect-[0.9/1]' : 'aspect-[1.08/1]'}`} />
                    </button>
                    {!preview && (
                      <div className="absolute right-2 top-2 flex gap-1">
                        <button type="button" aria-label={`${photo.favorite ? 'Remove' : 'Add'} favorite`} className="flex h-8 w-8 items-center justify-center bg-[#fbf9f5]/90 text-[#805449]" onClick={() => void toggleFavorite(photo.id).catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Favorite could not be updated.', 'error'))}>
                          <Heart size={15} fill={photo.favorite ? 'currentColor' : 'none'} />
                        </button>
                        <button type="button" aria-label={featured ? 'Make tile regular size' : 'Make tile featured'} className="flex h-8 w-8 items-center justify-center bg-[#fbf9f5]/90 text-[#514a40]" onClick={() => updateTile(photo.id, { size: featured ? 'regular' : 'featured' })}>
                          <Maximize2 size={14} />
                        </button>
                      </div>
                    )}
                    <div className="px-3 py-2.5 text-[#3e3933]">
                      <p className="truncate text-[0.72rem] font-semibold">{photo.title}</p>
                      {preview ? (
                        tile.caption && <p className="mt-1 text-[0.65rem] leading-5 text-[#82796e]">{tile.caption}</p>
                      ) : tiles.length ? (
                        <div className={`flex min-h-64 flex-col items-center justify-center border border-dashed border-current/20 px-6 text-center ${background === 'charcoal' ? 'text-[#f6f1e9]' : 'text-[#71685d]'}`}>
                          <LayoutGrid size={30} strokeWidth={1.2} />
                          <p className="serif mt-3 text-3xl">Some wall photographs are in Recently Deleted.</p>
                          <p className="mt-2 max-w-sm text-xs leading-5 opacity-75">Restore a photograph to bring its tile back. The saved arrangement is still here.</p>
                          <Link to="/recently-deleted" className="auth-secondary mt-4">Visit Recently Deleted</Link>
                        </div>
                      ) : (
                        <input aria-label={`Caption for ${photo.title}`} value={tile.caption} onChange={(event) => updateTile(photo.id, { caption: event.target.value })} placeholder={photo.caption || 'Add a wall caption'} maxLength={140} className="mt-1 w-full border-0 bg-transparent text-[0.65rem] text-[#82796e] outline-none placeholder:text-[#aaa197]" />
                      )}
                    </div>
                    {!preview && (
                      <div className="flex items-center justify-between border-t border-[#302d29]/8 px-2 py-1">
                        <button type="button" aria-label="Move photograph earlier" className="p-1 text-[#82796e] disabled:opacity-30" disabled={index === 0} onClick={() => moveTile(photo.id, -1)}><ArrowUp size={13} /></button>
                        <button type="button" aria-label="Move photograph later" className="p-1 text-[#82796e] disabled:opacity-30" disabled={index === visibleTiles.length - 1} onClick={() => moveTile(photo.id, 1)}><ArrowDown size={13} /></button>
                        <button type="button" aria-label={`Remove ${photo.title} from wall`} className="p-1 text-[#805449]" onClick={() => togglePhoto(photo.id)}><X size={13} /></button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className={`flex min-h-64 flex-col items-center justify-center border border-dashed border-current/20 px-6 text-center ${background === 'charcoal' ? 'text-[#f6f1e9]' : 'text-[#71685d]'}`}>
              <LayoutGrid size={30} strokeWidth={1.2} />
              <p className="serif mt-3 text-3xl">A wall waiting for its first moment.</p>
              <p className="mt-2 max-w-sm text-xs leading-5 opacity-75">Choose photographs from your library to begin arranging a personal gallery.</p>
              {!preview && <button type="button" className="auth-secondary mt-4" onClick={() => setPickerOpen(true)}><ImagePlus size={14} /> Choose photographs</button>}
            </div>
          )}
        </section>
      </div>

      {activePhoto && (
        <MemoryDialog title={activePhoto.title} eyebrow="A moment on your wall" onClose={() => setViewerId(null)}>
          <MemoryPhotoImage photo={activePhoto} alt={activePhoto.title} className="aspect-[1.2] w-full" />
          {activePhoto.caption && <p className="mt-4 text-sm leading-6 text-[#71685d]">{activePhoto.caption}</p>}
          <p className="mt-2 text-xs text-[#8b8175]">{[activePhoto.date, activePhoto.location].filter(Boolean).join(' · ') || 'A photograph from your archive.'}</p>
        </MemoryDialog>
      )}
      {deleteTarget && <ConfirmDialog title={`Delete “${deleteTarget.name}”?`} description="This removes the saved wall arrangement only. The original photographs remain in My Memories." confirmLabel="Delete arrangement" onCancel={() => setDeleteTarget(null)} onConfirm={() => void removeWall()} />}
    </div>
  )
}
