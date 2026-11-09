import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Heart, Pencil, Plus, Search, Trash2, UsersRound } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog, MemoryDialog } from '../components/MemoryDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'
import {
  familyMilestoneCategories,
  familyStoryCategories,
  type FamilyMember,
  type FamilyMemberDetails,
  type FamilyMilestone,
  type FamilyMilestoneCategory,
  type FamilyMilestoneDetails,
  type FamilyStory,
  type FamilyStoryCategory,
  type FamilyStoryDetails,
} from '../data/memoryTypes'

type FamilyTab = 'overview' | 'people' | 'stories' | 'milestones'
type DialogState = { kind: 'member'; value?: FamilyMember } | { kind: 'milestone'; value?: FamilyMilestone } | null

export function FamilyLegacyPage() {
  const { familyStoryId } = useParams()
  const location = useLocation()
  const { familyStories, loading } = useMemory()
  if (location.pathname === '/family/stories/new') return <FamilyStoryEditor />
  if (familyStoryId && location.pathname.endsWith('/edit')) {
    if (loading) return <PageStatus>Opening your family story…</PageStatus>
    const story = familyStories.find((item) => item.id === familyStoryId)
    return story ? <FamilyStoryEditor key={story.id} story={story} /> : <NotFound />
  }
  return <FamilyLegacyHome />
}

