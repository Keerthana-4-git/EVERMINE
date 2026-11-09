import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowDownRight,
  ArrowRight,
  Aperture,
  CalendarDays,
  ChevronRight,
  Clock3,
  Feather,
  BookHeart,
  BookOpen,
  Film,
  Heart,
  ImagePlus,
  Images,
  LockKeyhole,
  Plus,
  Sparkles,
  Upload,
  UsersRound,
  Bell,
  Database,
  LayoutGrid,
  Settings2,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AlbumEditorDialog } from '../components/AlbumEditorDialog'
import { MemoryPhotoImage } from '../components/MemoryPhotoImage'
import { PhotoUploadDialog } from '../components/PhotoUploadDialog'
import { PhotoViewer } from '../components/PhotoViewer'
import { useMemory } from '../data/useMemory'
import { photosOnThisDay, toCalendarDate } from '../data/memoryDates'
import { getDailyPrompt } from '../data/memoryPrompts'
import { generateLocalCuratorSuggestions } from '../data/memoryCurator'

const inspirationImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1500&q=85'

const keepsakeImages = [
  {
    src: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=700&q=80',
    alt: 'Golden light across a quiet mountain valley',
    note: 'For the unhurried mornings',
  },
  {
    src: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=700&q=80',
    alt: 'Friends sharing a joyful moment outdoors',
    note: 'For the people who feel like home',
  },
  {
    src: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=700&q=80',
    alt: 'A sunlit road winding through the countryside',
    note: 'For the long way around',
  },
]

