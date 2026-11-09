import { useState } from 'react'
import {
  Aperture,
  Bell,
  BookHeart,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Film,
  Heart,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  BookOpen,
  Settings2,
  Sparkles,
  UsersRound,
  Trash2,
  X,
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../components/useToast'
import { useMemory } from '../data/useMemory'

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
  to?: string
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Your sanctuary',
    items: [{ label: 'My Sanctuary', icon: LayoutDashboard, to: '/' }],
  },
  {
    title: 'Your memories',
    items: [
      { label: 'My Memories', icon: Images, to: '/memories' },
      { label: 'My Albums', icon: Aperture, to: '/albums' },
      { label: 'Favorites', icon: Heart, to: '/favorites' },
      { label: 'Life Timeline', icon: CalendarDays, to: '/timeline' },
      { label: 'On This Day', icon: Clock3, to: '/on-this-day' },
      { label: 'My Memory Wall', icon: Images, to: '/memory-wall' },
    ],
  },
  {
    title: 'Your stories',
    items: [
      { label: 'Memory Stories', icon: BookHeart, to: '/stories' },
      { label: 'Memory Prompts', icon: Sparkles, to: '/prompts' },
      { label: 'Memory Books', icon: BookOpen, to: '/books' },
      { label: 'Memory Reels', icon: Film, to: '/reels' },
      { label: 'Time Capsules', icon: Clock3, to: '/capsules' },
      { label: 'Family Legacy', icon: UsersRound, to: '/family' },
      { label: 'Shared Albums', icon: UsersRound, to: '/shared-albums' },
      { label: 'AI Curator', icon: Sparkles, to: '/curator' },
    ],
  },
  {
    title: 'Your account',
    items: [
      { label: 'Profile & Settings', icon: Settings2, to: '/profile' },
      { label: 'Recently Deleted', icon: Trash2, to: '/recently-deleted' },
      { label: 'Notifications', icon: Bell, to: '/notifications' },
      { label: 'Help & FAQ', icon: CircleHelp, to: '/help' },
    ],
  },
]

function isNavActive(pathname: string, to?: string) {
  return pathname === (to ?? '/') ||
    (to === '/albums' && pathname.startsWith('/albums/')) ||
    (to === '/stories' && pathname.startsWith('/stories')) ||
    (to === '/books' && pathname.startsWith('/books/')) ||
    (to === '/reels' && pathname.startsWith('/reels/')) ||
    (to === '/capsules' && pathname.startsWith('/capsules/')) ||
    (to === '/family' && pathname.startsWith('/family/'))
    || (to === '/shared-albums' && pathname.startsWith('/shared-albums/'))
    || (to === '/profile' && pathname === '/settings')
}

export function AppLayout() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const { notifications } = useMemory()
  const unreadCount = notifications.filter((notification) => !notification.readAt).length
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'You could not be signed out.', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef] md:flex">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-[#24221f]/35 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[17.2rem] flex-col border-r border-[#302d29]/10 bg-[#fbf9f5] px-5 pb-5 pt-6 transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-9 flex items-center justify-between px-2">
          <Link
            to="/"
            className="serif text-[1.65rem] tracking-[0.12em] text-[#302d29]"
            onClick={() => setMenuOpen(false)}
          >
            EVERMINE
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="rounded-full p-2 text-[#756d62] hover:bg-[#eee8df] md:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mb-7 flex items-center gap-3 border-y border-[#302d29]/10 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8dfd3] serif text-lg text-[#6b5945]">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#302d29]">
              {user?.fullName}
            </p>
            <p className="mt-0.5 text-[0.65rem] text-[#8b8175]">Personal sanctuary</p>
          </div>
          <ChevronDown size={15} className="text-[#958a7d]" aria-hidden="true" />
        </div>
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="eyebrow mb-2 px-3 text-[0.58rem]">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map(({ label, icon: Icon, to }) => (
                    <Link
                      key={label}
                      to={to ?? '/'}
                      data-active={isNavActive(location.pathname, to)}
                      aria-current={isNavActive(location.pathname, to) ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                      className="sidebar-link text-[0.8rem]"
                    >
                      <Icon size={16} strokeWidth={1.7} aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-[#302d29]/10 pt-3">
          <p className="mb-2 flex items-center gap-2 px-3 text-[0.61rem] text-[#8b8175]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a68c70]" />
            Local demo · Saved on this device
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="sidebar-link text-[0.78rem]"
          >
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[4.25rem] items-center justify-between border-b border-[#302d29]/10 bg-[#f8f5ef]/95 px-5 backdrop-blur-sm sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMenuOpen(true)}
              className="rounded-full p-2 text-[#514a40] hover:bg-[#ece6dc] md:hidden"
            >
              <Menu size={19} />
            </button>
            <div className="hidden items-center gap-2 text-[0.68rem] text-[#8b8175] sm:flex">
              <Compass size={14} strokeWidth={1.7} />
              <span>Your personal archive</span>
            </div>
            <span className="serif text-xl tracking-[0.1em] md:hidden">EVERMINE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-3 hidden text-[0.65rem] text-[#8b8175] sm:inline">
              A quiet place to remember
            </span>
            <Link
              to="/notifications"
              title={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
              aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              className="relative rounded-full p-2.5 text-[#71685d] hover:bg-[#ece6dc]"
              data-active={isNavActive(location.pathname, '/notifications')}
            >
              <Bell size={17} strokeWidth={1.7} />
              {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#805449] px-1 text-[0.53rem] font-semibold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </Link>
            <Link
              to="/settings"
              title="Settings"
              aria-label="Settings"
              className="rounded-full p-2.5 text-[#71685d] hover:bg-[#ece6dc]"
              data-active={isNavActive(location.pathname, '/profile')}
            >
              <Settings2 size={17} strokeWidth={1.7} />
            </Link>
            <Link
              to="/help"
              title="Help & FAQ"
              aria-label="Help and frequently asked questions"
              className="rounded-full p-2.5 text-[#71685d] hover:bg-[#ece6dc]"
            >
              <CircleHelp size={17} strokeWidth={1.7} />
            </Link>
          </div>
        </header>
        <main className="w-full flex-1 px-5 pb-12 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pt-12">
          <Outlet />
        </main>
        <footer className="flex items-center justify-between border-t border-[#302d29]/10 px-5 py-5 text-[0.61rem] text-[#91877b] sm:px-8 lg:px-12">
          <span>EVERMINE · Your moments, held with care.</span>
          <span className="hidden sm:inline">Local-first prototype</span>
        </footer>
      </div>
    </div>
  )
}
