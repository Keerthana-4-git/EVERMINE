import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  ImagePlus,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog, MemoryDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { PhotoViewer } from '../components/PhotoViewer'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import { type MemoryPhoto, type SharedAlbum, type SharedAlbumDetails, type SharedAlbumPermission, type SharedCollaborator } from '../data/memoryTypes'

const permissionDescriptions: Record<SharedAlbumPermission, string> = {
  viewer: 'Can view photographs.',
  contributor: 'Can view and add photographs.',
  editor: 'Can manage album content.',
}

export function SharedAlbumsPage() {
  const { sharedAlbumId } = useParams()
  const { sharedAlbums, loading } = useMemory()
  const album = sharedAlbums.find((item) => item.id === sharedAlbumId)
  if (sharedAlbumId) {
    if (loading) return <PageStatus>Opening your shared album…</PageStatus>
    return album ? <SharedAlbumDetail key={album.id} album={album} /> : <NotFound />
  }
  return <SharedAlbumsLibrary />
}

function SharedAlbumsLibrary() {
  const { sharedAlbums, photos, loading } = useMemory()
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editAlbum, setEditAlbum] = useState<SharedAlbum | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SharedAlbum | null>(null)
  const [busy, setBusy] = useState(false)
  const { deleteSharedAlbum } = useMemory()
  const { showToast } = useToast()
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return sharedAlbums.filter((album) =>
      !needle || `${album.name} ${album.description}`.toLowerCase().includes(needle),
    )
  }, [query, sharedAlbums])

  async function remove() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteSharedAlbum(deleteTarget.id)
      showToast(`“${deleteTarget.name}” was removed. Its original photographs remain in My Memories.`)
      setDeleteTarget(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The shared album could not be deleted.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-8 grid gap-6 border-b border-[#302d29]/12 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow mb-2">A small circle, a shared collection</p>
          <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Shared Albums</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#82796e]">Gather photographs and prepare collaborator invitations. This is a local demonstration: invitations are not emailed and changes do not synchronize to other people or devices.</p>
        </div>
        <button type="button" className="auth-primary w-fit" onClick={() => setCreateOpen(true)}><Plus size={16} /> Create a shared album</button>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.68rem] text-[#8b8175]"><span className="serif mr-1 text-xl text-[#302d29]">{sharedAlbums.length}</span> local collections</p>
        <label className="flex min-w-56 items-center gap-2 border-b border-[#302d29]/20 px-1 py-2"><Search size={14} className="text-[#8b8175]" /><input aria-label="Search shared albums" className="w-full border-0 bg-transparent text-xs outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a shared album…" /></label>
      </div>
      {loading ? <PageStatus>Gathering shared albums…</PageStatus> : filtered.length ? (
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((album, index) => {
            const cover = album.photoIds.map((id) => photos.find((photo) => photo.id === id)).find((photo) => photo !== undefined)
            return (
              <article key={album.id} className={`group ${index % 3 === 1 ? 'sm:mt-7' : ''}`}>
                <Link to={`/shared-albums/${album.id}`} className="block">
                  <div className="relative aspect-[1.35] overflow-hidden border border-[#302d29]/10 bg-[#eae2d6]">
                    {cover ? <MemoryPhotoImage photo={cover} alt={`Cover of ${album.name}`} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.025]" /> : <div className="flex h-full flex-col items-center justify-center text-[#8b7861]"><UsersRound size={30} strokeWidth={1.2} /><span className="mt-2 text-[0.62rem]">A collection waiting for photographs</span></div>}
                    <span className="absolute bottom-3 left-3 bg-[#f8f5ef]/90 px-2 py-1 text-[0.56rem] uppercase tracking-[0.12em]">{album.collaborators.filter((item) => item.status === 'accepted').length} collaborators · local demo</span>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="serif truncate text-2xl">{album.name}</h2><p className="mt-1 line-clamp-2 min-h-9 text-xs leading-5 text-[#82796e]">{album.description || 'A shared collection, arranged by you.'}</p></div><ArrowRight size={16} className="mt-1 shrink-0 text-[#8b7861]" /></div>
                  <p className="mt-3 border-t border-[#302d29]/10 pt-2 text-[0.62rem] text-[#8b8175]">{album.photoIds.length} photographs · updated {formatDate(album.updatedAt.slice(0, 10))}</p>
                </Link>
                <div className="mt-2 flex gap-2"><button type="button" className="text-[0.62rem] text-[#8b7861]" onClick={() => setEditAlbum(album)}><Pencil size={12} className="mr-1 inline" />Edit</button><button type="button" className="text-[0.62rem] text-[#805449]" onClick={() => setDeleteTarget(album)}><Trash2 size={12} className="mr-1 inline" />Delete</button></div>
              </article>
            )
          })}
        </div>
      ) : sharedAlbums.length ? (
        <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-5 py-14 text-center"><p className="serif text-3xl">No shared albums found.</p><p className="mt-2 text-sm text-[#82796e]">Try a different search.</p></div>
      ) : (
        <div className="grid border border-dashed border-[#c8b7a2] bg-[#fbf9f5] md:grid-cols-[1fr_0.8fr]"><div className="flex min-h-64 flex-col justify-center px-7 py-9 sm:px-12"><p className="eyebrow mb-3">A place for your circle</p><h2 className="serif text-4xl leading-tight">Keep a collection close, together.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#82796e]">Create a local shared-album preview, gather photographs, and explore how permissions and invitations could feel.</p><button type="button" className="auth-primary mt-6 w-fit" onClick={() => setCreateOpen(true)}><Plus size={15} /> Create your first shared album</button></div><div className="flex min-h-48 items-center justify-center bg-[#eae2d6] text-[#8a765e]"><UsersRound size={42} strokeWidth={1} /></div></div>
      )}
      {createOpen && <SharedAlbumEditor onClose={() => setCreateOpen(false)} />}
      {editAlbum && <SharedAlbumEditor album={editAlbum} onClose={() => setEditAlbum(null)} />}
      {deleteTarget && <ConfirmDialog title={`Delete “${deleteTarget.name}”?`} description="The shared album, local invitations, comments and activity will be removed. Original photographs stay in My Memories." confirmLabel="Delete shared album" busy={busy} onCancel={() => setDeleteTarget(null)} onConfirm={() => void remove()} />}
    </div>
  )

}

function SharedAlbumEditor({ album, onClose }: { album?: SharedAlbum; onClose: () => void }) {
  const { photos, createSharedAlbum, updateSharedAlbum } = useMemory()
  const { showToast } = useToast()
  const [name, setName] = useState(album?.name ?? '')
  const [description, setDescription] = useState(album?.description ?? '')
  const [photoIds, setPhotoIds] = useState(album?.photoIds ?? [])
  const [coverPhotoId, setCoverPhotoId] = useState(album?.coverPhotoId ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function togglePhoto(id: string) {
    const next = photoIds.includes(id) ? photoIds.filter((item) => item !== id) : [...photoIds, id]
    setPhotoIds(next)
    if (!next.includes(coverPhotoId)) setCoverPhotoId(next[0] ?? '')
    else if (!coverPhotoId && next.includes(id)) setCoverPhotoId(id)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) { setError('Give this shared album a name.'); return }
    setBusy(true)
    setError('')
    try {
      const details: SharedAlbumDetails = { name: name.trim(), description: description.trim(), photoIds, coverPhotoId: coverPhotoId || null }
      if (album) await updateSharedAlbum(album.id, details)
      else await createSharedAlbum(details)
      showToast(album ? 'Shared album updated.' : 'Shared album created on this device.')
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The shared album could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return <MemoryDialog title={album ? 'Edit shared album' : 'Create a shared album'} eyebrow="A collection for your circle" onClose={onClose} wide>
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <label className="block text-xs font-semibold">Album name<input aria-label="Shared album name" className="auth-input mt-1.5" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="A summer, together" /></label>
      <label className="block text-xs font-semibold">Description<textarea aria-label="Shared album description" className="auth-input mt-1.5 min-h-20 resize-y" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What makes these moments belong together?" /></label>
      <div><p className="mb-2 text-xs font-semibold">Photographs from My Memories <span className="font-normal text-[#8b8175]">· originals stay in your library</span></p>{photos.length ? <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">{photos.map((photo) => <label key={photo.id} className={`cursor-pointer border p-1.5 ${photoIds.includes(photo.id) ? 'border-[#805449] bg-[#eee8df]' : 'border-transparent bg-white/70'}`}><input className="sr-only" type="checkbox" aria-label={`Add ${photo.title} to shared album`} checked={photoIds.includes(photo.id)} onChange={() => togglePhoto(photo.id)} /><MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-square" /><span className="mt-1 block truncate text-[0.6rem]">{photo.title}</span><span className="block text-[0.53rem] uppercase tracking-wide text-[#8b7861]">{coverPhotoId === photo.id ? 'Cover' : photoIds.includes(photo.id) ? <button type="button" className="underline" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setCoverPhotoId(photo.id) }}>Set cover</button> : 'Select'}</span></label>)}</div> : <p className="border border-dashed border-[#c8b7a2] p-5 text-xs text-[#82796e]">Your photo library is empty. You can create this album now and add photographs later.</p>}</div>
      {error && <p role="alert" className="auth-error">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-[#302d29]/10 pt-4"><button type="button" className="auth-secondary" onClick={onClose}>Cancel</button><button type="submit" className="auth-primary min-w-32" disabled={busy}>{busy ? 'Saving…' : album ? 'Save changes' : 'Create album'}</button></div>
    </form>
  </MemoryDialog>
}

function SharedAlbumDetail({ album }: { album: SharedAlbum }) {
  const { photos, updateSharedAlbum, inviteCollaborator, cancelInvitation, simulateInvitationAcceptance, updateCollaboratorPermission, removeCollaborator, addSharedAlbumComment, toggleSharedAlbumReaction } = useMemory()
  const { showToast } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermission, setInvitePermission] = useState<SharedAlbumPermission>('viewer')
  const [invitePreview, setInvitePreview] = useState(false)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [confirmCollaborator, setConfirmCollaborator] = useState<SharedCollaborator | null>(null)
  const [busy, setBusy] = useState(false)
  const availablePhotos = album.photoIds.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is MemoryPhoto => photo !== undefined)
  const needle = query.trim().toLowerCase()
  const visiblePhotos = availablePhotos.filter((photo) => `${photo.title} ${photo.caption} ${photo.location} ${photo.tags.join(' ')}`.toLowerCase().includes(needle))
  const cover = availablePhotos.find((photo) => photo.id === album.coverPhotoId) ?? availablePhotos[0]
  const pending = album.collaborators.filter((item) => item.status === 'pending')
  const accepted = album.collaborators.filter((item) => item.status === 'accepted')

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!invitePreview) { setInvitePreview(true); return }
    setBusy(true)
    try {
      await inviteCollaborator(album.id, { name: inviteName, email: inviteEmail, permission: invitePermission })
      showToast('Demo invitation saved locally. No email was sent.')
      setInviteName('')
      setInviteEmail('')
      setInvitePermission('viewer')
      setInvitePreview(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The invitation could not be saved.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function act(action: () => Promise<void>, success: string) {
    try { await action(); showToast(success) }
    catch (error) { showToast(error instanceof Error ? error.message : 'That collaboration change could not be saved.', 'error') }
  }

  async function removePhoto(photo: MemoryPhoto) {
    await updateSharedAlbum(album.id, {
      name: album.name,
      description: album.description,
      photoIds: album.photoIds.filter((id) => id !== photo.id),
      coverPhotoId: album.coverPhotoId === photo.id ? album.photoIds.find((id) => id !== photo.id) ?? null : album.coverPhotoId,
    })
  }

  async function postComment(photoId: string) {
    const body = commentDrafts[photoId] ?? ''
    try {
      await addSharedAlbumComment(album.id, photoId, body)
      setCommentDrafts((current) => ({ ...current, [photoId]: '' }))
      showToast('Comment saved in this local demo.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The comment could not be saved.', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link to="/shared-albums" className="inline-flex items-center gap-2 text-xs text-[#8b7861]"><ArrowLeft size={15} /> All shared albums</Link><button type="button" className="auth-secondary min-h-9" onClick={() => setEditOpen(true)}><Pencil size={14} /> Edit album</button></header>
      <section className="grid overflow-hidden border border-[#302d29]/10 bg-[#eee8df] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-56 bg-[#e1d7c9] sm:min-h-80">{cover ? <MemoryPhotoImage photo={cover} alt={`Cover of ${album.name}`} className="absolute inset-0 h-full w-full" /> : <div className="flex h-full min-h-56 items-center justify-center text-[#8b7861]"><ImagePlus size={35} strokeWidth={1.2} /></div>}</div>
        <div className="flex flex-col justify-center p-6 sm:p-9"><p className="eyebrow mb-2">A shared collection · local demo</p><h1 className="serif text-4xl sm:text-5xl">{album.name}</h1><p className="mt-3 text-sm leading-6 text-[#71685d]">{album.description || 'A collection of moments, gathered by you.'}</p><div className="mt-5 flex flex-wrap gap-3 text-[0.65rem] text-[#8b7861]"><span>{availablePhotos.length} photographs</span><span>·</span><span>{accepted.length} accepted collaborator{accepted.length === 1 ? '' : 's'}</span></div><p className="mt-5 border-t border-[#302d29]/10 pt-3 text-[0.62rem] leading-5 text-[#82796e]">Invitations, collaborator states, reactions and comments are saved only in this browser. No email is sent and no other account can synchronize with this album.</p></div>
      </section>

      <div className="mt-9 grid items-start gap-9 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow mb-1">Photographs, gathered</p><h2 className="serif text-3xl">Inside the album</h2></div><label className="flex min-w-48 items-center gap-2 border-b border-[#302d29]/20 px-1 py-2"><Search size={14} className="text-[#8b8175]" /><input aria-label="Search shared photographs" className="w-full border-0 bg-transparent text-xs outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a photograph…" /></label></div>
          {album.photoIds.length > availablePhotos.length && <p role="status" className="mb-3 text-xs text-[#8f493e]">Some photograph references are no longer available in My Memories.</p>}
          {visiblePhotos.length ? <div className="grid gap-4 sm:grid-cols-2">{visiblePhotos.map((photo, index) => {
            const comments = album.comments.filter((item) => item.photoId === photo.id)
            const reaction = album.reactions.find((item) => item.photoId === photo.id)
            return <article key={photo.id} className={`overflow-hidden border border-[#302d29]/10 bg-[#fbf9f5] ${index % 3 === 1 ? 'sm:mt-6' : ''}`}>
              <button type="button" aria-label={`Open ${photo.title}`} onClick={() => setViewerId(photo.id)} className="block w-full text-left"><MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-[1.2] w-full" /></button>
              <div className="p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="serif text-xl">{photo.title}</h3><p className="mt-0.5 text-[0.61rem] text-[#8b8175]">{photo.date || 'Date not set'}{photo.location ? ` · ${photo.location}` : ''}</p></div><button type="button" aria-pressed={reaction?.ownerReacted ?? false} aria-label={reaction?.ownerReacted ? `Remove reaction from ${photo.title}` : `React to ${photo.title}`} onClick={() => void act(() => toggleSharedAlbumReaction(album.id, photo.id), reaction?.ownerReacted ? 'Reaction removed.' : 'Reaction saved locally.')} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${reaction?.ownerReacted ? 'text-[#805449]' : 'text-[#8b8175]'}`}><Heart size={14} fill={reaction?.ownerReacted ? 'currentColor' : 'none'} />{reaction?.count ?? 0}</button></div>
                {photo.caption && <p className="mt-2 text-xs leading-5 text-[#71685d]">{photo.caption}</p>}
                <div className="mt-3 border-t border-[#302d29]/10 pt-3"><p className="mb-2 flex items-center gap-1 text-[0.6rem] uppercase tracking-wide text-[#8b8175]"><MessageCircle size={12} /> Comments · local demo</p>{comments.map((comment) => <p key={comment.id} className="mb-2 text-xs leading-5"><span className="font-semibold">{comment.author}</span><span className="text-[#71685d]"> · {comment.body}</span></p>)}<div className="flex gap-2"><input aria-label={`Comment on ${photo.title}`} className="auth-input min-h-9 py-1.5 text-xs" maxLength={500} value={commentDrafts[photo.id] ?? ''} onChange={(event) => setCommentDrafts((current) => ({ ...current, [photo.id]: event.target.value }))} placeholder="Leave a kind note…" /><button type="button" aria-label={`Post comment on ${photo.title}`} onClick={() => void postComment(photo.id)} className="shrink-0 px-2 text-[#8b7861] hover:bg-[#eee8df]"><ArrowRight size={15} /></button></div></div>
              </div>
            </article>
          })}</div> : <div className="border border-dashed border-[#c8b7a2] bg-[#fbf9f5] py-14 text-center"><p className="serif text-2xl">{album.photoIds.length ? 'No photographs match.' : 'This album is ready for its first photograph.'}</p><p className="mt-2 text-xs text-[#82796e]">{album.photoIds.length ? 'Try another search.' : 'Edit album details to select photographs from My Memories.'}</p></div>}
        </section>

        <aside className="space-y-7">
          <section className="border border-[#302d29]/10 bg-[#fbf9f5] p-5"><p className="eyebrow mb-1">A circle of people</p><h2 className="serif text-2xl">Collaborators</h2><p className="mt-1 text-[0.63rem] leading-5 text-[#82796e]">These are local demo profiles, not authenticated users.</p>
            {accepted.length ? <div className="mt-4 space-y-3">{accepted.map((collaborator) => <CollaboratorRow key={collaborator.id} collaborator={collaborator} onRemove={() => setConfirmCollaborator(collaborator)} onPermission={(permission) => void act(() => updateCollaboratorPermission(album.id, collaborator.id, permission), 'Permission updated in the local demo.')} />)}</div> : <p className="mt-4 border-y border-[#302d29]/10 py-3 text-xs text-[#82796e]">Accepted demo collaborators will appear here.</p>}
            <form onSubmit={(event) => void invite(event)} className="mt-5 space-y-3 border-t border-[#302d29]/10 pt-4"><h3 className="text-xs font-semibold">Prepare an invitation</h3><label className="block text-[0.65rem]">Collaborator name<input aria-label="Collaborator name" className="auth-input mt-1 min-h-9 py-1.5 text-xs" value={inviteName} onChange={(event) => { setInviteName(event.target.value); setInvitePreview(false) }} maxLength={100} placeholder="Their name" required /></label><label className="block text-[0.65rem]">Email address<input aria-label="Collaborator email" type="email" className="auth-input mt-1 min-h-9 py-1.5 text-xs" value={inviteEmail} onChange={(event) => { setInviteEmail(event.target.value); setInvitePreview(false) }} maxLength={254} placeholder="name@example.com" required /></label><label className="block text-[0.65rem]">Permission<select aria-label="Collaborator permission" className="auth-input mt-1 min-h-9 py-1.5 text-xs" value={invitePermission} onChange={(event) => setInvitePermission(event.target.value as SharedAlbumPermission)}>{(['viewer', 'contributor', 'editor'] as const).map((permission) => <option key={permission} value={permission}>{capitalize(permission)} · {permissionDescriptions[permission]}</option>)}</select></label>
              {invitePreview && <div className="border border-[#c8b7a2] bg-[#eee8df]/60 p-3"><p className="eyebrow text-[0.52rem]">Invitation preview · not emailed</p><p className="mt-1 text-xs"><strong>{inviteName}</strong> · {inviteEmail}</p><p className="mt-1 text-[0.62rem] text-[#71685d]">{permissionDescriptions[invitePermission]}</p></div>}
              <button type="submit" className="auth-secondary min-h-9 w-full justify-center" disabled={busy}><Mail size={14} />{busy ? 'Saving…' : invitePreview ? 'Save demo invitation' : 'Preview invitation'}</button>
            </form>
            {pending.length > 0 && <div className="mt-5 border-t border-[#302d29]/10 pt-4"><h3 className="text-xs font-semibold">Pending invitations</h3><div className="mt-3 space-y-3">{pending.map((collaborator) => <div key={collaborator.id} className="border-b border-[#302d29]/10 pb-3 last:border-0"><p className="truncate text-xs font-medium">{collaborator.name}</p><p className="truncate text-[0.6rem] text-[#8b8175]">{collaborator.email} · {capitalize(collaborator.permission)}</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => void act(() => simulateInvitationAcceptance(album.id, collaborator.id), 'Acceptance simulated locally.')} className="text-[0.6rem] text-[#8b7861]"><Check size={11} className="mr-1 inline" />Simulate acceptance</button><button type="button" onClick={() => void act(() => cancelInvitation(album.id, collaborator.id), 'Pending invitation cancelled.')} className="text-[0.6rem] text-[#805449]">Cancel invitation</button></div></div>)}</div></div>}
            <p className="mt-4 text-[0.58rem] leading-5 text-[#8b8175]">Viewer: view only · Contributor: view and add · Editor: manage album. Real permissions require a backend.</p>
          </section>
          <section className="border border-[#302d29]/10 bg-[#eee8df]/60 p-5"><p className="eyebrow mb-1">A little record of this circle</p><h2 className="serif text-2xl">Recent activity</h2>{album.activity.length ? <ol className="mt-4 space-y-3">{album.activity.slice(0, 8).map((activity) => <li key={activity.id} className="border-l border-[#a68c70] pl-3"><p className="text-xs leading-5 text-[#514a40]">{activity.message}</p><time className="text-[0.58rem] text-[#8b8175]" dateTime={activity.createdAt}>{formatDateTime(activity.createdAt)}</time></li>)}</ol> : <p className="mt-3 text-xs text-[#82796e]">Activity will appear as you shape this album.</p>}</section>
        </aside>
      </div>
      {editOpen && <SharedAlbumEditor album={album} onClose={() => setEditOpen(false)} />}
      {viewerId && <PhotoViewer photos={availablePhotos} photoId={viewerId} onClose={() => setViewerId(null)} onRemoveFromAlbum={removePhoto} />}
      {confirmCollaborator && <ConfirmDialog title={`Remove ${confirmCollaborator.name}?`} description="This removes the local collaborator profile from this album. No external account or access is affected." confirmLabel="Remove collaborator" onCancel={() => setConfirmCollaborator(null)} onConfirm={() => { void act(() => removeCollaborator(album.id, confirmCollaborator.id), 'Collaborator removed.'); setConfirmCollaborator(null) }} />}
    </div>
  )
}

function CollaboratorRow({ collaborator, onRemove, onPermission }: { collaborator: SharedCollaborator; onRemove: () => void; onPermission: (permission: SharedAlbumPermission) => void }) {
  return <div className="flex items-start gap-2 border-b border-[#302d29]/10 pb-3 last:border-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eae2d6] serif text-sm text-[#6d5b44]">{collaborator.name.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{collaborator.name}</p><p className="truncate text-[0.58rem] text-[#8b8175]">{collaborator.email}</p><label className="sr-only" htmlFor={`permission-${collaborator.id}`}>Permission for {collaborator.name}</label><select id={`permission-${collaborator.id}`} aria-label={`Permission for ${collaborator.name}`} className="mt-1 max-w-full border-0 bg-transparent p-0 text-[0.6rem] text-[#8b7861] focus:ring-0" value={collaborator.permission} onChange={(event) => onPermission(event.target.value as SharedAlbumPermission)}>{(['viewer', 'contributor', 'editor'] as const).map((permission) => <option key={permission} value={permission}>{capitalize(permission)}</option>)}</select></div><button type="button" aria-label={`Remove collaborator ${collaborator.name}`} onClick={onRemove} className="rounded-full p-1.5 text-[#805449] hover:bg-[#f5e9e4]"><Trash2 size={13} /></button></div>
}

function PageStatus({ children }: { children: string }) {
  return <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">{children}</div>
}

function NotFound() {
  return <div className="mx-auto max-w-xl py-20 text-center"><p className="serif text-3xl">This shared album is not here.</p><Link to="/shared-albums" className="auth-secondary mt-5">Return to Shared Albums</Link></div>
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}
