import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { getDemoAccountCreatedAt } from '../auth/authStorage'
import { useToast } from '../components/useToast'
import {
  loadAlbums,
  loadBooks,
  loadMilestones,
  loadPromptResponses,
  loadPhotos,
  loadReels,
  loadStories,
  loadCapsules,
  loadFamilyMembers,
  loadFamilyStories,
  loadFamilyMilestones,
  loadSharedAlbums,
  loadCuratorSuggestions,
  loadDeletedPhotos,
  loadProfile,
  loadSettings,
  loadMemoryWalls,
  loadNotifications,
  movePhotosToTrash,
  restorePhotosFromTrash,
  permanentlyDeletePhotosFromTrash,
  clearOwnerData,
  removeAlbum,
  removeBook,
  removeMilestone,
  removePromptResponse,
  removeStory,
  removeReel,
  removeCapsule,
  removeFamilyMember,
  removeFamilyStory,
  removeFamilyMilestone,
  saveAlbum,
  saveBook,
  saveMilestone,
  savePromptResponse,
  savePhoto,
  saveReel,
  saveStory,
  saveCapsule,
  saveFamilyMember,
  saveFamilyStory,
  saveFamilyMilestone,
  saveSharedAlbum,
  removeSharedAlbum,
  saveCuratorSuggestion as saveCuratorSuggestionRecord,
  saveProfile as saveProfileRecord,
  saveSettings as saveSettingsRecord,
  saveMemoryWall as saveMemoryWallRecord,
  removeMemoryWall,
  saveNotification,
  removeNotification,
} from './memoryDatabase'
import { MemoryContext } from './memoryContext'
import type {
  AlbumDetails,
  LifeMilestone,
  MemoryAlbum,
  MemoryBook,
  MemoryBookDetails,
  MemoryPromptResponse,
  MemoryPhoto,
  MemoryReel,
  MemoryReelDetails,
  MemoryStory,
  MilestoneDetails,
  PromptResponseDetails,
  PhotoDetails,
  StoryDetails,
  FamilyMember,
  FamilyMemberDetails,
  FamilyStory,
  FamilyStoryDetails,
  FamilyMilestone,
  FamilyMilestoneDetails,
  TimeCapsule,
  TimeCapsuleDetails,
  SharedAlbum,
  SharedAlbumDetails,
  SharedAlbumPermission,
  CuratorSuggestion,
  DeletedMemoryPhoto,
  MemoryNotification,
  MemoryNotificationCategory,
  NotificationPreferences,
  MemorySettings,
  MemoryWallLayout,
  MemoryWallLayoutDetails,
  UserProfile,
  UserProfileDetails,
} from './memoryTypes'

