import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import { ToastProvider } from './components/Toast'
import { MemoryProvider } from './data/MemoryProvider'

const AppLayout = lazy(() =>
  import('./layouts/AppLayout').then((module) => ({ default: module.AppLayout })),
)
const AuthLayout = lazy(() =>
  import('./layouts/AuthLayout').then((module) => ({ default: module.AuthLayout })),
)
const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })),
)
const SanctuaryPage = lazy(() =>
  import('./pages/SanctuaryPage').then((module) => ({
    default: module.SanctuaryPage,
  })),
)
const MemoryLibraryPage = lazy(() =>
  import('./pages/MemoryLibraryPage').then((module) => ({
    default: module.MemoryLibraryPage,
  })),
)
const AlbumsPage = lazy(() =>
  import('./pages/AlbumsPage').then((module) => ({ default: module.AlbumsPage })),
)
const AlbumDetailPage = lazy(() =>
  import('./pages/AlbumDetailPage').then((module) => ({
    default: module.AlbumDetailPage,
  })),
)
const LifeTimelinePage = lazy(() =>
  import('./pages/LifeTimelinePage').then((module) => ({
    default: module.LifeTimelinePage,
  })),
)
const OnThisDayPage = lazy(() =>
  import('./pages/OnThisDayPage').then((module) => ({
    default: module.OnThisDayPage,
  })),
)
const MemoryStoriesPage = lazy(() =>
  import('./pages/MemoryStoriesPage').then((module) => ({
    default: module.MemoryStoriesPage,
  })),
)
const MemoryPromptsPage = lazy(() =>
  import('./pages/MemoryPromptsPage').then((module) => ({
    default: module.MemoryPromptsPage,
  })),
)
const MemoryBooksPage = lazy(() =>
  import('./pages/MemoryBooksPage').then((module) => ({
    default: module.MemoryBooksPage,
  })),
)
const MemoryReelsPage = lazy(() =>
  import('./pages/MemoryReelsPage').then((module) => ({
    default: module.MemoryReelsPage,
  })),
)
const TimeCapsulesPage = lazy(() =>
  import('./pages/TimeCapsulesPage').then((module) => ({
    default: module.TimeCapsulesPage,
  })),
)
const FamilyLegacyPage = lazy(() =>
  import('./pages/FamilyLegacyPage').then((module) => ({
    default: module.FamilyLegacyPage,
  })),
)
const SharedAlbumsPage = lazy(() =>
  import('./pages/SharedAlbumsPage').then((module) => ({
    default: module.SharedAlbumsPage,
  })),
)
const MemoryCuratorPage = lazy(() =>
  import('./pages/MemoryCuratorPage').then((module) => ({
    default: module.MemoryCuratorPage,
  })),
)
const MemoryWallPage = lazy(() =>
  import('./pages/MemoryWallPage').then((module) => ({ default: module.MemoryWallPage })),
)
const ProfileSettingsPage = lazy(() =>
  import('./pages/ProfileSettingsPage').then((module) => ({
    default: module.ProfileSettingsPage,
  })),
)
const RecentlyDeletedPage = lazy(() =>
  import('./pages/RecentlyDeletedPage').then((module) => ({
    default: module.RecentlyDeletedPage,
  })),
)
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((module) => ({
    default: module.NotificationsPage,
  })),
)
const HelpFAQPage = lazy(() =>
  import('./pages/HelpFAQPage').then((module) => ({ default: module.HelpFAQPage })),
)
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })),
)

function PageLoading() {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] items-center justify-center text-sm text-[#8b8175]"
    >
      Opening your sanctuary…
    </div>
  )
}

function ProtectedRoute() {
  const { user, authReady } = useAuth()
  if (!authReady) {
    return <Suspense fallback={<PageLoading />}><PageLoading /></Suspense>
  }
  return user ? (
    <Suspense fallback={<PageLoading />}>
      <MemoryProvider>
        <AppLayout />
      </MemoryProvider>
    </Suspense>
  ) : (
    <Navigate to="/login" replace />
  )
}

function PublicOnlyRoute() {
  const { user, authReady } = useAuth()
  if (!authReady) return <PageLoading />
  return user ? (
    <Navigate to="/" replace />
  ) : (
    <Suspense fallback={<PageLoading />}>
      <AuthLayout />
    </Suspense>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
      </Route>
      <Route path="/reset-password" element={<AuthLayout />}>
        <Route index element={<ResetPasswordPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<SanctuaryPage />} />
        <Route
          path="/memories"
          element={<MemoryLibraryPage mode="memories" />}
        />
        <Route path="/albums" element={<AlbumsPage />} />
        <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
        <Route
          path="/favorites"
          element={<MemoryLibraryPage mode="favorites" />}
        />
        <Route path="/timeline" element={<LifeTimelinePage />} />
        <Route path="/on-this-day" element={<OnThisDayPage />} />
        <Route path="/stories" element={<MemoryStoriesPage />} />
        <Route path="/stories/new" element={<MemoryStoriesPage />} />
        <Route path="/stories/:storyId/edit" element={<MemoryStoriesPage />} />
        <Route path="/stories/:storyId" element={<MemoryStoriesPage />} />
        <Route path="/prompts" element={<MemoryPromptsPage />} />
        <Route path="/books" element={<MemoryBooksPage />} />
        <Route path="/books/new" element={<MemoryBooksPage />} />
        <Route path="/books/:bookId/edit" element={<MemoryBooksPage />} />
        <Route path="/books/:bookId/preview" element={<MemoryBooksPage />} />
        <Route path="/reels" element={<MemoryReelsPage />} />
        <Route path="/reels/new" element={<MemoryReelsPage />} />
        <Route path="/reels/:reelId/edit" element={<MemoryReelsPage />} />
        <Route path="/reels/:reelId/preview" element={<MemoryReelsPage />} />
        <Route path="/capsules" element={<TimeCapsulesPage />} />
        <Route path="/capsules/new" element={<TimeCapsulesPage />} />
        <Route path="/capsules/:capsuleId/edit" element={<TimeCapsulesPage />} />
        <Route path="/capsules/:capsuleId" element={<TimeCapsulesPage />} />
        <Route path="/family" element={<FamilyLegacyPage />} />
        <Route path="/family/stories/new" element={<FamilyLegacyPage />} />
        <Route path="/family/stories/:familyStoryId/edit" element={<FamilyLegacyPage />} />
        <Route path="/shared-albums" element={<SharedAlbumsPage />} />
        <Route path="/shared-albums/:sharedAlbumId" element={<SharedAlbumsPage />} />
        <Route path="/curator" element={<MemoryCuratorPage />} />
        <Route path="/memory-wall" element={<MemoryWallPage />} />
        <Route path="/profile" element={<ProfileSettingsPage />} />
        <Route path="/settings" element={<ProfileSettingsPage />} />
        <Route path="/recently-deleted" element={<RecentlyDeletedPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/help" element={<HelpFAQPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