export function SanctuaryPage() {
  const { user } = useAuth()
  const { photos, albums, stories, books, reels, capsules, familyStories, familyMilestones, familyMembers, sharedAlbums, curatorSuggestions, memoryWalls, notifications, deletedPhotos, profile, loading, storageError } = useMemory()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [albumOpen, setAlbumOpen] = useState(false)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [now] = useState(() => new Date())
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.fullName.split(' ')[0] ?? 'there'
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)
  const recentPhotos = photos.slice(0, 4)
  const recentAlbums = albums.slice(0, 3)
  const recentStories = stories.slice(0, 3)
  const recentBooks = books.slice(0, 2)
  const recentReels = reels.slice(0, 2)
  const openedCapsules = capsules
    .filter((capsule) => capsule.state === 'opened')
    .sort((a, b) => (b.openedAt ?? '').localeCompare(a.openedAt ?? ''))
    .slice(0, 2)
  const upcomingCapsules = capsules.filter((capsule) =>
    capsule.state === 'sealed' && capsule.unlockDate >= localDate(now),
  ).slice(0, 3)
  const featuredFamilyStories = familyStories.slice(0, 2)
  const upcomingFamilyMilestones = familyMilestones.filter((item) =>
    item.date >= localDate(now),
  ).slice(0, 3)
  const featuredPrompt = getDailyPrompt(now)
  const favorites = photos.filter((photo) => photo.favorite).length
  const onThisDay = photosOnThisDay(photos, toCalendarDate(now))
    .flatMap((group) => group.photos.map((photo) => ({ photo, year: group.year })))
    .slice(0, 4)
  const recentSharedAlbums = sharedAlbums.slice(0, 2)
  const pendingSharedInvitations = sharedAlbums.flatMap((album) =>
    album.collaborators
      .filter((collaborator) => collaborator.status === 'pending')
      .map((collaborator) => ({ album, collaborator })),
  ).slice(0, 3)
  const featuredCuratorSuggestions = useMemo(() => {
    const saved = curatorSuggestions.filter((suggestion) => suggestion.status === 'suggested')
    return (saved.length ? saved : generateLocalCuratorSuggestions(photos, albums, user?.email ?? '')).slice(0, 2)
  }, [albums, curatorSuggestions, photos, user?.email])
  const memoryWall = memoryWalls[0]
  const memoryWallPhotos = memoryWall?.tiles
    .map((tile) => photos.find((photo) => photo.id === tile.photoId))
    .filter((photo) => photo !== undefined)
    .slice(0, 4) ?? []
  const unreadNotifications = notifications.filter((notification) => !notification.readAt).length
  const trackedStorageBytes = [...photos, ...deletedPhotos.map((item) => item.photo)]
    .reduce((total, photo) => total + photo.blob.size, 0)

  return (
    <div className="mx-auto max-w-[82rem]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">{today}</p>
            <h1 className="serif text-[2.8rem] leading-none tracking-[-0.02em] sm:text-5xl">
              {greeting}, {firstName}.
            </h1>
          </div>
          <p className="max-w-[22rem] text-sm leading-6 text-[#82796e]">
            Welcome back. Your memories are waiting to be rediscovered.
          </p>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          <button type="button" className="auth-primary min-h-10" onClick={() => setUploadOpen(true)}>
            <Upload size={15} /> Upload photographs
          </button>
          <button type="button" className="auth-secondary min-h-10" onClick={() => setAlbumOpen(true)}>
            <Plus size={15} /> Create an album
          </button>
          <Link to="/memories" className="auth-secondary min-h-10">
            <Images size={15} /> Explore memories
          </Link>
          <Link to="/timeline" className="auth-secondary min-h-10">
            <CalendarDays size={15} /> Life Timeline
          </Link>
          <Link to="/on-this-day" className="auth-secondary min-h-10">
            <Clock3 size={15} /> On This Day
          </Link>
          <Link to="/stories/new" className="auth-secondary min-h-10">
            <BookHeart size={15} /> Write a story
          </Link>
          <Link to={`/prompts?prompt=${featuredPrompt.id}`} className="auth-secondary min-h-10">
            <Feather size={15} /> Answer a prompt
          </Link>
          <Link to="/books/new" className="auth-secondary min-h-10">
            <BookOpen size={15} /> Create a memory book
          </Link>
          <Link to="/reels/new" className="auth-secondary min-h-10">
            <Film size={15} /> Create a memory reel
          </Link>
          <Link to="/capsules/new" className="auth-secondary min-h-10">
            <LockKeyhole size={15} /> Create a time capsule
          </Link>
          <Link to="/family/stories/new" className="auth-secondary min-h-10">
            <UsersRound size={15} /> Add a family story
          </Link>
          <Link to="/shared-albums" className="auth-secondary min-h-10">
            <UsersRound size={15} /> Create a shared album
          </Link>
          <Link to="/curator" className="auth-secondary min-h-10">
            <Sparkles size={15} /> Organize memories
          </Link>
          <Link to="/memory-wall" className="auth-secondary min-h-10">
            <LayoutGrid size={15} /> Arrange your Memory Wall
          </Link>
          <Link to="/profile" className="auth-secondary min-h-10">
            <UserRound size={15} /> Your profile
          </Link>
          <Link to="/notifications" className="auth-secondary min-h-10">
            <Bell size={15} /> Notifications{unreadNotifications ? ` · ${unreadNotifications} unread` : ''}
          </Link>
          <Link to="/settings" className="auth-secondary min-h-10">
            <Settings2 size={15} /> Settings
          </Link>
        </div>

        <section className="relative grid min-h-[22rem] overflow-hidden bg-[#c4b5a2] lg:min-h-[25rem] lg:grid-cols-[0.86fr_1.14fr]">
          <div className="relative z-10 flex flex-col justify-center bg-[#eae2d6] px-7 py-9 sm:px-10 lg:px-12">
            <p className="eyebrow mb-4">A little more meaning, every day</p>
            <h2 className="serif max-w-md text-5xl leading-[0.96] tracking-[-0.02em] sm:text-[3.6rem]">
              Your life,
              <br />
              <em>beautifully</em> kept.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#71685d]">
              A quiet place for the photographs, voices, and little details that make a life yours.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#302d29]/20 text-[#6d5b44]">
                <Sparkles size={16} strokeWidth={1.6} />
              </span>
              <span className="text-[0.68rem] leading-5 text-[#71685d]">
                Thoughtfully yours
                <br />
                <span className="text-[#8b8175]">Your photos stay on this device</span>
              </span>
            </div>
          </div>
          <div className="relative min-h-[16rem] overflow-hidden lg:min-h-0">
            <img
              src={inspirationImage}
              alt="Soft sunlight resting over a peaceful open landscape"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#5e5548]/15 via-transparent to-[#332f2b]/20" />
            <div className="absolute bottom-5 right-5 border border-white/50 bg-[#f8f5ef]/85 px-4 py-3 backdrop-blur-sm">
              <p className="eyebrow mb-1 text-[0.54rem]">Your sanctuary begins here</p>
              <p className="serif text-xl italic text-[#453e35]">Made for what matters.</p>
            </div>
            <span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/55 bg-white/15 text-white backdrop-blur-sm">
              <ArrowDownRight size={17} />
            </span>
          </div>
        </section>

        <section aria-label="Your collection totals" className="mt-5 grid grid-cols-3 border-y border-[#302d29]/12">
          <Stat icon={Images} label="Photographs" value={loading ? '—' : String(photos.length)} />
          <Stat icon={Aperture} label="Albums" value={loading ? '—' : String(albums.length)} />
          <Stat icon={Heart} label="Favorites" value={loading ? '—' : String(favorites)} />
        </section>

        <section className="mt-8 grid gap-8 border-b border-[#302d29]/12 pb-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><p className="eyebrow mb-2">A composition of your own</p><h2 className="serif text-3xl">Memory Wall</h2></div>
              <Link to="/memory-wall" className="text-[0.68rem] text-[#8b7861]">Open wall <ChevronRight size={13} className="inline" /></Link>
            </div>
            {memoryWallPhotos.length ? (
              <Link to="/memory-wall" className="grid grid-cols-4 gap-2 bg-[#eae2d6] p-3 sm:gap-3 sm:p-4">
                {memoryWallPhotos.map((photo, index) => <MemoryPhotoImage key={photo.id} photo={photo} alt={photo.title} className={`${index === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'} w-full`} />)}
              </Link>
            ) : (
              <Link to="/memory-wall" className="flex min-h-36 items-center justify-center gap-3 border border-dashed border-[#c8b7a2] bg-[#fbf9f5] px-5 text-[#82796e]">
                <LayoutGrid size={22} strokeWidth={1.3} /><span className="text-xs">{photos.length ? 'Arrange saved photographs into a wall.' : 'Your wall is ready for its first photograph.'}</span>
              </Link>
            )}
            {memoryWall && <p className="mt-2 text-[0.62rem] text-[#8b8175]">Restored arrangement · {memoryWall.name}</p>}
          </div>
          <div className="flex flex-col justify-between border-l border-[#302d29]/10 pl-0 lg:pl-7">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3"><p className="eyebrow">On this device</p><Database size={16} className="text-[#8b7861]" /></div>
              <p className="serif text-3xl">{formatStorageBytes(trackedStorageBytes)}</p>
              <p className="mt-1 text-[0.66rem] leading-5 text-[#82796e]">Tracked photo files · {photos.length} active · {deletedPhotos.length} recently deleted</p>
              <p className="mt-3 text-xs text-[#8b8175]">Profile: {profile.fullName || firstName}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/settings" className="auth-secondary min-h-9"><Database size={13} /> Storage & privacy</Link>
              <Link to="/profile" className="auth-secondary min-h-9"><UserRound size={13} /> Edit profile</Link>
              <Link to="/recently-deleted" className="auth-secondary min-h-9">Recently Deleted</Link>
            </div>
          </div>
        </section>

        {storageError && <p className="auth-error mt-5" role="alert">{storageError}</p>}

        <section className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">Freshly gathered</p>
                <h2 className="serif text-3xl">Recently added</h2>
              </div>
              <Link to="/memories" className="inline-flex items-center gap-1 text-[0.68rem] text-[#8b7861] hover:text-[#302d29]">All memories <ChevronRight size={14} /></Link>
            </div>
            {recentPhotos.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {recentPhotos.map((photo, index) => (
                  <button key={photo.id} type="button" onClick={() => setViewerId(photo.id)} className={`group min-w-0 text-left ${index === 1 ? 'sm:mt-5' : ''}`}>
                    <MemoryPhotoImage photo={photo} alt={photo.title} className={`${index % 2 ? 'aspect-[0.86/1]' : 'aspect-[0.96/1]'} transition-transform duration-300 group-hover:-translate-y-1`} />
                    <span className="mt-2 block truncate text-xs font-medium text-[#514a40]">{photo.title}</span>
                    <span className="mt-0.5 block truncate text-[0.62rem] text-[#91877b]">{photo.date || photo.location || 'A moment to remember'}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[12rem] items-center gap-5 border border-dashed border-[#c8b7a2] bg-[#fbf9f5]/70 p-5 sm:p-7">
                <div className="hidden h-24 w-20 shrink-0 items-center justify-center bg-[#eae2d6] text-[#8b7861] sm:flex"><ImagePlus size={27} strokeWidth={1.2} /></div>
                <div>
                  <h3 className="serif text-2xl">Your first memories are waiting.</h3>
                  <p className="mt-2 max-w-md text-xs leading-5 text-[#82796e]">Add a photograph and keep the little details that make the moment yours.</p>
                  <button type="button" onClick={() => setUploadOpen(true)} className="mt-3 inline-flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.12em] text-[#8b7861] hover:text-[#302d29]">Upload photographs <ArrowRight size={13} /></button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">Gathered with intention</p>
                <h2 className="serif text-3xl">Recently created albums</h2>
              </div>
              <Link to="/albums" className="inline-flex items-center gap-1 text-[0.68rem] text-[#8b7861] hover:text-[#302d29]">All albums <ChevronRight size={14} /></Link>
            </div>
            {recentAlbums.length ? (
              <div className="divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
                {recentAlbums.map((album) => {
                  const cover = photos.find((photo) => photo.id === album.coverPhotoId) ??
                    photos.find((photo) => album.photoIds.includes(photo.id))
                  return (
                    <Link key={album.id} to={`/albums/${album.id}`} className="group flex items-center gap-3 py-3">
                      {cover ? (
                        <MemoryPhotoImage photo={cover} alt="" className="h-14 w-16 shrink-0" />
                      ) : (
                        <span className="flex h-14 w-16 shrink-0 items-center justify-center bg-[#eae2d6] text-[#8b7861]"><Aperture size={20} /></span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate serif text-xl">{album.name}</span>
                        <span className="mt-1 block text-[0.62rem] text-[#8b8175]">{album.photoIds.length} photographs · {album.category}</span>
                      </span>
                      <ChevronRight size={16} className="text-[#9b9083] transition group-hover:translate-x-1" />
                    </Link>
                  )
                })}
              </div>
            ) : (
              <button type="button" onClick={() => setAlbumOpen(true)} className="flex min-h-[12rem] w-full flex-col items-center justify-center border border-dashed border-[#c8b7a2] bg-[#fbf9f5]/70 p-6 text-center hover:bg-[#f3eee6]">
                <Aperture size={25} className="text-[#8b7861]" strokeWidth={1.3} />
                <span className="serif mt-3 text-2xl">Gather moments into an album.</span>
                <span className="mt-1 text-xs text-[#82796e]">Give a collection its own place to live.</span>
                <span className="mt-3 text-[0.64rem] uppercase tracking-[0.12em] text-[#8b7861]">Create an album <ArrowRight size={13} className="ml-1 inline" /></span>
              </button>
            )}
          </div>
        </section>

        <section className="mt-12 border-y border-[#302d29]/12 py-7" aria-label="On this day preview">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">A gentle return</p>
              <h2 className="serif text-3xl">On This Day</h2>
              <p className="mt-1 text-xs text-[#82796e]">Photographs from this date in earlier years.</p>
            </div>
            <Link to="/on-this-day" className="inline-flex items-center gap-1 text-[0.68rem] text-[#8b7861] hover:text-[#302d29]">
              All rediscoveries <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <p role="status" className="py-5 text-sm text-[#8b8175]">Looking through your dates…</p>
          ) : onThisDay.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {onThisDay.map(({ photo, year }, index) => (
                <button key={photo.id} type="button" onClick={() => setViewerId(photo.id)} className={`group min-w-0 text-left ${index === 1 ? 'sm:mt-5' : ''}`}>
                  <MemoryPhotoImage photo={photo} alt={photo.title} className={`${index % 2 ? 'aspect-[0.86/1]' : 'aspect-[0.96/1]'} transition-transform duration-300 group-hover:-translate-y-1`} />
                  <span className="mt-2 block truncate text-xs font-medium text-[#514a40]">{photo.title}</span>
                  <span className="mt-0.5 block text-[0.62rem] text-[#91877b]">{year} · {photo.caption || 'A moment returned'}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#eee8df]/70 px-5 py-5">
              <p className="max-w-2xl text-sm leading-6 text-[#82796e]">
                {photos.some((photo) => photo.date)
                  ? 'There are no earlier photographs dated today yet. You can still wander through your story in the Life Timeline.'
                  : 'Add dates to your photographs and moments from this day in earlier years will appear here.'}
              </p>
              <Link to="/timeline" className="auth-secondary shrink-0">Explore all timeline memories <ArrowRight size={14} /></Link>
            </div>
          )}
        </section>

        <section className="mt-12 grid gap-9 border-y border-[#302d29]/12 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">Written by you</p>
                <h2 className="serif text-3xl">Recently gathered stories</h2>
              </div>
              <Link to="/stories" className="inline-flex items-center gap-1 text-[0.68rem] text-[#8b7861] hover:text-[#302d29]">All stories <ChevronRight size={14} /></Link>
            </div>
            {loading ? (
              <p role="status" className="py-4 text-sm text-[#8b8175]">Opening your stories…</p>
            ) : recentStories.length ? (
              <div className="divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
                {recentStories.map((story) => {
                  const cover = story.photoIds.map((id) => photos.find((photo) => photo.id === id)).find((photo) => photo !== undefined)
                  return (
                    <Link key={story.id} to={`/stories/${story.id}`} className="group flex items-center gap-3 py-3">
                      {cover ? <MemoryPhotoImage photo={cover} alt="" className="h-14 w-16 shrink-0" /> : <span className="flex h-14 w-16 shrink-0 items-center justify-center bg-[#eae2d6] text-[#8b7861]"><BookHeart size={20} /></span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate serif text-xl">{story.title || 'Untitled story'}</span>
                        <span className="mt-1 block truncate text-[0.62rem] text-[#8b8175]">{story.category} · {story.state}{story.date ? ` · ${story.date}` : ''}</span>
                      </span>
                      <ChevronRight size={16} className="text-[#9b9083] transition group-hover:translate-x-1" />
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="flex min-h-36 flex-col items-center justify-center bg-[#eee8df]/65 px-5 text-center">
                <p className="serif text-2xl">Some moments deserve a few more words.</p>
                <Link to="/stories/new" className="mt-3 inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.12em] text-[#8b7861]">Write your first story <ArrowRight size={13} /></Link>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center bg-[#eee8df]/65 px-6 py-6 sm:px-8">
            <p className="eyebrow mb-2">A gentle question for today</p>
            <h2 className="serif text-3xl leading-snug">{featuredPrompt.text}</h2>
            <p className="mt-3 text-[0.65rem] uppercase tracking-[0.12em] text-[#8b7861]">{featuredPrompt.category}</p>
            <Link to={`/prompts?prompt=${featuredPrompt.id}`} className="auth-primary mt-5 w-fit min-h-10">Write a reflection <ArrowRight size={14} /></Link>
            <Link to="/prompts" className="mt-3 w-fit text-[0.68rem] text-[#8b7861] hover:text-[#302d29]">Browse all memory prompts</Link>
          </div>
        </section>

        <section className="mt-12 grid gap-10 border-b border-[#302d29]/12 pb-9 lg:grid-cols-2 lg:gap-14">
          <CollectionPreview
            title="Memory Books"
            eyebrow="A life, gathered in pages"
            icon="book"
            items={recentBooks.map((book) => ({
              id: book.id,
              title: book.title || 'Untitled book',
              detail: `${book.pages.length} ${book.pages.length === 1 ? 'page' : 'pages'} · ${book.theme}`,
              image: photos.find((photo) => photo.id === book.coverPhotoId) ??
                book.pages.flatMap((page) => page.photoIds).map((id) => photos.find((photo) => photo.id === id)).find((photo) => photo !== undefined),
              href: `/books/${book.id}/preview`,
            }))}
            loading={loading}
            empty="Gather photographs and stories into a keepsake of your own."
            emptyAction="Create a memory book"
            createHref="/books/new"
            allHref="/books"
          />
          <CollectionPreview
            title="Memory Reels"
            eyebrow="Moments, in sequence"
            icon="reel"
            items={recentReels.map((reel) => ({
              id: reel.id,
              title: reel.title || 'Untitled reel',
              detail: `${reel.slides.length} ${reel.slides.length === 1 ? 'frame' : 'frames'} · ${reel.theme}`,
              image: reel.slides.map((slide) => photos.find((photo) => photo.id === slide.photoId)).find((photo) => photo !== undefined),
              href: `/reels/${reel.id}/preview`,
            }))}
            loading={loading}
            empty="Arrange a few photographs into a little journey through time."
            emptyAction="Create a memory reel"
            createHref="/reels/new"
            allHref="/reels"
          />
        </section>

        <section className="mt-12 grid gap-8 border-b border-[#302d29]/12 pb-9 lg:grid-cols-[1fr_1fr]">
          <div className="border border-[#302d29]/10 bg-[#eee8df]/55 p-5 sm:p-7">
            <div className="mb-5 flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">A message from today</p><h2 className="serif text-3xl">Time Capsules</h2></div><Link to="/capsules" className="text-[0.68rem] text-[#8b7861]">All capsules <ChevronRight size={13} className="inline" /></Link></div>
            {loading ? <p role="status" className="py-3 text-sm text-[#8b8175]">Looking ahead…</p> : <div className="space-y-5">
              <div><p className="mb-2 text-[0.6rem] uppercase tracking-[0.13em] text-[#8b8175]">Upcoming unlocks</p>{upcomingCapsules.length ? <div className="space-y-2">{upcomingCapsules.map((capsule) => <Link key={capsule.id} to={`/capsules/${capsule.id}`} className="flex items-center justify-between gap-3 border-b border-[#302d29]/10 py-2"><span className="truncate serif text-xl">{capsule.title}</span><span className="shrink-0 text-[0.62rem] text-[#8b7861]">{formatLocalDate(capsule.unlockDate)}</span></Link>)}</div> : <p className="text-xs text-[#82796e]">No sealed capsules are waiting for an unlock date yet.</p>}</div>
              <div><p className="mb-2 text-[0.6rem] uppercase tracking-[0.13em] text-[#8b8175]">Recently opened</p>{openedCapsules.length ? <div className="space-y-2">{openedCapsules.map((capsule) => <Link key={capsule.id} to={`/capsules/${capsule.id}`} className="flex items-center gap-3 border-b border-[#302d29]/10 py-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#fbf9f5] text-[#8b7861]"><LockKeyhole size={15} /></span><span className="min-w-0"><span className="block truncate serif text-xl">{capsule.title}</span><span className="text-[0.6rem] text-[#8b8175]">{capsule.openedAt ? formatLocalDate(capsule.openedAt.slice(0, 10)) : 'Opened'}</span></span></Link>)}</div> : <p className="text-xs text-[#82796e]">Opened capsules will be gathered here.</p>}</div>
            </div>}
            <p className="mt-4 border-t border-[#302d29]/10 pt-3 text-[0.6rem] leading-5 text-[#8b8175]">Stored on this device only · no scheduled delivery or cross-device sync.</p>
          </div>
          <div className="border border-[#302d29]/10 bg-[#fbf9f5] p-5 sm:p-7">
            <div className="mb-5 flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">Across the generations</p><h2 className="serif text-3xl">Family Legacy</h2></div><Link to="/family" className="text-[0.68rem] text-[#8b7861]">Visit legacy <ChevronRight size={13} className="inline" /></Link></div>
            {loading ? <p role="status" className="py-3 text-sm text-[#8b8175]">Gathering family stories…</p> : <div className="space-y-5">
              <div><p className="mb-2 text-[0.6rem] uppercase tracking-[0.13em] text-[#8b8175]">Featured family stories</p>{featuredFamilyStories.length ? featuredFamilyStories.map((story) => {
                const cover = story.photoIds.map((id) => photos.find((photo) => photo.id === id)).find((photo) => photo !== undefined)
                return <Link key={story.id} to={`/family/stories/${story.id}/edit`} className="flex items-center gap-3 border-b border-[#302d29]/10 py-2">{cover ? <MemoryPhotoImage photo={cover} alt="" className="h-12 w-14 shrink-0" /> : <span className="flex h-12 w-14 shrink-0 items-center justify-center bg-[#eee8df] text-[#8b7861]"><UsersRound size={17} /></span>}<span className="min-w-0"><span className="block truncate serif text-xl">{story.title}</span><span className="block truncate text-[0.6rem] text-[#8b8175]">{story.category}</span></span></Link>
              }) : <Link to="/family/stories/new" className="text-xs text-[#8b7861]">Add the first family story <ArrowRight size={13} className="inline" /></Link>}</div>
              <div><p className="mb-2 text-[0.6rem] uppercase tracking-[0.13em] text-[#8b8175]">Upcoming family dates</p>{upcomingFamilyMilestones.length ? upcomingFamilyMilestones.map((milestone) => {
                const names = milestone.memberIds.map((id) => familyMembers.find((member) => member.id === id)?.name).filter((name) => name)
                return <Link key={milestone.id} to="/family?view=milestones" className="flex items-center justify-between gap-3 border-b border-[#302d29]/10 py-2"><span className="min-w-0"><span className="block truncate serif text-lg">{milestone.title}</span><span className="block truncate text-[0.6rem] text-[#8b8175]">{names.join(', ') || milestone.category}</span></span><span className="shrink-0 text-[0.62rem] text-[#8b7861]">{formatLocalDate(milestone.date)}</span></Link>
              }) : <Link to="/family" className="text-xs text-[#8b7861]">Record a family milestone <ArrowRight size={13} className="inline" /></Link>}</div>
            </div>}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#302d29]/10 pt-3"><Link to="/capsules/new" className="text-[0.62rem] text-[#8b7861]">Create a time capsule <ArrowRight size={12} className="inline" /></Link><Link to="/family/stories/new" className="text-[0.62rem] text-[#8b7861]">Add a family story <ArrowRight size={12} className="inline" /></Link></div>
          </div>
        </section>

        <section className="mt-12 grid gap-8 border-y border-[#302d29]/12 py-8 lg:grid-cols-[1fr_1fr]">
          <div className="border border-[#302d29]/10 bg-[#fbf9f5] p-5 sm:p-7">
            <div className="mb-4 flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">A circle of your choosing</p><h2 className="serif text-3xl">Shared Albums</h2></div><Link to="/shared-albums" className="text-[0.68rem] text-[#8b7861]">All albums <ChevronRight size={13} className="inline" /></Link></div>
            {loading ? <p role="status" className="py-3 text-sm text-[#8b8175]">Gathering shared albums…</p> : <div className="space-y-4">
              <div><p className="mb-2 text-[0.6rem] uppercase tracking-[0.13em] text-[#8b8175]">Recently updated</p>{recentSharedAlbums.length ? recentSharedAlbums.map((sharedAlbum) => {
                const cover = sharedAlbum.photoIds.map((id) => photos.find((photo) => photo.id === id)).find((photo) => photo !== undefined)
                return <Link key={sharedAlbum.id} to={`/shared-albums/${sharedAlbum.id}`} className="flex items-center gap-3 border-b border-[#302d29]/10 py-2">{cover ? <MemoryPhotoImage photo={cover} alt="" className="h-12 w-14 shrink-0" /> : <span className="flex h-12 w-14 shrink-0 items-center justify-center bg-[#eee8df] text-[#8b7861]"><UsersRound size={16} /></span>}<span className="min-w-0"><span className="block truncate serif text-xl">{sharedAlbum.name}</span><span className="text-[0.6rem] text-[#8b8175]">{sharedAlbum.photoIds.length} photographs · local demo</span></span></Link>
              }) : <Link to="/shared-albums" className="text-xs text-[#8b7861]">Create your first shared album <ArrowRight size={13} className="inline" /></Link>}</div>
              <div><p className="mb-2 text-[0.6rem] uppercase tracking-[0.13em] text-[#8b8175]">Pending invitation previews</p>{pendingSharedInvitations.length ? pendingSharedInvitations.map(({ album, collaborator }) => <Link key={collaborator.id} to={`/shared-albums/${album.id}`} className="flex items-center justify-between gap-3 border-b border-[#302d29]/10 py-2"><span className="min-w-0"><span className="block truncate text-xs font-medium">{collaborator.name}</span><span className="block truncate text-[0.6rem] text-[#8b8175]">{album.name} · {collaborator.permission}</span></span><span className="shrink-0 text-[0.58rem] text-[#8b7861]">Preview</span></Link>) : <p className="text-xs text-[#82796e]">Invitation previews you create will be gathered here. Nothing is emailed.</p>}</div>
            </div>}
            <Link to="/shared-albums" className="mt-4 inline-flex items-center gap-1 border-t border-[#302d29]/10 pt-3 text-[0.62rem] text-[#8b7861]">Create a shared album <ArrowRight size={12} /></Link>
          </div>
          <div className="border border-[#302d29]/10 bg-[#eee8df]/60 p-5 sm:p-7">
            <div className="mb-4 flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">A thoughtful second look</p><h2 className="serif text-3xl">Memory Curator</h2></div><Link to="/curator" className="text-[0.68rem] text-[#8b7861]">All suggestions <ChevronRight size={13} className="inline" /></Link></div>
            {featuredCuratorSuggestions.length ? <div className="space-y-3">{featuredCuratorSuggestions.map((suggestion) => {
              const photo = photos.find((item) => item.id === suggestion.photoIds[0])
              return <Link key={suggestion.id} to="/curator" className="flex items-center gap-3 border-b border-[#302d29]/10 py-2">{photo ? <MemoryPhotoImage photo={photo} alt="" className="h-12 w-14 shrink-0" /> : <span className="flex h-12 w-14 shrink-0 items-center justify-center bg-[#fbf9f5] text-[#8b7861]"><Sparkles size={16} /></span>}<span className="min-w-0"><span className="block truncate serif text-lg">{suggestion.title}</span><span className="block truncate text-[0.6rem] text-[#8b8175]">{suggestion.description}</span></span></Link>
            })}</div> : <p className="py-3 text-xs text-[#82796e]">Add photographs to discover locally generated suggestions.</p>}
            <p className="mt-4 border-t border-[#302d29]/10 pt-3 text-[0.6rem] leading-5 text-[#8b8175]">Deterministic local suggestions · no AI service or photo uploads.</p>
            <Link to="/curator" className="mt-3 inline-flex items-center gap-1 text-[0.62rem] text-[#8b7861]">Organize memories <ArrowRight size={12} /></Link>
          </div>
        </section>

        <section className="mt-12 grid gap-10 border-t border-[#302d29]/12 pt-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div className="flex flex-col justify-center">
            <p className="eyebrow mb-2">A gentle invitation</p>
            <h2 className="serif text-4xl leading-tight">A moment may be waiting to find you again.</h2>
            <p className="mt-3 text-sm leading-6 text-[#82796e]">Take a wander through the photographs you have gathered. You never know what might come back.</p>
            <Link to="/memories" className="auth-secondary mt-5 w-fit">Rediscover memories <ArrowRight size={14} /></Link>
          </div>
          <div>
            <div className="mb-5">
              <p className="eyebrow mb-2">A little inspiration</p>
              <h2 className="serif text-3xl">The stories behind the stills</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {keepsakeImages.map((item, index) => (
                <figure key={item.src} className={index === 1 ? 'mt-5' : ''}>
                  <div className="photo-fallback aspect-[0.82] overflow-hidden">
                    <img
                      src={item.src}
                      alt={item.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <figcaption className="serif mt-2 text-sm italic leading-4 text-[#746b60]">
                    {item.note}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-4 text-[0.63rem] text-[#978d80]">
              Editorial inspiration only · These are not your saved memories.
            </p>
          </div>
        </section>

        <section className="mt-12 flex flex-col justify-between gap-5 border-t border-[#302d29]/12 pt-6 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow mb-1.5">Your story is yours to shape</p>
            <p className="serif text-2xl">Take it one lovely moment at a time.</p>
          </div>
          <div className="inline-flex items-center gap-2 self-start border border-[#c8b7a2] px-4 py-2.5 text-[0.67rem] text-[#756d62] sm:self-auto">
            <CalendarDays size={14} strokeWidth={1.6} />
            <span>Your local archive, gathered with care</span>
          </div>
        </section>
      </motion.div>
      {uploadOpen && <PhotoUploadDialog onClose={() => setUploadOpen(false)} />}
      {albumOpen && <AlbumEditorDialog onClose={() => setAlbumOpen(false)} />}
      {viewerId && photos.some((photo) => photo.id === viewerId) && (
        <PhotoViewer photos={photos} photoId={viewerId} onClose={() => setViewerId(null)} />
      )}
    </div>
  )
}

function formatLocalDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatStorageBytes(bytes: number) {
  if (!bytes) return '0 bytes'
  const units = ['bytes', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

function CollectionPreview({
  title,
  eyebrow,
  icon,
  items,
  loading,
  empty,
  emptyAction,
  createHref,
  allHref,
}: {
  title: string
  eyebrow: string
  icon: 'book' | 'reel'
  items: Array<{
    id: string
    title: string
    detail: string
    image?: ReturnType<typeof useMemory>['photos'][number]
    href: string
  }>
  loading: boolean
  empty: string
  emptyAction: string
  createHref: string
  allHref: string
}) {
  const Icon = icon === 'book' ? BookOpen : Film
  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div><p className="eyebrow mb-2">{eyebrow}</p><h2 className="serif text-3xl">{title}</h2></div>
        <Link to={allHref} className="inline-flex items-center gap-1 text-[0.68rem] text-[#8b7861] hover:text-[#302d29]">All {title.toLowerCase()} <ChevronRight size={14} /></Link>
      </div>
      {loading ? <p role="status" className="py-4 text-sm text-[#8b8175]">Gathering your {title.toLowerCase()}…</p> : items.length ? (
        <div className="divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
          {items.map((item) => (
            <Link key={item.id} to={item.href} className="group flex items-center gap-3 py-3">
              {item.image ? <MemoryPhotoImage photo={item.image} alt="" className="h-14 w-16 shrink-0" /> : <span className="flex h-14 w-16 shrink-0 items-center justify-center bg-[#eae2d6] text-[#8b7861]"><Icon size={20} /></span>}
              <span className="min-w-0 flex-1"><span className="block truncate serif text-xl">{item.title}</span><span className="mt-1 block truncate text-[0.62rem] text-[#8b8175]">{item.detail}</span></span>
              <ChevronRight size={16} className="text-[#9b9083] transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex min-h-36 flex-col items-center justify-center bg-[#eee8df]/65 px-5 text-center">
          <p className="serif text-2xl">{empty}</p>
          <Link to={createHref} className="mt-3 inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.12em] text-[#8b7861]">{emptyAction} <ArrowRight size={13} /></Link>
        </div>
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Images
  label: string
  value: string
}) {
  return (
    <div className="flex min-h-[5.5rem] items-center gap-3 px-2 sm:gap-4 sm:px-5">
      <span className="flex h-9 w-9 items-center justify-center bg-[#eee8df] text-[#88745b]">
        <Icon size={16} strokeWidth={1.6} />
      </span>
      <div>
        <p className="serif text-2xl leading-none">{value}</p>
        <p className="mt-1 text-[0.61rem] text-[#8b8175] sm:text-[0.68rem]">{label}</p>
      </div>
    </div>
  )
}