function FamilyLegacyHome() {
  const { photos, familyMembers, familyStories, familyMilestones, loading, storageError } = useMemory()
  const location = useLocation()
  const navigate = useNavigate()
  const initialTab = new URLSearchParams(location.search).get('view')
  const [tab, setTab] = useState<FamilyTab>(
    initialTab === 'stories' || initialTab === 'people' || initialTab === 'milestones' ? initialTab : 'overview',
  )
  const [dialog, setDialog] = useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | FamilyStory | FamilyMilestone | null>(null)
  const [deleteKind, setDeleteKind] = useState<'member' | 'story' | 'milestone'>('member')
  const [busy, setBusy] = useState(false)
  const [storyQuery, setStoryQuery] = useState('')
  const [storyCategory, setStoryCategory] = useState('')
  const [today] = useState(() => localDate(new Date()))
  const { deleteFamilyMember, deleteFamilyStory, deleteFamilyMilestone } = useMemory()
  const { showToast } = useToast()
  const upcomingMilestones = familyMilestones.filter((item) => item.date >= today).slice(0, 5)
  const featuredStories = familyStories.slice(0, 3)
  const groupedMembers = useMemo(() => {
    const groups = new Map<string, FamilyMember[]>()
    for (const member of familyMembers) {
      const label = member.generation.trim() || 'Family members'
      groups.set(label, [...(groups.get(label) ?? []), member])
    }
    return [...groups.entries()]
  }, [familyMembers])
  const filteredStories = familyStories.filter((story) => {
    const text = `${story.title} ${story.body} ${story.location} ${story.tags.join(' ')}`.toLowerCase()
    return text.includes(storyQuery.trim().toLowerCase()) && (!storyCategory || story.category === storyCategory)
  })

  async function remove() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      if (deleteKind === 'member') await deleteFamilyMember(deleteTarget.id)
      else if (deleteKind === 'story') await deleteFamilyStory(deleteTarget.id)
      else await deleteFamilyMilestone(deleteTarget.id)
      showToast(`${deleteKind === 'member' ? 'Family member' : deleteKind === 'story' ? 'Family story' : 'Family milestone'} removed.`)
      setDeleteTarget(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'This family record could not be removed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  function askDelete(item: FamilyMember | FamilyStory | FamilyMilestone, kind: typeof deleteKind) {
    setDeleteTarget(item)
    setDeleteKind(kind)
  }

  const tabs: Array<{ id: FamilyTab; label: string }> = [
    { id: 'overview', label: 'The gathering' },
    { id: 'people', label: 'Family members' },
    { id: 'stories', label: 'Family stories' },
    { id: 'milestones', label: 'Milestones' },
  ]

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="relative mb-8 overflow-hidden bg-[#eae2d6] px-6 py-9 sm:px-10 sm:py-12">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-[#a68c70]/30" /><div className="absolute -right-2 -top-12 h-48 w-48 rounded-full border border-[#a68c70]/25" />
        <div className="relative max-w-2xl"><p className="eyebrow mb-2">The people who made a home</p><h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Family Legacy</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#71685d]">Gather the names, stories and dates that matter to your family. Relationships and generations are only included when you add them.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" className="auth-primary min-h-10" onClick={() => setDialog({ kind: 'member' })}><Plus size={15} /> Add a family member</button><Link to="/family/stories/new" className="auth-secondary min-h-10"><Heart size={15} /> Add a family story</Link><button type="button" className="auth-secondary min-h-10" onClick={() => setDialog({ kind: 'milestone' })}><CalendarDays size={15} /> Record a milestone</button></div></div>
      </header>
      {storageError && <p role="alert" className="auth-error mb-5">{storageError}</p>}
      <nav aria-label="Family Legacy sections" className="mb-7 flex flex-wrap gap-1 border-b border-[#302d29]/12">
        {tabs.map((item) => <button key={item.id} type="button" aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)} className={`border-b-2 px-4 py-3 text-xs ${tab === item.id ? 'border-[#805449] text-[#302d29]' : 'border-transparent text-[#82796e] hover:text-[#302d29]'}`}>{item.label}</button>)}
      </nav>
      {loading ? <PageStatus>Gathering family memories…</PageStatus> : tab === 'overview' ? (
        <div className="space-y-12">
          <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-y border-[#302d29]/12 py-6">
              <div className="mb-5 flex items-end justify-between"><div><p className="eyebrow mb-2">Names, in your own words</p><h2 className="serif text-3xl">The family album</h2></div><button type="button" onClick={() => setTab('people')} className="text-[0.68rem] text-[#8b7861]">All members <ArrowRight size={13} className="inline" /></button></div>
              {familyMembers.length ? <div className="space-y-6">{groupedMembers.map(([generation, members]) => <section key={generation}><p className="mb-3 text-[0.6rem] uppercase tracking-[0.15em] text-[#8b8175]">{generation}</p><div className="flex flex-wrap gap-3">{members.slice(0, 6).map((member) => <MemberPortrait key={member.id} member={member} />)}</div></section>)}</div> : <EmptyInline icon="people" title="Begin with a name" description="Add a family member and decide how you would like to introduce them." action="Add a family member" onAction={() => setDialog({ kind: 'member' })} />}</div>
            <div className="bg-[#eee8df]/65 p-5 sm:p-7"><div className="mb-4 flex items-end justify-between"><div><p className="eyebrow mb-2">Dates to hold close</p><h2 className="serif text-3xl">Family milestones</h2></div><button type="button" onClick={() => setTab('milestones')} className="text-[0.68rem] text-[#8b7861]">All dates <ArrowRight size={13} className="inline" /></button></div>{upcomingMilestones.length ? <div className="space-y-3">{upcomingMilestones.slice(0, 3).map((item) => <MilestoneRow key={item.id} milestone={item} members={familyMembers} />)}</div> : <EmptyInline icon="date" title="A date to remember" description="Add birthdays, reunions or other meaningful family moments." action="Record a milestone" onAction={() => setDialog({ kind: 'milestone' })} />}</div>
          </section>
          <section><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow mb-2">Stories, passed around</p><h2 className="serif text-3xl">A few family stories</h2></div><button type="button" onClick={() => setTab('stories')} className="text-[0.68rem] text-[#8b7861]">All stories <ArrowRight size={13} className="inline" /></button></div>{featuredStories.length ? <div className="grid gap-5 md:grid-cols-3">{featuredStories.map((story, index) => <FamilyStoryCard key={story.id} story={story} index={index} />)}</div> : <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#302d29]/12 py-6"><p className="serif text-2xl">Some family moments are too good to lose.</p><Link to="/family/stories/new" className="auth-secondary">Write the first story <ArrowRight size={14} /></Link></div>}</section>
          <section className="border-t border-[#302d29]/12 pt-7"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow mb-2">Through the years</p><h2 className="serif text-3xl">Milestone timeline</h2></div><button type="button" onClick={() => setTab('milestones')} className="text-[0.68rem] text-[#8b7861]">Explore timeline <ArrowRight size={13} className="inline" /></button></div><MilestoneTimeline milestones={familyMilestones.slice(0, 5)} members={familyMembers} photos={photos} onAdd={() => setDialog({ kind: 'milestone' })} onEdit={(item) => setDialog({ kind: 'milestone', value: item })} onDelete={(item) => askDelete(item, 'milestone')} /></section>
        </div>
      ) : tab === 'people' ? (
        <section><div className="mb-6 flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">Profiles, gathered by generation</p><h2 className="serif text-3xl">Family members</h2></div><button type="button" className="auth-secondary min-h-9" onClick={() => setDialog({ kind: 'member' })}><Plus size={14} /> Add member</button></div>{familyMembers.length ? <div className="space-y-9">{groupedMembers.map(([generation, members]) => <section key={generation}><div className="mb-4 flex items-center gap-3"><span className="h-px flex-1 bg-[#302d29]/12" /><h3 className="text-[0.63rem] uppercase tracking-[0.15em] text-[#8b8175]">{generation}</h3><span className="h-px flex-1 bg-[#302d29]/12" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{members.map((member) => <MemberCard key={member.id} member={member} stories={familyStories} milestones={familyMilestones} onEdit={() => setDialog({ kind: 'member', value: member })} onDelete={() => askDelete(member, 'member')} />)}</div></section>)}</div> : <EmptyInline icon="people" title="A place for each person" description="Add names and details yourself; no family relationships are assumed." action="Add a family member" onAction={() => setDialog({ kind: 'member' })} />}</section>
      ) : tab === 'stories' ? (
        <section><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow mb-2">Traditions, lessons and ordinary days</p><h2 className="serif text-3xl">Family stories</h2></div><Link to="/family/stories/new" className="auth-primary min-h-9"><Plus size={14} /> Write a story</Link></div><div className="mb-5 flex flex-wrap gap-3"><label className="flex min-w-56 flex-1 items-center gap-2 border-b border-[#302d29]/20 px-1 py-2"><Search size={14} className="text-[#8b8175]" /><input aria-label="Search family stories" className="w-full border-0 bg-transparent text-xs outline-none" placeholder="Search words, places, people…" value={storyQuery} onChange={(event) => setStoryQuery(event.target.value)} /></label><select aria-label="Filter family stories by category" className="auth-input min-h-10 w-auto min-w-48 py-2 text-xs" value={storyCategory} onChange={(event) => setStoryCategory(event.target.value)}><option value="">All story categories</option>{familyStoryCategories.map((category) => <option key={category}>{category}</option>)}</select></div>{filteredStories.length ? <div className="space-y-5">{filteredStories.map((story, index) => <FamilyStoryRow key={story.id} story={story} index={index} members={familyMembers} onDelete={() => askDelete(story, 'story')} />)}</div> : <EmptyInline icon="story" title={storyQuery ? 'No stories found' : 'The first page is still blank'} description={storyQuery ? 'Try another phrase or clear your category filter.' : 'Capture a tradition, a family lesson, a celebration or an everyday moment.'} action="Write a family story" onAction={() => navigate('/family/stories/new')} />}</section>
      ) : (
        <section><div className="mb-6 flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">A family's calendar of meaning</p><h2 className="serif text-3xl">Family milestones</h2></div><button type="button" className="auth-primary min-h-9" onClick={() => setDialog({ kind: 'milestone' })}><Plus size={14} /> Record a date</button></div><MilestoneTimeline milestones={familyMilestones} members={familyMembers} photos={photos} onAdd={() => setDialog({ kind: 'milestone' })} onEdit={(item) => setDialog({ kind: 'milestone', value: item })} onDelete={(item) => askDelete(item, 'milestone')} /></section>
      )}
      {dialog?.kind === 'member' && <MemberDialog member={dialog.value} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'milestone' && <MilestoneDialog milestone={dialog.value} onClose={() => setDialog(null)} />}
      {deleteTarget && <ConfirmDialog title={`Remove this ${deleteKind === 'member' ? 'family member' : deleteKind === 'story' ? 'family story' : 'milestone'}?`} description={deleteKind === 'member' ? 'This removes the profile. Family stories, photos and milestone records are kept; this member will no longer be linked by name.' : 'This family record will be removed. Your original photographs and other family records remain.'} confirmLabel="Remove" busy={busy} onCancel={() => setDeleteTarget(null)} onConfirm={() => void remove()} />}
    </div>
  )
}

function MemberDialog({ member, onClose }: { member?: FamilyMember; onClose: () => void }) {
  const { photos, createFamilyMember, updateFamilyMember } = useMemory()
  const { showToast } = useToast()
  const [name, setName] = useState(member?.name ?? '')
  const [relationship, setRelationship] = useState(member?.relationship ?? '')
  const [birthDate, setBirthDate] = useState(member?.birthDate ?? '')
  const [biography, setBiography] = useState(member?.biography ?? '')
  const [photoId, setPhotoId] = useState(member?.photoId ?? '')
  const [generation, setGeneration] = useState(member?.generation ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !relationship.trim()) { setError('Enter a name and relationship.'); return }
    setBusy(true)
    const details: FamilyMemberDetails = { name, relationship, birthDate, biography, photoId: photoId || null, generation: generation.trim() }
    try {
      if (member) await updateFamilyMember(member.id, details)
      else await createFamilyMember(details)
      showToast(member ? 'Family profile updated.' : 'Family member added.')
      onClose()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The family profile could not be saved.') } finally { setBusy(false) }
  }
  return <MemoryDialog title={member ? 'Edit a family profile' : 'Add a family member'} eyebrow="A name, remembered" onClose={onClose}><form onSubmit={(event) => void save(event)} className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Name<input aria-label="Member name" className="auth-input mt-1.5 min-h-10 py-2 text-xs" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} /></label><label className="text-xs font-semibold">Relationship<input aria-label="Member relationship" className="auth-input mt-1.5 min-h-10 py-2 text-xs" placeholder="As they describe it" value={relationship} onChange={(event) => setRelationship(event.target.value)} maxLength={80} /></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Birth date · optional<input aria-label="Member birth date" type="date" className="auth-input mt-1.5 min-h-10 py-2 text-xs" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label><label className="text-xs font-semibold">Profile photograph<select aria-label="Member photograph" className="auth-input mt-1.5 min-h-10 py-2 text-xs" value={photoId} onChange={(event) => setPhotoId(event.target.value)}><option value="">No photograph</option>{photos.map((photo) => <option key={photo.id} value={photo.id}>{photo.title}</option>)}</select></label></div>
    <label className="block text-xs font-semibold">Generation grouping · optional<input aria-label="Generation grouping" className="auth-input mt-1.5 min-h-10 py-2 text-xs" placeholder="Enter a label only if you choose" maxLength={80} value={generation} onChange={(event) => setGeneration(event.target.value)} /><span className="mt-1 block font-normal text-[0.62rem] text-[#8b8175]">For example, “Grandparents” or “Our children.” No relationships are inferred.</span></label>
    <label className="block text-xs font-semibold">A short biography<textarea aria-label="Member biography" className="auth-input mt-1.5 min-h-28 resize-y py-2 text-xs leading-5" maxLength={1200} value={biography} onChange={(event) => setBiography(event.target.value)} placeholder="The details you would like to keep about them…" /></label>
    {error && <p role="alert" className="auth-error">{error}</p>}<div className="flex justify-end gap-2"><button type="button" className="auth-secondary" onClick={onClose}>Cancel</button><button type="submit" className="auth-primary min-h-10" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
  </form></MemoryDialog>
}

function FamilyStoryEditor({ story }: { story?: FamilyStory }) {
  const { photos, familyMembers, createFamilyStory, updateFamilyStory } = useMemory()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [title, setTitle] = useState(story?.title ?? '')
  const [body, setBody] = useState(story?.body ?? '')
  const [date, setDate] = useState(story?.date ?? '')
  const [location, setLocation] = useState(story?.location ?? '')
  const [category, setCategory] = useState<FamilyStoryCategory>(story?.category ?? familyStoryCategories[0])
  const [tagsText, setTagsText] = useState(story?.tags.join(', ') ?? '')
  const [photoIds, setPhotoIds] = useState<string[]>(story?.photoIds ?? [])
  const [memberIds, setMemberIds] = useState<string[]>(story?.memberIds ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim() || !body.trim()) { setError('Add a title and write a few lines for your story.'); return }
    setBusy(true)
    const details: FamilyStoryDetails = {
      title,
      body,
      date,
      location,
      category,
      tags: [...new Set(tagsText.split(',').map((tag) => tag.trim()).filter(Boolean))],
      photoIds,
      memberIds,
    }
    try {
      if (story) await updateFamilyStory(story.id, details)
      else await createFamilyStory(details)
      showToast(story ? 'Family story updated.' : 'Family story saved.')
      navigate('/family?view=stories')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The family story could not be saved.') } finally { setBusy(false) }
  }

  return <div className="mx-auto max-w-[70rem]"><header className="mb-6 flex items-center justify-between"><Link to="/family?view=stories" className="inline-flex items-center gap-2 text-xs text-[#8b7861]"><ArrowLeft size={15} /> Family Legacy</Link><span className="text-[0.62rem] text-[#8b8175]">{wordCount} words</span></header>
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem]"><form onSubmit={(event) => void save(event)} className="border border-[#302d29]/10 bg-[#fbf9f5]">
      <header className="border-b border-[#302d29]/10 bg-[#eee8df]/60 px-5 py-5 sm:px-8"><p className="eyebrow mb-2">A story from your family</p><input aria-label="Family story title" className="w-full border-0 bg-transparent p-0 serif text-4xl outline-none placeholder:text-[#b6aa9c] focus:ring-0" maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A tradition, a turning point…" /></header>
      <div className="space-y-5 p-5 sm:p-8"><textarea aria-label="Family story text" className="auth-input min-h-64 resize-y bg-[#fffefa] text-sm leading-7" maxLength={12000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tell the story in your own words. The small details belong here…" />
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Date<input aria-label="Family story date" type="date" className="auth-input mt-1.5 min-h-10 py-2 text-xs" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="text-xs font-semibold">Location<input aria-label="Family story location" className="auth-input mt-1.5 min-h-10 py-2 text-xs" maxLength={120} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="A place, then or now" /></label><label className="text-xs font-semibold">Category<select aria-label="Family story category" className="auth-input mt-1.5 min-h-10 py-2 text-xs" value={category} onChange={(event) => setCategory(event.target.value as FamilyStoryCategory)}>{familyStoryCategories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold">Tags, separated by commas<input aria-label="Family story tags" className="auth-input mt-1.5 min-h-10 py-2 text-xs" value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="Sunday dinners, summer" /></label></div>
        {familyMembers.length > 0 && <fieldset><legend className="mb-2 text-xs font-semibold">People in this story</legend><div className="flex flex-wrap gap-x-4 gap-y-2 border-y border-[#302d29]/10 py-3">{familyMembers.map((member) => <label key={member.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={memberIds.includes(member.id)} onChange={() => setMemberIds((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} />{member.name}</label>)}</div></fieldset>}
        <PhotoPicker photos={photos} selected={photoIds} onChange={setPhotoIds} heading="Photographs from My Memories" kind="family" />
        {error && <p role="alert" className="auth-error">{error}</p>}<div className="flex justify-end gap-2 border-t border-[#302d29]/10 pt-4"><Link to="/family?view=stories" className="auth-secondary">Cancel</Link><button type="submit" className="auth-primary min-h-10" disabled={busy}>{busy ? 'Saving…' : 'Save family story'}</button></div>
      </div>
    </form><aside className="h-fit bg-[#eee8df]/65 p-5 sm:p-6"><p className="eyebrow">A living archive</p><h2 className="serif mt-2 text-3xl">Keep their voices close.</h2><p className="mt-3 text-xs leading-6 text-[#71685d]">Stories are linked to the people and photographs you choose. You can update these connections at any time.</p><div className="mt-5 border-t border-[#302d29]/10 pt-4 text-[0.63rem] leading-5 text-[#8b8175]">{photoIds.length} photographs · {memberIds.length} family members</div></aside></div>
  </div>
}

function MilestoneDialog({ milestone, onClose }: { milestone?: FamilyMilestone; onClose: () => void }) {
  const { photos, familyMembers, createFamilyMilestone, updateFamilyMilestone } = useMemory()
  const { showToast } = useToast()
  const [title, setTitle] = useState(milestone?.title ?? '')
  const [date, setDate] = useState(() => milestone?.date ?? localDate(new Date()))
  const [description, setDescription] = useState(milestone?.description ?? '')
  const [category, setCategory] = useState<FamilyMilestoneCategory>(milestone?.category ?? familyMilestoneCategories[0])
  const [memberIds, setMemberIds] = useState<string[]>(milestone?.memberIds ?? [])
  const [photoId, setPhotoId] = useState(milestone?.photoId ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const details: FamilyMilestoneDetails = { title, date, description, category, memberIds, photoId: photoId || null }
    try {
      if (milestone) await updateFamilyMilestone(milestone.id, details)
      else await createFamilyMilestone(details)
      showToast(milestone ? 'Family milestone updated.' : 'Family milestone recorded.')
      onClose()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The milestone could not be saved.') } finally { setBusy(false) }
  }
  return <MemoryDialog title={milestone ? 'Edit a family milestone' : 'Record a meaningful date'} eyebrow="A date that belongs to you" onClose={onClose}><form onSubmit={(event) => void save(event)} className="space-y-4">
    <label className="block text-xs font-semibold">Milestone title<input aria-label="Milestone title" className="auth-input mt-1.5 min-h-10 py-2 text-xs" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A family reunion, a graduation…" /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Date<input aria-label="Milestone date" type="date" className="auth-input mt-1.5 min-h-10 py-2 text-xs" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="text-xs font-semibold">Kind<select aria-label="Milestone category" className="auth-input mt-1.5 min-h-10 py-2 text-xs" value={category} onChange={(event) => setCategory(event.target.value as FamilyMilestoneCategory)}>{familyMilestoneCategories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label className="block text-xs font-semibold">Description<textarea aria-label="Milestone description" className="auth-input mt-1.5 min-h-24 py-2 text-xs leading-5" maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A note about what made this date meaningful…" /></label>
    {familyMembers.length > 0 && <fieldset><legend className="mb-2 text-xs font-semibold">Family members</legend><div className="flex flex-wrap gap-x-4 gap-y-2">{familyMembers.map((member) => <label key={member.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={memberIds.includes(member.id)} onChange={() => setMemberIds((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} />{member.name}</label>)}</div></fieldset>}
    <label className="block text-xs font-semibold">Photograph<select aria-label="Milestone photograph" className="auth-input mt-1.5 min-h-10 py-2 text-xs" value={photoId} onChange={(event) => setPhotoId(event.target.value)}><option value="">No photograph</option>{photos.map((photo) => <option key={photo.id} value={photo.id}>{photo.title}</option>)}</select></label>
    {error && <p role="alert" className="auth-error">{error}</p>}<div className="flex justify-end gap-2"><button type="button" className="auth-secondary" onClick={onClose}>Cancel</button><button type="submit" className="auth-primary min-h-10" disabled={busy}>{busy ? 'Saving…' : 'Save milestone'}</button></div>
  </form></MemoryDialog>
}

function MemberPortrait({ member }: { member: FamilyMember }) {
  const { photos } = useMemory()
  const photo = photos.find((item) => item.id === member.photoId)
  return <div className="flex w-[5.5rem] flex-col items-center text-center"><div className="h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full border border-[#a68c70]/50 bg-[#eee8df]">{photo ? <MemoryPhotoImage photo={photo} alt={photo.title} className="h-full w-full" /> : <span className="flex h-full w-full items-center justify-center serif text-2xl text-[#8b7861]">{member.name.slice(0, 1).toUpperCase()}</span>}</div><span className="mt-2 w-full truncate text-xs font-medium">{member.name}</span><span className="mt-0.5 w-full truncate text-[0.6rem] text-[#8b8175]">{member.relationship}</span></div>
}

function MemberCard({ member, stories, milestones, onEdit, onDelete }: { member: FamilyMember; stories: FamilyStory[]; milestones: FamilyMilestone[]; onEdit: () => void; onDelete: () => void }) {
  const { photos } = useMemory()
  const photo = photos.find((item) => item.id === member.photoId)
  const storyCount = stories.filter((story) => story.memberIds.includes(member.id)).length
  const milestoneCount = milestones.filter((item) => item.memberIds.includes(member.id)).length
  return <article className="flex gap-4 border border-[#302d29]/10 bg-[#fbf9f5] p-4"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#eee8df]">{photo ? <MemoryPhotoImage photo={photo} alt={photo.title} className="h-full w-full" /> : <span className="flex h-full w-full items-center justify-center serif text-3xl text-[#8b7861]">{member.name.slice(0, 1).toUpperCase()}</span>}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="serif truncate text-2xl">{member.name}</h3><p className="mt-0.5 text-xs text-[#8b7861]">{member.relationship}{member.birthDate ? ` · ${formatDate(member.birthDate)}` : ''}</p></div><div className="flex shrink-0"><button type="button" aria-label={`Edit ${member.name}`} onClick={onEdit} className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df]"><Pencil size={14} /></button><button type="button" aria-label={`Remove ${member.name}`} onClick={onDelete} className="rounded-full p-2 text-[#805449] hover:bg-[#f5e9e4]"><Trash2 size={14} /></button></div></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#82796e]">{member.biography || 'A family profile, written by you.'}</p><p className="mt-3 text-[0.6rem] text-[#8b8175]">{storyCount} {storyCount === 1 ? 'story' : 'stories'} · {milestoneCount} milestones</p></div></article>
}

function FamilyStoryCard({ story, index }: { story: FamilyStory; index: number }) {
  const { photos } = useMemory()
  const photo = story.photoIds.map((id) => photos.find((item) => item.id === id)).find((item) => item !== undefined)
  return <article className={`group ${index === 1 ? 'md:mt-8' : ''}`}><Link to={`/family/stories/${story.id}/edit`} className="block"><div className="relative aspect-[1.1] overflow-hidden bg-[#eae2d6]">{photo ? <MemoryPhotoImage photo={photo} alt={photo.title} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-[#8b7861]"><Heart size={27} strokeWidth={1.2} /></div>}<span className="absolute bottom-3 left-3 bg-[#f8f5ef]/90 px-2 py-1 text-[0.55rem] uppercase tracking-[0.12em]">{story.category}</span></div><h3 className="serif mt-3 text-2xl">{story.title}</h3><p className="mt-1 line-clamp-3 text-xs leading-5 text-[#82796e]">{story.body}</p></Link><Link to={`/family/stories/${story.id}/edit`} className="mt-2 inline-flex items-center gap-1 text-[0.62rem] text-[#8b7861]">Read or edit <ArrowRight size={12} /></Link></article>
}

function FamilyStoryRow({ story, index, members, onDelete }: { story: FamilyStory; index: number; members: FamilyMember[]; onDelete: () => void }) {
  const { photos } = useMemory()
  const navigate = useNavigate()
  const photo = story.photoIds.map((id) => photos.find((item) => item.id === id)).find((item) => item !== undefined)
  const people = story.memberIds.map((id) => members.find((member) => member.id === id)?.name).filter((name) => name)
  return <article className={`grid gap-4 border border-[#302d29]/10 bg-[#fbf9f5] p-3 sm:grid-cols-[12rem_1fr_auto] ${index % 2 ? 'sm:ml-8' : ''}`}><button type="button" aria-label={`Edit ${story.title}`} onClick={() => navigate(`/family/stories/${story.id}/edit`)} className="relative block aspect-[1.4] overflow-hidden bg-[#eee8df] text-left">{photo ? <MemoryPhotoImage photo={photo} alt={photo.title} className="h-full w-full" /> : <span className="flex h-full items-center justify-center text-[#8b7861]"><Heart size={20} /></span>}</button><div className="min-w-0 py-1"><p className="eyebrow text-[0.53rem]">{story.category}{story.date ? ` · ${formatDate(story.date)}` : ''}</p><button type="button" className="serif mt-1 text-left text-2xl hover:text-[#805449]" onClick={() => navigate(`/family/stories/${story.id}/edit`)}>{story.title}</button><p className="mt-1 line-clamp-3 text-xs leading-5 text-[#82796e]">{story.body}</p><p className="mt-2 text-[0.6rem] text-[#8b8175]">{[story.location, people.join(', '), story.tags.join(' · ')].filter(Boolean).join(' · ')}</p></div><div className="flex items-start gap-1"><button type="button" aria-label={`Edit ${story.title}`} onClick={() => navigate(`/family/stories/${story.id}/edit`)} className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df]"><Pencil size={14} /></button><button type="button" aria-label={`Delete ${story.title}`} onClick={onDelete} className="rounded-full p-2 text-[#805449] hover:bg-[#f5e9e4]"><Trash2 size={14} /></button></div></article>
}

function MilestoneTimeline({ milestones, members, photos, onAdd, onEdit, onDelete }: { milestones: FamilyMilestone[]; members: FamilyMember[]; photos: ReturnType<typeof useMemory>['photos']; onAdd: () => void; onEdit: (item: FamilyMilestone) => void; onDelete: (item: FamilyMilestone) => void }) {
  const [today] = useState(() => localDate(new Date()))
  if (!milestones.length) {
    return <EmptyInline icon="date" title="A timeline will grow here" description="Record the dates that feel worth keeping—birthdays, reunions and family achievements." action="Record a milestone" onAction={onAdd} />
  }
  return (
    <div className="relative ml-3 border-l border-[#a68c70]/50 pl-6">
      {milestones.map((item, index) => {
        const linked = item.memberIds.map((id) => members.find((member) => member.id === id)?.name).filter((name) => name)
        const photo = photos.find((photoItem) => photoItem.id === item.photoId)
        return (
          <article key={item.id} className="relative mb-5 border-b border-[#302d29]/10 pb-5 last:mb-0 last:border-0">
            <span className={`absolute -left-[1.93rem] top-1 h-3 w-3 rounded-full border-2 border-[#f8f5ef] ${item.date >= today ? 'bg-[#805449]' : 'bg-[#a68c70]'}`} />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div><p className="eyebrow text-[0.53rem]">{formatDate(item.date)} · {item.category}</p><h3 className="serif mt-1 text-2xl">{item.title}</h3><p className="mt-1 text-xs leading-5 text-[#82796e]">{item.description || 'A meaningful date in your family story.'}</p>{linked.length > 0 && <p className="mt-2 text-[0.62rem] text-[#8b7861]">{linked.join(' · ')}</p>}</div>
              <div className="flex items-start gap-1">{photo && <MemoryPhotoImage photo={photo} alt={photo.title} className="mr-2 h-14 w-16" />}<button type="button" aria-label={`Edit ${item.title}`} onClick={() => onEdit(item)} className="rounded-full p-2 text-[#71685d] hover:bg-[#eee8df]"><Pencil size={14} /></button><button type="button" aria-label={`Delete ${item.title}`} onClick={() => onDelete(item)} className="rounded-full p-2 text-[#805449] hover:bg-[#f5e9e4]"><Trash2 size={14} /></button></div>
            </div>
            <span className="sr-only">Timeline item {index + 1}</span>
          </article>
        )
      })}
    </div>
  )
}

function MilestoneRow({ milestone, members }: { milestone: FamilyMilestone; members: FamilyMember[] }) {
  const names = milestone.memberIds.map((id) => members.find((member) => member.id === id)?.name).filter(Boolean)
  return <article className="flex gap-3 border-b border-[#302d29]/10 pb-3 last:border-0 last:pb-0"><div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center bg-[#fbf9f5] text-[#805449]"><span className="text-[0.53rem] uppercase">{new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(`${milestone.date}T12:00:00`))}</span><span className="serif text-xl leading-5">{new Date(`${milestone.date}T12:00:00`).getDate()}</span></div><div className="min-w-0"><h3 className="serif truncate text-xl">{milestone.title}</h3><p className="mt-0.5 truncate text-[0.62rem] text-[#82796e]">{milestone.category}{names.length ? ` · ${names.join(', ')}` : ''}</p></div></article>
}

function EmptyInline({ icon, title, description, action, onAction }: { icon: 'people' | 'date' | 'story'; title: string; description: string; action: string; onAction: () => void }) {
  const Icon = icon === 'people' ? UsersRound : icon === 'date' ? CalendarDays : Heart
  return <div className="flex flex-col items-start bg-[#fbf9f5]/70 px-4 py-6"><Icon size={20} strokeWidth={1.3} className="text-[#8b7861]" /><h3 className="serif mt-3 text-2xl">{title}</h3><p className="mt-1 max-w-md text-xs leading-5 text-[#82796e]">{description}</p><button type="button" onClick={onAction} className="mt-3 inline-flex items-center gap-1 text-[0.63rem] uppercase tracking-[0.1em] text-[#8b7861]">{action} <ArrowRight size={13} /></button></div>
}

function PhotoPicker({ photos, selected, onChange, heading, kind }: { photos: ReturnType<typeof useMemory>['photos']; selected: string[]; onChange: (ids: string[]) => void; heading: string; kind: 'capsule' | 'family' }) {
  return <section><p className="mb-2 text-xs font-semibold">{heading}</p>{photos.length ? <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">{photos.map((photo) => <label key={photo.id} className={`relative cursor-pointer border p-1.5 ${selected.includes(photo.id) ? 'border-[#805449] bg-[#eee8df]' : 'border-transparent bg-white/70'}`}><input aria-label={`Add ${photo.title} to ${kind}`} className="absolute left-2 top-2 z-10 h-4 w-4 accent-[#805449]" type="checkbox" checked={selected.includes(photo.id)} onChange={() => onChange(selected.includes(photo.id) ? selected.filter((id) => id !== photo.id) : [...selected, photo.id])} /><MemoryPhotoImage photo={photo} alt={photo.title} className="aspect-square" /><span className="mt-1 block truncate text-[0.6rem]">{photo.title}</span></label>)}</div> : <p className="text-xs text-[#82796e]">Your photo library is empty.</p>}</section>
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function PageStatus({ children }: { children: React.ReactNode }) {
  return <div role="status" className="flex min-h-56 items-center justify-center text-sm text-[#8b8175]">{children}</div>
}

function NotFound() {
  return <div className="mx-auto max-w-xl py-20 text-center"><p className="eyebrow">Family story unavailable</p><h1 className="serif mt-2 text-4xl">This story is not in your collection.</h1><Link to="/family?view=stories" className="auth-secondary mt-5">Return to Family Legacy</Link></div>
}