export function MemoryProvider({ children }: { children: ReactNode }) {
  const { user: authenticatedUser, updateProfileName } = useAuth()
  const user = useMemo(
    () =>
      authenticatedUser
        ? {
            ...authenticatedUser,
            // Keep legacy email-owned demo records separate until the user explicitly imports them.
            email: authenticatedUser.id ?? authenticatedUser.email,
          }
        : null,
    [authenticatedUser],
  )
  const { showToast } = useToast()
  const [photos, setPhotos] = useState<MemoryPhoto[]>([])
  const [albums, setAlbums] = useState<MemoryAlbum[]>([])
  const [milestones, setMilestones] = useState<LifeMilestone[]>([])
  const [stories, setStories] = useState<MemoryStory[]>([])
  const [promptResponses, setPromptResponses] = useState<MemoryPromptResponse[]>([])
  const [books, setBooks] = useState<MemoryBook[]>([])
  const [reels, setReels] = useState<MemoryReel[]>([])
  const [capsules, setCapsules] = useState<TimeCapsule[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [familyStories, setFamilyStories] = useState<FamilyStory[]>([])
  const [familyMilestones, setFamilyMilestones] = useState<FamilyMilestone[]>([])
  const [sharedAlbums, setSharedAlbums] = useState<SharedAlbum[]>([])
  const [curatorSuggestions, setCuratorSuggestions] = useState<CuratorSuggestion[]>([])
  const [deletedPhotos, setDeletedPhotos] = useState<DeletedMemoryPhoto[]>([])
  const [profile, setProfile] = useState<UserProfile>(() => defaultProfile(user?.email ?? '', user?.fullName ?? ''))
  const [settings, setSettings] = useState<MemorySettings>(() => defaultSettings(user?.email ?? ''))
  const settingsRef = useRef(settings)
  const [memoryWalls, setMemoryWalls] = useState<MemoryWallLayout[]>([])
  const [notifications, setNotifications] = useState<MemoryNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState('')

  const reload = useCallback(async () => {
    if (!user) return
    try {
      const [nextPhotos, nextAlbums, nextMilestones, nextStories, nextResponses, nextBooks, nextReels, nextCapsules, nextMembers, nextFamilyStories, nextFamilyMilestones, nextSharedAlbums, nextCuratorSuggestions, nextDeletedPhotos, nextProfile, nextSettings, nextMemoryWalls, nextNotifications] = await Promise.all([
        loadPhotos(user.email),
        loadAlbums(user.email),
        loadMilestones(user.email),
        loadStories(user.email),
        loadPromptResponses(user.email),
        loadBooks(user.email),
        loadReels(user.email),
        loadCapsules(user.email),
        loadFamilyMembers(user.email),
        loadFamilyStories(user.email),
        loadFamilyMilestones(user.email),
        loadSharedAlbums(user.email),
        loadCuratorSuggestions(user.email),
        loadDeletedPhotos(user.email),
        loadProfile(user.email),
        loadSettings(user.email),
        loadMemoryWalls(user.email),
        loadNotifications(user.email),
      ])
      setPhotos(nextPhotos)
      setAlbums(nextAlbums)
      setMilestones(nextMilestones)
      setStories(nextStories)
      setPromptResponses(nextResponses)
      setBooks(nextBooks)
      setReels(nextReels)
      setCapsules(nextCapsules)
      setFamilyMembers(nextMembers)
      setFamilyStories(nextFamilyStories)
      setFamilyMilestones(nextFamilyMilestones)
      setSharedAlbums(nextSharedAlbums)
      setCuratorSuggestions(nextCuratorSuggestions)
      setDeletedPhotos(nextDeletedPhotos)
      setProfile(nextProfile ?? defaultProfile(user.email, user.fullName))
      const loadedSettings = nextSettings ?? defaultSettings(user.email)
      settingsRef.current = loadedSettings
      setSettings(loadedSettings)
      setMemoryWalls(nextMemoryWalls)
      setNotifications(nextNotifications)
      setStorageError('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Local memory storage could not be loaded.'
      setStorageError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, user])

  useEffect(() => {
    void reload()
  }, [reload])

  const recordNotification = useCallback(
    async (
      category: MemoryNotificationCategory,
      title: string,
      body: string,
      href: string,
    ) => {
      if (!user || !isNotificationEnabled(settings.notifications, category)) return
      const notification: MemoryNotification = {
        id: crypto.randomUUID(),
        ownerEmail: user.email,
        category,
        title,
        body,
        href,
        createdAt: new Date().toISOString(),
        readAt: null,
      }
      try {
        await saveNotification(notification)
        setNotifications((current) =>
          [notification, ...current].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The notification could not be saved.'
        showToast(`Your change was saved, but ${message.toLowerCase()}`, 'error')
      }
    },
    [settings.notifications, showToast, user],
  )

  const addPhoto = useCallback(
    async (photo: Omit<MemoryPhoto, 'ownerEmail'>) => {
      if (!user) throw new Error('Sign in before saving a photograph.')
      const record: MemoryPhoto = { ...photo, ownerEmail: user.email }
      try {
        await savePhoto(record)
        setPhotos((current) =>
          [record, ...current.filter((item) => item.id !== record.id)].sort(
            (a, b) => b.createdAt.localeCompare(a.createdAt),
          ),
        )
        await recordNotification(
          'memory-reminder',
          'A new memory is safe in your archive',
          `${record.title} was added to My Memories.`,
          '/memories',
        )
      } catch (error) {
        throw storageFailure(error, 'The photograph could not be saved.')
      }
    },
    [recordNotification, user],
  )

  const updatePhoto = useCallback(
    async (id: string, details: PhotoDetails) => {
      const existing = photos.find((photo) => photo.id === id)
      if (!existing) throw new Error('That photograph is no longer in your library.')
      const updated = { ...existing, ...details, updatedAt: new Date().toISOString() }
      try {
        await savePhoto(updated)
        setPhotos((current) => current.map((photo) => (photo.id === id ? updated : photo)))
      } catch (error) {
        throw storageFailure(error, 'The photograph details could not be saved.')
      }
    },
    [photos],
  )

  const deletePhotos = useCallback(
    async (ids: string[]) => {
      const uniqueIds = [...new Set(ids)]
      const deleted = new Set(uniqueIds)
      if (!user) throw new Error('Sign in before deleting photographs.')
      const moved = photos
        .filter((photo) => deleted.has(photo.id))
        .map((photo) => ({
          id: photo.id,
          ownerEmail: user.email,
          photo,
          deletedAt: new Date().toISOString(),
        }))
      if (!moved.length) throw new Error('The selected photographs are no longer available.')
      try {
        await movePhotosToTrash(moved)
        setPhotos((current) => current.filter((photo) => !deleted.has(photo.id)))
        setDeletedPhotos((current) =>
          [...moved, ...current.filter((item) => !deleted.has(item.id))]
            .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)),
        )
      } catch (error) {
        throw storageFailure(error, 'The selected photographs could not be moved to Recently Deleted.')
      }
    },
    [photos, user],
  )

  const restorePhotos = useCallback(
    async (ids: string[]) => {
      const selected = new Set(ids)
      const items = deletedPhotos.filter((item) => selected.has(item.id))
      if (!items.length) throw new Error('Those photographs are no longer in Recently Deleted.')
      try {
        await restorePhotosFromTrash(items)
        setDeletedPhotos((current) => current.filter((item) => !selected.has(item.id)))
        setPhotos((current) =>
          [...items.map((item) => item.photo), ...current]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        )
      } catch (error) {
        throw storageFailure(error, 'The selected photographs could not be restored.')
      }
    },
    [deletedPhotos],
  )

  const permanentlyDeletePhotos = useCallback(
    async (ids: string[]) => {
      const selected = new Set(ids)
      const items = deletedPhotos.filter((item) => selected.has(item.id))
      if (!items.length || !user) throw new Error('Those photographs are no longer in Recently Deleted.')
      try {
        await permanentlyDeletePhotosFromTrash(items.map((item) => item.id), user.email)
        setDeletedPhotos((current) => current.filter((item) => !selected.has(item.id)))
        await reload()
      } catch (error) {
        throw storageFailure(error, 'The selected photographs could not be permanently deleted.')
      }
    },
    [deletedPhotos, reload, user],
  )

  const persistProfile = useCallback(
    async (details: UserProfileDetails) => {
      if (!user) throw new Error('Sign in before editing your profile.')
      const fullName = details.fullName.trim()
      if (fullName.length < 2) throw new Error('Enter a name with at least two characters.')
      if (details.biography.length > 500) throw new Error('Keep your biography to 500 characters or fewer.')
      const updated: UserProfile = {
        ...profile,
        id: user.email,
        ownerEmail: user.email,
        fullName,
        biography: details.biography.trim(),
        photoBlob: details.photoBlob,
        updatedAt: new Date().toISOString(),
      }
      try {
        await saveProfileRecord(updated)
        await updateProfileName(fullName)
        setProfile(updated)
      } catch (error) {
        throw storageFailure(error, 'Your profile could not be saved.')
      }
    },
    [profile, updateProfileName, user],
  )

  const persistSettings = useCallback(
    async (nextSettings: MemorySettings) => {
      if (!user) throw new Error('Sign in before updating settings.')
      const previous = settingsRef.current
      const merged = mergeSettingsChanges(settings, previous, nextSettings)
      const updated = {
        ...merged,
        id: user.email,
        ownerEmail: user.email,
        updatedAt: new Date().toISOString(),
      }
      settingsRef.current = updated
      setSettings(updated)
      try {
        await saveSettingsRecord(updated)
      } catch (error) {
        if (settingsRef.current === updated) {
          settingsRef.current = previous
          setSettings(previous)
        }
        throw storageFailure(error, 'Your settings could not be saved.')
      }
    },
    [settings, user],
  )

  const persistMemoryWall = useCallback(
    async (details: MemoryWallLayoutDetails, id?: string) => {
      if (!user) throw new Error('Sign in before saving a memory wall.')
      const name = details.name.trim()
      if (!name) throw new Error('Give this wall arrangement a name.')
      const now = new Date().toISOString()
      const existing = memoryWalls.find((wall) => wall.id === id && wall.ownerEmail === user.email)
      const availablePhotoIds = new Set([
        ...photos.map((photo) => photo.id),
        ...deletedPhotos.map((item) => item.id),
      ])
      const tiles = details.tiles
        .filter((tile, index, list) =>
          availablePhotoIds.has(tile.photoId) &&
          list.findIndex((item) => item.photoId === tile.photoId) === index,
        )
      if (!tiles.length) throw new Error('Add at least one saved photograph to your wall.')
      const wall: MemoryWallLayout = {
        id: existing?.id ?? crypto.randomUUID(),
        ownerEmail: user.email,
        name,
        layout: details.layout,
        background: details.background,
        tiles,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      try {
        await saveMemoryWallRecord(wall)
        setMemoryWalls((current) =>
          [wall, ...current.filter((item) => item.id !== wall.id)]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        )
        return wall.id
      } catch (error) {
        throw storageFailure(error, 'The memory wall could not be saved.')
      }
    },
    [deletedPhotos, memoryWalls, photos, user],
  )

  const removeMemoryWallLayout = useCallback(
    async (id: string) => {
      if (!memoryWalls.some((wall) => wall.id === id && wall.ownerEmail === user?.email)) {
        throw new Error('That saved wall arrangement is no longer available.')
      }
      try {
        await removeMemoryWall(id)
        setMemoryWalls((current) => current.filter((wall) => wall.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The memory wall arrangement could not be deleted.')
      }
    },
    [memoryWalls, user],
  )

  const markNotificationRead = useCallback(
    async (id: string) => {
      const notification = notifications.find((item) => item.id === id)
      if (!notification || notification.readAt) return
      const updated = { ...notification, readAt: new Date().toISOString() }
      try {
        await saveNotification(updated)
        setNotifications((current) => current.map((item) => item.id === id ? updated : item))
      } catch (error) {
        throw storageFailure(error, 'The notification could not be marked as read.')
      }
    },
    [notifications],
  )

  const markAllNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((item) => !item.readAt)
    if (!unread.length) return
    const readAt = new Date().toISOString()
    try {
      await Promise.all(unread.map((item) => saveNotification({ ...item, readAt })))
      setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt }))
    } catch (error) {
      throw storageFailure(error, 'Notifications could not be marked as read.')
    }
  }, [notifications])

  const removeOneNotification = useCallback(
    async (id: string) => {
      try {
        await removeNotification(id)
        setNotifications((current) => current.filter((item) => item.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The notification could not be deleted.')
      }
    },
    [],
  )

  const clearAllNotifications = useCallback(async () => {
    const currentIds = notifications.map((item) => item.id)
    try {
      await Promise.all(currentIds.map((id) => removeNotification(id)))
      setNotifications([])
    } catch (error) {
      throw storageFailure(error, 'Notifications could not be cleared.')
    }
  }, [notifications])

  const clearAllApplicationData = useCallback(async () => {
    if (!user) throw new Error('Sign in before clearing application data.')
    try {
      await clearOwnerData(user.email)
      setPhotos([])
      setAlbums([])
      setMilestones([])
      setStories([])
      setPromptResponses([])
      setBooks([])
      setReels([])
      setCapsules([])
      setFamilyMembers([])
      setFamilyStories([])
      setFamilyMilestones([])
      setSharedAlbums([])
      setCuratorSuggestions([])
      setDeletedPhotos([])
      setMemoryWalls([])
      setNotifications([])
      setProfile(defaultProfile(user.email, user.fullName))
      const initialSettings = defaultSettings(user.email)
      settingsRef.current = initialSettings
      setSettings(initialSettings)
      setStorageError('')
    } catch (error) {
      throw storageFailure(error, 'Application data could not be cleared.')
    }
  }, [user])

  const toggleFavorite = useCallback(
    async (id: string) => {
      const photo = photos.find((item) => item.id === id)
      if (!photo) throw new Error('That photograph is no longer in your library.')
      const updated = { ...photo, favorite: !photo.favorite, updatedAt: new Date().toISOString() }
      try {
        await savePhoto(updated)
        setPhotos((current) => current.map((item) => (item.id === id ? updated : item)))
      } catch (error) {
        throw storageFailure(error, 'The favorite could not be updated.')
      }
    },
    [photos],
  )

  const persistAlbum = useCallback(
    async (id: string, details: AlbumDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving an album.')
      const now = new Date().toISOString()
      const existing = albums.find((album) => album.id === id)
      const photoIds = [...new Set(details.photoIds)].filter((photoId) =>
        photos.some((photo) => photo.id === photoId),
      )
      const album: MemoryAlbum = {
        id,
        ownerEmail: user.email,
        ...details,
        photoIds,
        coverPhotoId:
          details.coverPhotoId &&
          photoIds.includes(details.coverPhotoId) &&
          photos.some((photo) => photo.id === details.coverPhotoId)
            ? details.coverPhotoId
            : photoIds[0] ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      try {
        await saveAlbum(album)
        setAlbums((current) =>
          [album, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => b.createdAt.localeCompare(a.createdAt),
          ),
        )
        if (create) {
          showToast('Your new album is ready.')
        } else {
          showToast('Album details saved.')
        }
      } catch (error) {
        throw storageFailure(error, 'The album could not be saved.')
      }
    },
    [albums, photos, showToast, user],
  )

  const createAlbum = useCallback(
    (details: AlbumDetails) => persistAlbum(crypto.randomUUID(), details, true),
    [persistAlbum],
  )

  const updateAlbum = useCallback(
    (id: string, details: AlbumDetails) => persistAlbum(id, details, false),
    [persistAlbum],
  )

  const deleteAlbum = useCallback(
    async (id: string) => {
      try {
        await removeAlbum(id)
        setAlbums((current) => current.filter((album) => album.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The album could not be deleted.')
      }
    },
    [],
  )

  const persistMilestone = useCallback(
    async (id: string, details: MilestoneDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving a milestone.')
      const existing = milestones.find((milestone) => milestone.id === id)
      if (!create && !existing) {
        throw new Error('That milestone is no longer in your timeline.')
      }
      const now = new Date().toISOString()
      const milestone: LifeMilestone = {
        id,
        ownerEmail: user.email,
        ...details,
        photoId:
          details.photoId && photos.some((photo) => photo.id === details.photoId)
            ? details.photoId
            : null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      try {
        await saveMilestone(milestone)
        setMilestones((current) =>
          [milestone, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => a.date.localeCompare(b.date),
          ),
        )
        showToast(create ? 'Milestone added to your timeline.' : 'Milestone updated.')
      } catch (error) {
        throw storageFailure(error, 'The milestone could not be saved.')
      }
    },
    [milestones, photos, showToast, user],
  )

  const createMilestone = useCallback(
    (details: MilestoneDetails) =>
      persistMilestone(crypto.randomUUID(), details, true),
    [persistMilestone],
  )

  const updateMilestone = useCallback(
    (id: string, details: MilestoneDetails) =>
      persistMilestone(id, details, false),
    [persistMilestone],
  )

  const deleteMilestone = useCallback(
    async (id: string) => {
      try {
        await removeMilestone(id)
        setMilestones((current) =>
          current.filter((milestone) => milestone.id !== id),
        )
        showToast('Milestone removed from your timeline.')
      } catch (error) {
        throw storageFailure(error, 'The milestone could not be deleted.')
      }
    },
    [showToast],
  )

  const persistStory = useCallback(
    async (id: string, details: StoryDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving a story.')
      const existing = stories.find((story) => story.id === id)
      if (!create && !existing) throw new Error('That story is no longer available.')
      const photoIds = [...new Set(details.photoIds)].filter((photoId) =>
        photos.some((photo) => photo.id === photoId),
      )
      const now = new Date().toISOString()
      const story: MemoryStory = {
        id,
        ownerEmail: user.email,
        ...details,
        title: details.title.trim(),
        body: details.body,
        location: details.location.trim(),
        people: [...new Set(details.people.map((person) => person.trim()).filter(Boolean))],
        tags: [...new Set(details.tags.map((tag) => tag.trim()).filter(Boolean))],
        photoIds,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      try {
        await saveStory(story)
        setStories((current) =>
          [story, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => b.updatedAt.localeCompare(a.updatedAt),
          ),
        )
        showToast(create ? 'Your story is saved.' : 'Story changes saved.')
        if (create) {
          await recordNotification(
            'story-update',
            'A new story has been saved',
            `“${story.title}” is now part of your archive.`,
            '/stories',
          )
        }
      } catch (error) {
        throw storageFailure(error, 'The story could not be saved.')
      }
    },
    [photos, recordNotification, showToast, stories, user],
  )

  const createStory = useCallback(
    async (details: StoryDetails) => {
      const id = crypto.randomUUID()
      await persistStory(id, details, true)
      return id
    },
    [persistStory],
  )

  const updateStory = useCallback(
    (id: string, details: StoryDetails) => persistStory(id, details, false),
    [persistStory],
  )

  const deleteStory = useCallback(
    async (id: string) => {
      const linkedResponses = promptResponses.filter((response) => response.storyId === id)
      try {
        await Promise.all(
          linkedResponses.map((response) =>
            savePromptResponse({ ...response, storyId: null, updatedAt: new Date().toISOString() }),
          ),
        )
        await removeStory(id)
        setStories((current) => current.filter((story) => story.id !== id))
        setPromptResponses((current) =>
          current.map((response) =>
            response.storyId === id ? { ...response, storyId: null } : response,
          ),
        )
      } catch (error) {
        throw storageFailure(error, 'The story could not be deleted.')
      }
    },
    [promptResponses],
  )

  const persistPromptResponse = useCallback(
    async (id: string, details: PromptResponseDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving a prompt response.')
      const existing = promptResponses.find((response) => response.id === id)
      if (!create && !existing) throw new Error('That prompt response is no longer available.')
      const now = new Date().toISOString()
      const response: MemoryPromptResponse = {
        id,
        ownerEmail: user.email,
        ...details,
        photoIds: [...new Set(details.photoIds)].filter((photoId) =>
          photos.some((photo) => photo.id === photoId),
        ),
        storyId: details.storyId && stories.some((story) => story.id === details.storyId)
          ? details.storyId
          : null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      try {
        await savePromptResponse(response)
        setPromptResponses((current) =>
          [response, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => b.updatedAt.localeCompare(a.updatedAt),
          ),
        )
        showToast(create ? 'Your prompt response is saved.' : 'Prompt response saved.')
      } catch (error) {
        throw storageFailure(error, 'The prompt response could not be saved.')
      }
    },
    [photos, promptResponses, showToast, stories, user],
  )

  const createPromptResponse = useCallback(
    async (details: PromptResponseDetails) => {
      const id = crypto.randomUUID()
      await persistPromptResponse(id, details, true)
      return id
    },
    [persistPromptResponse],
  )

  const updatePromptResponse = useCallback(
    (id: string, details: PromptResponseDetails) =>
      persistPromptResponse(id, details, false),
    [persistPromptResponse],
  )

  const deletePromptResponse = useCallback(
    async (id: string) => {
      try {
        await removePromptResponse(id)
        setPromptResponses((current) =>
          current.filter((response) => response.id !== id),
        )
      } catch (error) {
        throw storageFailure(error, 'The prompt response could not be deleted.')
      }
    },
    [],
  )

  const persistBook = useCallback(
    async (id: string, details: MemoryBookDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving a memory book.')
      const existing = books.find((book) => book.id === id)
      if (!create && !existing) throw new Error('That memory book is no longer available.')
      const availablePhotoIds = new Set(photos.map((photo) => photo.id))
      const availableStoryIds = new Set(stories.map((story) => story.id))
      const now = new Date().toISOString()
      const book: MemoryBook = {
        id,
        ownerEmail: user.email,
        ...details,
        coverPhotoId:
          details.coverPhotoId && availablePhotoIds.has(details.coverPhotoId)
            ? details.coverPhotoId
            : null,
        pages: details.pages.map((page) => ({
          ...page,
          photoIds: [...new Set(page.photoIds)].filter((photoId) =>
            availablePhotoIds.has(photoId),
          ),
          storyId:
            page.storyId && availableStoryIds.has(page.storyId) ? page.storyId : null,
        })),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      try {
        await saveBook(book)
        setBooks((current) =>
          [book, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => b.updatedAt.localeCompare(a.updatedAt),
          ),
        )
        return id
      } catch (error) {
        throw storageFailure(error, 'The memory book could not be saved.')
      }
    },
    [books, photos, stories, user],
  )

  const createBook = useCallback(
    (details: MemoryBookDetails) =>
      persistBook(crypto.randomUUID(), details, true),
    [persistBook],
  )

  const updateBook = useCallback(
    async (id: string, details: MemoryBookDetails) => {
      await persistBook(id, details, false)
    },
    [persistBook],
  )

  const deleteBook = useCallback(
    async (id: string) => {
      try {
        await removeBook(id)
        setBooks((current) => current.filter((book) => book.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The memory book could not be deleted.')
      }
    },
    [],
  )

  const duplicateBook = useCallback(
    async (id: string) => {
      const source = books.find((book) => book.id === id)
      if (!source) throw new Error('That memory book is no longer available.')
      return createBook({
        title: `${source.title} (copy)`,
        description: source.description,
        coverPhotoId: source.coverPhotoId,
        theme: source.theme,
        layout: source.layout,
        pages: source.pages.map((page) => ({ ...page, id: crypto.randomUUID() })),
        state: 'draft',
      })
    },
    [books, createBook],
  )

  const persistReel = useCallback(
    async (id: string, details: MemoryReelDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving a memory reel.')
      const existing = reels.find((reel) => reel.id === id)
      if (!create && !existing) throw new Error('That memory reel is no longer available.')
      const availablePhotoIds = new Set(photos.map((photo) => photo.id))
      const now = new Date().toISOString()
      const reel: MemoryReel = {
        id,
        ownerEmail: user.email,
        ...details,
        slides: details.slides
          .filter((slide) => availablePhotoIds.has(slide.photoId))
          .map((slide) => ({ ...slide, duration: Math.min(20, Math.max(1, slide.duration)) })),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      try {
        await saveReel(reel)
        setReels((current) =>
          [reel, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => b.updatedAt.localeCompare(a.updatedAt),
          ),
        )
        return id
      } catch (error) {
        throw storageFailure(error, 'The memory reel could not be saved.')
      }
    },
    [photos, reels, user],
  )

  const createReel = useCallback(
    (details: MemoryReelDetails) =>
      persistReel(crypto.randomUUID(), details, true),
    [persistReel],
  )

  const updateReel = useCallback(
    async (id: string, details: MemoryReelDetails) => {
      await persistReel(id, details, false)
    },
    [persistReel],
  )

  const deleteReel = useCallback(
    async (id: string) => {
      try {
        await removeReel(id)
        setReels((current) => current.filter((reel) => reel.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The memory reel could not be deleted.')
      }
    },
    [],
  )

  const persistCapsule = useCallback(
    async (id: string, details: TimeCapsuleDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving a time capsule.')
      const existing = capsules.find((capsule) => capsule.id === id)
      if (!create && (!existing || existing.state !== 'draft')) {
        throw new Error('Only a draft time capsule can be edited.')
      }
      if (!isValidCalendarDate(details.unlockDate)) {
        throw new Error('Choose a valid unlock date.')
      }
      if (details.state === 'sealed' && details.unlockDate <= localCalendarDate(new Date())) {
        throw new Error('A capsule can only be sealed for a future date.')
      }
      const availablePhotoIds = new Set(photos.map((photo) => photo.id))
      const availableStoryIds = new Set(stories.map((story) => story.id))
      const now = new Date().toISOString()
      const capsule: TimeCapsule = {
        id,
        ownerEmail: user.email,
        ...details,
        coverPhotoId:
          details.coverPhotoId && availablePhotoIds.has(details.coverPhotoId)
            ? details.coverPhotoId
            : null,
        photoIds: [...new Set(details.photoIds)].filter((photoId) =>
          availablePhotoIds.has(photoId),
        ),
        storyIds: [...new Set(details.storyIds)].filter((storyId) =>
          availableStoryIds.has(storyId),
        ),
        openedAt: existing?.openedAt ?? null,
        reflection: existing?.reflection ?? '',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      try {
        await saveCapsule(capsule)
        setCapsules((current) =>
          [capsule, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => a.unlockDate.localeCompare(b.unlockDate),
          ),
        )
        if (details.state === 'sealed' && existing?.state !== 'sealed') {
          await recordNotification(
            'time-capsule-update',
            'A time capsule has been sealed',
            `“${details.title.trim()}” is set to open on ${details.unlockDate}.`,
            '/capsules',
          )
        }
        return id
      } catch (error) {
        throw storageFailure(error, 'The time capsule could not be saved.')
      }
    },
    [capsules, photos, recordNotification, stories, user],
  )

  const createCapsule = useCallback(
    (details: TimeCapsuleDetails) =>
      persistCapsule(crypto.randomUUID(), details, true),
    [persistCapsule],
  )

  const updateCapsule = useCallback(
    async (id: string, details: TimeCapsuleDetails) => {
      await persistCapsule(id, details, false)
    },
    [persistCapsule],
  )

  const deleteCapsule = useCallback(
    async (id: string) => {
      const capsule = capsules.find((item) => item.id === id)
      if (!capsule || capsule.state !== 'draft') {
        throw new Error('Only a draft time capsule can be deleted.')
      }
      try {
        await removeCapsule(id)
        setCapsules((current) => current.filter((item) => item.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The time capsule could not be deleted.')
      }
    },
    [capsules],
  )

  const openCapsule = useCallback(
    async (id: string) => {
      const capsule = capsules.find((item) => item.id === id)
      if (!capsule) throw new Error('That time capsule is no longer available.')
      if (capsule.state === 'opened') return
      if (capsule.state !== 'sealed') {
        throw new Error('Save and seal this capsule before opening it.')
      }
      if (capsule.unlockDate > localCalendarDate(new Date())) {
        throw new Error('This capsule is still sealed until its unlock date.')
      }
      const opened = { ...capsule, state: 'opened' as const, openedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      try {
        await saveCapsule(opened)
        setCapsules((current) => current.map((item) => item.id === id ? opened : item))
        await recordNotification(
          'time-capsule-update',
          'A time capsule was opened',
          `You opened “${capsule.title}”.`,
          `/capsules/${capsule.id}`,
        )
      } catch (error) {
        throw storageFailure(error, 'The time capsule could not be opened.')
      }
    },
    [capsules, recordNotification],
  )

  const updateCapsuleReflection = useCallback(
    async (id: string, reflection: string) => {
      const capsule = capsules.find((item) => item.id === id)
      if (!capsule || capsule.state !== 'opened') {
        throw new Error('A reflection can only be added to an opened capsule.')
      }
      const updated = { ...capsule, reflection, updatedAt: new Date().toISOString() }
      try {
        await saveCapsule(updated)
        setCapsules((current) => current.map((item) => item.id === id ? updated : item))
      } catch (error) {
        throw storageFailure(error, 'Your reflection could not be saved.')
      }
    },
    [capsules],
  )

  const persistFamilyMember = useCallback(
    async (id: string, details: FamilyMemberDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving family details.')
      const existing = familyMembers.find((member) => member.id === id)
      if (!create && !existing) throw new Error('That family member is no longer available.')
      if (!details.name.trim() || !details.relationship.trim()) {
        throw new Error('Enter a name and relationship.')
      }
      const member: FamilyMember = {
        id,
        ownerEmail: user.email,
        ...details,
        name: details.name.trim(),
        relationship: details.relationship.trim(),
        photoId: details.photoId && photos.some((photo) => photo.id === details.photoId)
          ? details.photoId
          : null,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      try {
        await saveFamilyMember(member)
        setFamilyMembers((current) =>
          [member, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        )
        return id
      } catch (error) {
        throw storageFailure(error, 'The family member could not be saved.')
      }
    },
    [familyMembers, photos, user],
  )

  const createFamilyMember = useCallback(
    (details: FamilyMemberDetails) =>
      persistFamilyMember(crypto.randomUUID(), details, true),
    [persistFamilyMember],
  )

  const updateFamilyMember = useCallback(
    async (id: string, details: FamilyMemberDetails) => {
      await persistFamilyMember(id, details, false)
    },
    [persistFamilyMember],
  )

  const deleteFamilyMember = useCallback(
    async (id: string) => {
      try {
        await removeFamilyMember(id)
        setFamilyMembers((current) => current.filter((member) => member.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The family member could not be deleted.')
      }
    },
    [],
  )

  const persistFamilyStory = useCallback(
    async (id: string, details: FamilyStoryDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving a family story.')
      const existing = familyStories.find((story) => story.id === id)
      if (!create && !existing) throw new Error('That family story is no longer available.')
      if (!details.title.trim() || !details.body.trim()) {
        throw new Error('Enter a title and story.')
      }
      const availablePhotos = new Set(photos.map((photo) => photo.id))
      const availableMembers = new Set(familyMembers.map((member) => member.id))
      const story: FamilyStory = {
        id,
        ownerEmail: user.email,
        ...details,
        title: details.title.trim(),
        photoIds: [...new Set(details.photoIds)].filter((photoId) => availablePhotos.has(photoId)),
        memberIds: [...new Set(details.memberIds)].filter((memberId) => availableMembers.has(memberId)),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      try {
        await saveFamilyStory(story)
        setFamilyStories((current) =>
          [story, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => b.updatedAt.localeCompare(a.updatedAt),
          ),
        )
        return id
      } catch (error) {
        throw storageFailure(error, 'The family story could not be saved.')
      }
    },
    [familyMembers, familyStories, photos, user],
  )

  const createFamilyStory = useCallback(
    (details: FamilyStoryDetails) =>
      persistFamilyStory(crypto.randomUUID(), details, true),
    [persistFamilyStory],
  )

  const updateFamilyStory = useCallback(
    async (id: string, details: FamilyStoryDetails) => {
      await persistFamilyStory(id, details, false)
    },
    [persistFamilyStory],
  )

  const deleteFamilyStory = useCallback(
    async (id: string) => {
      try {
        await removeFamilyStory(id)
        setFamilyStories((current) => current.filter((story) => story.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The family story could not be deleted.')
      }
    },
    [],
  )

  const persistFamilyMilestone = useCallback(
    async (id: string, details: FamilyMilestoneDetails, create: boolean) => {
      if (!user) throw new Error('Sign in before saving a family milestone.')
      const existing = familyMilestones.find((item) => item.id === id)
      if (!create && !existing) throw new Error('That family milestone is no longer available.')
      if (!details.title.trim() || !isValidCalendarDate(details.date)) {
        throw new Error('Enter a milestone title and a valid date.')
      }
      const availableMembers = new Set(familyMembers.map((member) => member.id))
      const milestone: FamilyMilestone = {
        id,
        ownerEmail: user.email,
        ...details,
        title: details.title.trim(),
        memberIds: [...new Set(details.memberIds)].filter((memberId) => availableMembers.has(memberId)),
        photoId: details.photoId && photos.some((photo) => photo.id === details.photoId)
          ? details.photoId
          : null,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      try {
        await saveFamilyMilestone(milestone)
        setFamilyMilestones((current) =>
          [milestone, ...current.filter((item) => item.id !== id)].sort(
            (a, b) => a.date.localeCompare(b.date),
          ),
        )
        return id
      } catch (error) {
        throw storageFailure(error, 'The family milestone could not be saved.')
      }
    },
    [familyMembers, familyMilestones, photos, user],
  )

  const createFamilyMilestone = useCallback(
    (details: FamilyMilestoneDetails) =>
      persistFamilyMilestone(crypto.randomUUID(), details, true),
    [persistFamilyMilestone],
  )

  const updateFamilyMilestone = useCallback(
    async (id: string, details: FamilyMilestoneDetails) => {
      await persistFamilyMilestone(id, details, false)
    },
    [persistFamilyMilestone],
  )

  const deleteFamilyMilestone = useCallback(
    async (id: string) => {
      try {
        await removeFamilyMilestone(id)
        setFamilyMilestones((current) => current.filter((item) => item.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The family milestone could not be deleted.')
      }
    },
    [],
  )

  const persistSharedAlbumChange = useCallback(
    async (id: string, update: (album: SharedAlbum) => SharedAlbum) => {
      if (!user) throw new Error('Sign in before managing a shared album.')
      const current = sharedAlbums.find((album) => album.id === id && album.ownerEmail === user.email)
      if (!current) throw new Error('That shared album is no longer available.')
      const updated = update(current)
      try {
        await saveSharedAlbum(updated)
        setSharedAlbums((items) =>
          [updated, ...items.filter((album) => album.id !== id)].sort(
            (a, b) => b.updatedAt.localeCompare(a.updatedAt),
          ),
        )
      } catch (error) {
        throw storageFailure(error, 'The shared album could not be updated.')
      }
    },
    [sharedAlbums, user],
  )

  const createSharedAlbum = useCallback(
    async (details: SharedAlbumDetails) => {
      if (!user) throw new Error('Sign in before creating a shared album.')
      if (!details.name.trim()) throw new Error('Give your shared album a name.')
      const photoIds = [...new Set(details.photoIds)].filter((id) =>
        photos.some((photo) => photo.id === id),
      )
      const now = new Date().toISOString()
      const album: SharedAlbum = {
        id: crypto.randomUUID(),
        ownerEmail: user.email,
        name: details.name.trim(),
        description: details.description.trim(),
        photoIds,
        coverPhotoId: details.coverPhotoId && photoIds.includes(details.coverPhotoId)
          ? details.coverPhotoId
          : photoIds[0] ?? null,
        collaborators: [],
        comments: [],
        reactions: [],
        activity: [sharedAlbumActivity('Shared album created', now)],
        createdAt: now,
        updatedAt: now,
      }
      try {
        await saveSharedAlbum(album)
        setSharedAlbums((current) => [album, ...current])
        return album.id
      } catch (error) {
        throw storageFailure(error, 'The shared album could not be created.')
      }
    },
    [photos, user],
  )

  const updateSharedAlbum = useCallback(
    (id: string, details: SharedAlbumDetails) => {
      if (!details.name.trim()) throw new Error('Give your shared album a name.')
      const photoIds = [...new Set(details.photoIds)].filter((photoId) =>
        photos.some((photo) => photo.id === photoId),
      )
      return persistSharedAlbumChange(id, (album) => ({
        ...album,
        name: details.name.trim(),
        description: details.description.trim(),
        photoIds,
        coverPhotoId: details.coverPhotoId && photoIds.includes(details.coverPhotoId)
          ? details.coverPhotoId
          : photoIds[0] ?? null,
        comments: album.comments.filter((comment) => photoIds.includes(comment.photoId)),
        reactions: album.reactions.filter((reaction) => photoIds.includes(reaction.photoId)),
        ...sharedAlbumActivityChange(album, 'Shared album details updated'),
      }))
    },
    [persistSharedAlbumChange, photos],
  )

  const deleteSharedAlbum = useCallback(
    async (id: string) => {
      const album = sharedAlbums.find((item) => item.id === id && item.ownerEmail === user?.email)
      if (!album) throw new Error('That shared album is no longer available.')
      try {
        await removeSharedAlbum(id)
        setSharedAlbums((current) => current.filter((item) => item.id !== id))
      } catch (error) {
        throw storageFailure(error, 'The shared album could not be deleted.')
      }
    },
    [sharedAlbums, user],
  )

  const inviteCollaborator = useCallback(
    async (albumId: string, details: { name: string; email: string; permission: SharedAlbumPermission }) => {
      if (settings.sharedAlbumPrivacy === 'private') {
        throw new Error('Shared album invitations are disabled while your privacy setting is Private.')
      }
      const name = details.name.trim()
      const email = details.email.trim().toLowerCase()
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Enter a collaborator name and a valid email address.')
      }
      await persistSharedAlbumChange(albumId, (album) => {
        if (album.collaborators.some((item) => item.email.toLowerCase() === email)) {
          throw new Error('This email already has an invitation or collaborator profile.')
        }
        const now = new Date().toISOString()
        return {
          ...album,
          collaborators: [
            ...album.collaborators,
            { id: crypto.randomUUID(), name, email, permission: details.permission, status: 'pending', invitedAt: now },
          ],
          ...sharedAlbumActivityChange(album, `Local demo invitation prepared for ${name}`),
        }
      })
      await recordNotification(
        'shared-album-activity',
        'A local invitation was prepared',
        `An invitation for ${name} was saved in your shared album demo.`,
        '/shared-albums',
      )
    },
    [persistSharedAlbumChange, recordNotification, settings.sharedAlbumPrivacy],
  )

  const cancelInvitation = useCallback(
    (albumId: string, collaboratorId: string) =>
      persistSharedAlbumChange(albumId, (album) => {
        const collaborator = album.collaborators.find((item) => item.id === collaboratorId)
        if (!collaborator || collaborator.status !== 'pending') {
          throw new Error('That pending invitation is no longer available.')
        }
        return {
          ...album,
          collaborators: album.collaborators.filter((item) => item.id !== collaboratorId),
          ...sharedAlbumActivityChange(album, `Invitation for ${collaborator.name} cancelled`),
        }
      }),
    [persistSharedAlbumChange],
  )

  const simulateInvitationAcceptance = useCallback(
    (albumId: string, collaboratorId: string) =>
      persistSharedAlbumChange(albumId, (album) => {
        const collaborator = album.collaborators.find((item) => item.id === collaboratorId)
        if (!collaborator || collaborator.status !== 'pending') {
          throw new Error('That pending invitation is no longer available.')
        }
        return {
          ...album,
          collaborators: album.collaborators.map((item) =>
            item.id === collaboratorId ? { ...item, status: 'accepted' } : item,
          ),
          ...sharedAlbumActivityChange(album, `${collaborator.name} accepted in this local demo`),
        }
      }),
    [persistSharedAlbumChange],
  )

  const updateCollaboratorPermission = useCallback(
    (albumId: string, collaboratorId: string, permission: SharedAlbumPermission) =>
      persistSharedAlbumChange(albumId, (album) => {
        const collaborator = album.collaborators.find((item) => item.id === collaboratorId)
        if (!collaborator) throw new Error('That collaborator is no longer available.')
        return {
          ...album,
          collaborators: album.collaborators.map((item) =>
            item.id === collaboratorId ? { ...item, permission } : item,
          ),
          ...sharedAlbumActivityChange(album, `${collaborator.name}'s permission changed to ${permission}`),
        }
      }),
    [persistSharedAlbumChange],
  )

  const removeCollaborator = useCallback(
    (albumId: string, collaboratorId: string) =>
      persistSharedAlbumChange(albumId, (album) => {
        const collaborator = album.collaborators.find((item) => item.id === collaboratorId)
        if (!collaborator) throw new Error('That collaborator is no longer available.')
        return {
          ...album,
          collaborators: album.collaborators.filter((item) => item.id !== collaboratorId),
          ...sharedAlbumActivityChange(album, `${collaborator.name} removed from the album`),
        }
      }),
    [persistSharedAlbumChange],
  )

  const addSharedAlbumComment = useCallback(
    async (albumId: string, photoId: string, body: string) => {
      const message = body.trim()
      if (!message || message.length > 500) throw new Error('Write a comment of 1–500 characters.')
      if (!photos.some((photo) => photo.id === photoId)) throw new Error('That photograph is no longer available.')
      await persistSharedAlbumChange(albumId, (album) => {
        if (!album.photoIds.includes(photoId)) throw new Error('That photograph is not part of this shared album.')
        const now = new Date().toISOString()
        return {
          ...album,
          comments: [...album.comments, {
            id: crypto.randomUUID(),
            photoId,
            author: settings.profileVisibility === 'local-demo' ? profile.fullName : 'You',
            body: message,
            createdAt: now,
          }],
          ...sharedAlbumActivityChange(album, 'You left a comment on a photograph'),
        }
      })
      await recordNotification(
        'shared-album-activity',
        'A shared album note was added',
        'Your local demo comment was added to a photograph.',
        `/shared-albums/${albumId}`,
      )
    },
    [persistSharedAlbumChange, photos, profile.fullName, recordNotification, settings.profileVisibility],
  )

  const toggleSharedAlbumReaction = useCallback(
    (albumId: string, photoId: string) =>
      persistSharedAlbumChange(albumId, (album) => {
        if (!album.photoIds.includes(photoId)) throw new Error('That photograph is not part of this shared album.')
        const current = album.reactions.find((reaction) => reaction.photoId === photoId)
        const next = current
          ? { ...current, count: Math.max(0, current.count + (current.ownerReacted ? -1 : 1)), ownerReacted: !current.ownerReacted }
          : { photoId, count: 1, ownerReacted: true }
        return {
          ...album,
          reactions: current
            ? album.reactions.map((reaction) => reaction.photoId === photoId ? next : reaction)
            : [...album.reactions, next],
          ...sharedAlbumActivityChange(album, current?.ownerReacted ? 'You removed a reaction' : 'You reacted to a photograph'),
        }
      }),
    [persistSharedAlbumChange],
  )

  const persistCuratorSuggestion = useCallback(
    async (suggestion: CuratorSuggestion) => {
      if (!user) throw new Error('Sign in before saving curator suggestions.')
      const record = {
        ...suggestion,
        ownerEmail: user.email,
        photoIds: [...new Set(suggestion.photoIds)].filter((id) => photos.some((photo) => photo.id === id)),
        updatedAt: new Date().toISOString(),
      }
      try {
        await saveCuratorSuggestionRecord(record)
        setCuratorSuggestions((current) => [record, ...current.filter((item) => item.id !== record.id)])
      } catch (error) {
        throw storageFailure(error, 'The curator suggestion could not be saved.')
      }
    },
    [photos, user],
  )

  const value = useMemo(
    () => ({
      photos,
      albums,
      milestones,
      stories,
      promptResponses,
      books,
      reels,
      capsules,
      familyMembers,
      familyStories,
      familyMilestones,
      sharedAlbums,
      curatorSuggestions,
      deletedPhotos,
      profile,
      settings,
      memoryWalls,
      notifications,
      loading,
      storageError,
      addPhoto,
      updatePhoto,
      deletePhotos,
      restorePhotos,
      permanentlyDeletePhotos,
      saveProfile: persistProfile,
      saveSettings: persistSettings,
      saveMemoryWall: persistMemoryWall,
      deleteMemoryWall: removeMemoryWallLayout,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification: removeOneNotification,
      clearNotifications: clearAllNotifications,
      clearApplicationData: clearAllApplicationData,
      toggleFavorite,
      createAlbum,
      updateAlbum,
      deleteAlbum,
      createMilestone,
      updateMilestone,
      deleteMilestone,
      createStory,
      updateStory,
      deleteStory,
      createPromptResponse,
      updatePromptResponse,
      deletePromptResponse,
      createBook,
      updateBook,
      deleteBook,
      duplicateBook,
      createReel,
      updateReel,
      deleteReel,
      createCapsule,
      updateCapsule,
      deleteCapsule,
      openCapsule,
      updateCapsuleReflection,
      createFamilyMember,
      updateFamilyMember,
      deleteFamilyMember,
      createFamilyStory,
      updateFamilyStory,
      deleteFamilyStory,
      createFamilyMilestone,
      updateFamilyMilestone,
      deleteFamilyMilestone,
      createSharedAlbum,
      updateSharedAlbum,
      deleteSharedAlbum,
      inviteCollaborator,
      cancelInvitation,
      simulateInvitationAcceptance,
      updateCollaboratorPermission,
      removeCollaborator,
      addSharedAlbumComment,
      toggleSharedAlbumReaction,
      saveCuratorSuggestion: persistCuratorSuggestion,
    }),
    [
      photos,
      albums,
      milestones,
      stories,
      promptResponses,
      books,
      reels,
      capsules,
      familyMembers,
      familyStories,
      familyMilestones,
      sharedAlbums,
      curatorSuggestions,
      deletedPhotos,
      profile,
      settings,
      memoryWalls,
      notifications,
      loading,
      storageError,
      addPhoto,
      updatePhoto,
      deletePhotos,
      restorePhotos,
      permanentlyDeletePhotos,
      persistProfile,
      persistSettings,
      persistMemoryWall,
      removeMemoryWallLayout,
      markNotificationRead,
      markAllNotificationsRead,
      removeOneNotification,
      clearAllNotifications,
      clearAllApplicationData,
      toggleFavorite,
      createAlbum,
      updateAlbum,
      deleteAlbum,
      createMilestone,
      updateMilestone,
      deleteMilestone,
      createStory,
      updateStory,
      deleteStory,
      createPromptResponse,
      updatePromptResponse,
      deletePromptResponse,
      createBook,
      updateBook,
      deleteBook,
      duplicateBook,
      createReel,
      updateReel,
      deleteReel,
      createCapsule,
      updateCapsule,
      deleteCapsule,
      openCapsule,
      updateCapsuleReflection,
      createFamilyMember,
      updateFamilyMember,
      deleteFamilyMember,
      createFamilyStory,
      updateFamilyStory,
      deleteFamilyStory,
      createFamilyMilestone,
      updateFamilyMilestone,
      deleteFamilyMilestone,
      createSharedAlbum,
      updateSharedAlbum,
      deleteSharedAlbum,
      inviteCollaborator,
      cancelInvitation,
      simulateInvitationAcceptance,
      updateCollaboratorPermission,
      removeCollaborator,
      addSharedAlbumComment,
      toggleSharedAlbumReaction,
      persistCuratorSuggestion,
    ],
  )

  return <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
}

function sharedAlbumActivity(message: string, createdAt = new Date().toISOString()) {
  return { id: crypto.randomUUID(), message, createdAt }
}

function sharedAlbumActivityChange(album: SharedAlbum, message: string) {
  const createdAt = new Date().toISOString()
  return {
    activity: [sharedAlbumActivity(message, createdAt), ...album.activity].slice(0, 100),
    updatedAt: createdAt,
  }
}

function localCalendarDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && localCalendarDate(date) === value
}

function defaultProfile(ownerEmail: string, fullName: string): UserProfile {
  return {
    id: ownerEmail,
    ownerEmail,
    fullName,
    biography: '',
    photoBlob: null,
    accountCreatedAt: ownerEmail ? getDemoAccountCreatedAt(ownerEmail) : null,
    updatedAt: new Date().toISOString(),
  }
}

function defaultSettings(ownerEmail: string): MemorySettings {
  return {
    id: ownerEmail,
    ownerEmail,
    theme: 'light',
    galleryDensity: 'comfortable',
    profileVisibility: 'private',
    sharedAlbumPrivacy: 'invitation-only',
    notifications: {
      memoryReminders: true,
      timeCapsuleReminders: true,
      sharedAlbumActivity: true,
      storyUpdates: true,
      applicationAnnouncements: true,
    },
    updatedAt: new Date().toISOString(),
  }
}

function isNotificationEnabled(
  preferences: NotificationPreferences,
  category: MemoryNotificationCategory,
): boolean {
  const preferenceByCategory: Record<MemoryNotificationCategory, keyof NotificationPreferences> = {
    'memory-reminder': 'memoryReminders',
    'time-capsule-update': 'timeCapsuleReminders',
    'shared-album-activity': 'sharedAlbumActivity',
    'story-update': 'storyUpdates',
    'application-announcement': 'applicationAnnouncements',
  }
  return preferences[preferenceByCategory[category]]
}

function mergeSettingsChanges(
  base: MemorySettings,
  current: MemorySettings,
  submitted: MemorySettings,
): MemorySettings {
  const merged: MemorySettings = { ...current }
  if (submitted.theme !== base.theme) merged.theme = submitted.theme
  if (submitted.galleryDensity !== base.galleryDensity) {
    merged.galleryDensity = submitted.galleryDensity
  }
  if (submitted.profileVisibility !== base.profileVisibility) {
    merged.profileVisibility = submitted.profileVisibility
  }
  if (submitted.sharedAlbumPrivacy !== base.sharedAlbumPrivacy) {
    merged.sharedAlbumPrivacy = submitted.sharedAlbumPrivacy
  }
  const notificationKeys = Object.keys(base.notifications) as (keyof NotificationPreferences)[]
  merged.notifications = { ...current.notifications }
  notificationKeys.forEach((key) => {
    if (submitted.notifications[key] !== base.notifications[key]) {
      merged.notifications[key] = submitted.notifications[key]
    }
  })
  return merged
}

function storageFailure(error: unknown, fallback: string): Error {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return new Error('This device is low on storage. Free up space and try again.')
  }
  if (error instanceof Error) return error
  return new Error(fallback)
}
