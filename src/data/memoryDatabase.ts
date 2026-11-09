import type {
  LifeMilestone,
  MemoryAlbum,
  MemoryBook,
  MemoryPhoto,
  MemoryPromptResponse,
  MemoryReel,
  MemoryStory,
  FamilyMember,
  FamilyStory,
  FamilyMilestone,
  TimeCapsule,
  SharedAlbum,
  CuratorSuggestion,
  DeletedMemoryPhoto,
  MemoryNotification,
  MemorySettings,
  MemoryWallLayout,
  UserProfile,
} from './memoryTypes'

const databaseName = 'evermine.local-memory'
const databaseVersion = 7
const photosStore = 'photos'
const albumsStore = 'albums'
const milestonesStore = 'milestones'
const storiesStore = 'stories'
const promptResponsesStore = 'promptResponses'
const booksStore = 'books'
const reelsStore = 'reels'
const capsulesStore = 'capsules'
const familyMembersStore = 'familyMembers'
const familyStoriesStore = 'familyStories'
const familyMilestonesStore = 'familyMilestones'
const sharedAlbumsStore = 'sharedAlbums'
const curatorSuggestionsStore = 'curatorSuggestions'
const deletedPhotosStore = 'deletedPhotos'
const profilesStore = 'profiles'
const settingsStore = 'settings'
const memoryWallsStore = 'memoryWalls'
const notificationsStore = 'notifications'
let databasePromise: Promise<IDBDatabase> | undefined

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('This browser does not support local photo storage.'))
  }
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, databaseVersion)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(photosStore)) {
          database.createObjectStore(photosStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(albumsStore)) {
          database.createObjectStore(albumsStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(milestonesStore)) {
          database.createObjectStore(milestonesStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(storiesStore)) {
          database.createObjectStore(storiesStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(promptResponsesStore)) {
          database.createObjectStore(promptResponsesStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(booksStore)) {
          database.createObjectStore(booksStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(reelsStore)) {
          database.createObjectStore(reelsStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(capsulesStore)) {
          database.createObjectStore(capsulesStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(familyMembersStore)) {
          database.createObjectStore(familyMembersStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(familyStoriesStore)) {
          database.createObjectStore(familyStoriesStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(familyMilestonesStore)) {
          database.createObjectStore(familyMilestonesStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(sharedAlbumsStore)) {
          database.createObjectStore(sharedAlbumsStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(curatorSuggestionsStore)) {
          database.createObjectStore(curatorSuggestionsStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(deletedPhotosStore)) {
          database.createObjectStore(deletedPhotosStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(profilesStore)) {
          database.createObjectStore(profilesStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(settingsStore)) {
          database.createObjectStore(settingsStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(memoryWallsStore)) {
          database.createObjectStore(memoryWallsStore, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(notificationsStore)) {
          database.createObjectStore(notificationsStore, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close()
        resolve(request.result)
      }
      request.onerror = () => {
        databasePromise = undefined
        reject(request.error ?? new Error('Could not open local memory storage.'))
      }
      request.onblocked = () => {
        databasePromise = undefined
        reject(new Error('Local memory storage is blocked by another open tab.'))
      }
    })
  }
  return databasePromise
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('A local storage request failed.'))
  })
}

async function getAllFrom<T>(storeName: string): Promise<T[]> {
  const database = await openDatabase()
  const transaction = database.transaction(storeName, 'readonly')
  const completed = transactionDone(transaction)
  const result = await requestResult(transaction.objectStore(storeName).getAll() as IDBRequest<T[]>)
  await completed
  return result
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Local memory storage could not be updated.'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('The local storage operation was cancelled.'))
  })
}

async function putRecord<T>(storeName: string, value: T): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).put(value)
  await transactionDone(transaction)
}

async function deleteRecord(storeName: string, id: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).delete(id)
  await transactionDone(transaction)
}

export async function loadPhotos(ownerEmail: string): Promise<MemoryPhoto[]> {
  return (await getAllFrom<MemoryPhoto>(photosStore))
    .filter((photo) => photo.ownerEmail === ownerEmail)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function loadAlbums(ownerEmail: string): Promise<MemoryAlbum[]> {
  return (await getAllFrom<MemoryAlbum>(albumsStore))
    .filter((album) => album.ownerEmail === ownerEmail)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function loadMilestones(ownerEmail: string): Promise<LifeMilestone[]> {
  return (await getAllFrom<LifeMilestone>(milestonesStore))
    .filter((milestone) => milestone.ownerEmail === ownerEmail)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function loadStories(ownerEmail: string): Promise<MemoryStory[]> {
  return (await getAllFrom<MemoryStory>(storiesStore))
    .filter((story) => story.ownerEmail === ownerEmail)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function loadPromptResponses(ownerEmail: string): Promise<MemoryPromptResponse[]> {
  return (await getAllFrom<MemoryPromptResponse>(promptResponsesStore))
    .filter((response) => response.ownerEmail === ownerEmail)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function loadBooks(ownerEmail: string): Promise<MemoryBook[]> {
  return (await getAllFrom<MemoryBook>(booksStore))
    .filter((book) => book.ownerEmail === ownerEmail)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function loadReels(ownerEmail: string): Promise<MemoryReel[]> {
  return (await getAllFrom<MemoryReel>(reelsStore))
    .filter((reel) => reel.ownerEmail === ownerEmail)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function loadCapsules(ownerEmail: string): Promise<TimeCapsule[]> {
  return (await getAllFrom<TimeCapsule>(capsulesStore))
    .filter((capsule) => capsule.ownerEmail === ownerEmail)
    .sort((a, b) => a.unlockDate.localeCompare(b.unlockDate))
}

export async function loadFamilyMembers(ownerEmail: string): Promise<FamilyMember[]> {
  return (await getAllFrom<FamilyMember>(familyMembersStore))
    .filter((member) => member.ownerEmail === ownerEmail)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function loadFamilyStories(ownerEmail: string): Promise<FamilyStory[]> {
  return (await getAllFrom<FamilyStory>(familyStoriesStore))
    .filter((story) => story.ownerEmail === ownerEmail)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function loadFamilyMilestones(ownerEmail: string): Promise<FamilyMilestone[]> {
  return (await getAllFrom<FamilyMilestone>(familyMilestonesStore))
    .filter((milestone) => milestone.ownerEmail === ownerEmail)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function loadSharedAlbums(ownerEmail: string): Promise<SharedAlbum[]> {
  return (await getAllFrom<SharedAlbum>(sharedAlbumsStore))
    .filter((album) => album.ownerEmail === ownerEmail)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function loadCuratorSuggestions(ownerEmail: string): Promise<CuratorSuggestion[]> {
  return (await getAllFrom<CuratorSuggestion>(curatorSuggestionsStore))
    .filter((suggestion) => suggestion.ownerEmail === ownerEmail)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function loadDeletedPhotos(ownerEmail: string): Promise<DeletedMemoryPhoto[]> {
  return (await getAllFrom<DeletedMemoryPhoto>(deletedPhotosStore))
    .filter((item) => item.ownerEmail === ownerEmail)
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
}

export async function loadProfile(ownerEmail: string): Promise<UserProfile | undefined> {
  return (await getAllFrom<UserProfile>(profilesStore))
    .find((profile) => profile.ownerEmail === ownerEmail)
}

export async function loadSettings(ownerEmail: string): Promise<MemorySettings | undefined> {
  return (await getAllFrom<MemorySettings>(settingsStore))
    .find((settings) => settings.ownerEmail === ownerEmail)
}

export async function loadMemoryWalls(ownerEmail: string): Promise<MemoryWallLayout[]> {
  return (await getAllFrom<MemoryWallLayout>(memoryWallsStore))
    .filter((wall) => wall.ownerEmail === ownerEmail)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function loadNotifications(ownerEmail: string): Promise<MemoryNotification[]> {
  return (await getAllFrom<MemoryNotification>(notificationsStore))
    .filter((notification) => notification.ownerEmail === ownerEmail)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const savePhoto = (photo: MemoryPhoto) => putRecord(photosStore, photo)
export const saveAlbum = (album: MemoryAlbum) => putRecord(albumsStore, album)
export const saveMilestone = (milestone: LifeMilestone) =>
  putRecord(milestonesStore, milestone)
export const saveStory = (story: MemoryStory) => putRecord(storiesStore, story)
export const savePromptResponse = (response: MemoryPromptResponse) =>
  putRecord(promptResponsesStore, response)
export const saveBook = (book: MemoryBook) => putRecord(booksStore, book)
export const saveReel = (reel: MemoryReel) => putRecord(reelsStore, reel)
export const saveCapsule = (capsule: TimeCapsule) => putRecord(capsulesStore, capsule)
export const saveFamilyMember = (member: FamilyMember) => putRecord(familyMembersStore, member)
export const saveFamilyStory = (story: FamilyStory) => putRecord(familyStoriesStore, story)
export const saveFamilyMilestone = (milestone: FamilyMilestone) => putRecord(familyMilestonesStore, milestone)
export const saveSharedAlbum = (album: SharedAlbum) => putRecord(sharedAlbumsStore, album)
export const saveCuratorSuggestion = (suggestion: CuratorSuggestion) => putRecord(curatorSuggestionsStore, suggestion)
export const saveDeletedPhoto = (photo: DeletedMemoryPhoto) => putRecord(deletedPhotosStore, photo)
export const saveProfile = (profile: UserProfile) => putRecord(profilesStore, profile)
export const saveSettings = (settings: MemorySettings) => putRecord(settingsStore, settings)
export const saveMemoryWall = (wall: MemoryWallLayout) => putRecord(memoryWallsStore, wall)
export const saveNotification = (notification: MemoryNotification) => putRecord(notificationsStore, notification)
export const removePhoto = (id: string) => deleteRecord(photosStore, id)
export const removeAlbum = (id: string) => deleteRecord(albumsStore, id)
export const removeMilestone = (id: string) => deleteRecord(milestonesStore, id)
export const removeStory = (id: string) => deleteRecord(storiesStore, id)
export const removePromptResponse = (id: string) => deleteRecord(promptResponsesStore, id)
export const removeBook = (id: string) => deleteRecord(booksStore, id)
export const removeReel = (id: string) => deleteRecord(reelsStore, id)
export const removeCapsule = (id: string) => deleteRecord(capsulesStore, id)
export const removeFamilyMember = (id: string) => deleteRecord(familyMembersStore, id)
export const removeFamilyStory = (id: string) => deleteRecord(familyStoriesStore, id)
export const removeFamilyMilestone = (id: string) => deleteRecord(familyMilestonesStore, id)
export const removeSharedAlbum = (id: string) => deleteRecord(sharedAlbumsStore, id)
export const removeMemoryWall = (id: string) => deleteRecord(memoryWallsStore, id)
export const removeNotification = (id: string) => deleteRecord(notificationsStore, id)

export async function movePhotosToTrash(items: DeletedMemoryPhoto[]): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction([photosStore, deletedPhotosStore], 'readwrite')
  const completed = transactionDone(transaction)
  const photoStore = transaction.objectStore(photosStore)
  const deletedStore = transaction.objectStore(deletedPhotosStore)
  items.forEach((item) => {
    photoStore.delete(item.id)
    deletedStore.put(item)
  })
  await completed
}

export async function restorePhotosFromTrash(items: DeletedMemoryPhoto[]): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction([photosStore, deletedPhotosStore], 'readwrite')
  const completed = transactionDone(transaction)
  const photoStore = transaction.objectStore(photosStore)
  const deletedStore = transaction.objectStore(deletedPhotosStore)
  items.forEach((item) => {
    photoStore.put(item.photo)
    deletedStore.delete(item.id)
  })
  await completed
}

export async function permanentlyDeletePhotosFromTrash(
  photoIds: string[],
  ownerEmail: string,
): Promise<void> {
  const storeNames = [
    deletedPhotosStore,
    albumsStore,
    milestonesStore,
    storiesStore,
    promptResponsesStore,
    booksStore,
    reelsStore,
    capsulesStore,
    familyMembersStore,
    familyStoriesStore,
    familyMilestonesStore,
    sharedAlbumsStore,
    curatorSuggestionsStore,
    memoryWallsStore,
  ]
  const database = await openDatabase()
  const transaction = database.transaction(storeNames, 'readwrite')
  const completed = transactionDone(transaction)
  const deletedStore = transaction.objectStore(deletedPhotosStore)
  const removed = new Set(photoIds)
  photoIds.forEach((id) => deletedStore.delete(id))
  const changedAt = new Date().toISOString()

  updateOwnedRecords<MemoryAlbum>(
    transaction.objectStore(albumsStore),
    ownerEmail,
    (album) => {
      const photoIds = album.photoIds.filter((id) => !removed.has(id))
      return {
        ...album,
        photoIds,
        coverPhotoId:
          album.coverPhotoId && removed.has(album.coverPhotoId)
            ? photoIds[0] ?? null
            : album.coverPhotoId,
        updatedAt: changedAt,
      }
    },
  )
  updateOwnedRecords<LifeMilestone>(
    transaction.objectStore(milestonesStore),
    ownerEmail,
    (item) => ({
      ...item,
      photoId: item.photoId && removed.has(item.photoId) ? null : item.photoId,
      updatedAt: changedAt,
    }),
  )
  updateOwnedRecords<MemoryStory>(
    transaction.objectStore(storiesStore),
    ownerEmail,
    (item) => ({ ...item, photoIds: item.photoIds.filter((id) => !removed.has(id)), updatedAt: changedAt }),
  )
  updateOwnedRecords<MemoryPromptResponse>(
    transaction.objectStore(promptResponsesStore),
    ownerEmail,
    (item) => ({ ...item, photoIds: item.photoIds.filter((id) => !removed.has(id)), updatedAt: changedAt }),
  )
  updateOwnedRecords<MemoryBook>(
    transaction.objectStore(booksStore),
    ownerEmail,
    (item) => ({
      ...item,
      coverPhotoId: item.coverPhotoId && removed.has(item.coverPhotoId) ? null : item.coverPhotoId,
      pages: item.pages.map((page) => ({
        ...page,
        photoIds: page.photoIds.filter((id) => !removed.has(id)),
      })),
      updatedAt: changedAt,
    }),
  )
  updateOwnedRecords<MemoryReel>(
    transaction.objectStore(reelsStore),
    ownerEmail,
    (item) => ({
      ...item,
      slides: item.slides.filter((slide) => !removed.has(slide.photoId)),
      updatedAt: changedAt,
    }),
  )
  updateOwnedRecords<TimeCapsule>(
    transaction.objectStore(capsulesStore),
    ownerEmail,
    (item) => ({
      ...item,
      coverPhotoId: item.coverPhotoId && removed.has(item.coverPhotoId) ? null : item.coverPhotoId,
      photoIds: item.photoIds.filter((id) => !removed.has(id)),
      updatedAt: changedAt,
    }),
  )
  updateOwnedRecords<FamilyMember>(
    transaction.objectStore(familyMembersStore),
    ownerEmail,
    (item) => ({
      ...item,
      photoId: item.photoId && removed.has(item.photoId) ? null : item.photoId,
      updatedAt: changedAt,
    }),
  )
  updateOwnedRecords<FamilyStory>(
    transaction.objectStore(familyStoriesStore),
    ownerEmail,
    (item) => ({ ...item, photoIds: item.photoIds.filter((id) => !removed.has(id)), updatedAt: changedAt }),
  )
  updateOwnedRecords<FamilyMilestone>(
    transaction.objectStore(familyMilestonesStore),
    ownerEmail,
    (item) => ({
      ...item,
      photoId: item.photoId && removed.has(item.photoId) ? null : item.photoId,
      updatedAt: changedAt,
    }),
  )
  updateOwnedRecords<SharedAlbum>(
    transaction.objectStore(sharedAlbumsStore),
    ownerEmail,
    (item) => {
      const photoIds = item.photoIds.filter((id) => !removed.has(id))
      return {
        ...item,
        photoIds,
        coverPhotoId:
          item.coverPhotoId && removed.has(item.coverPhotoId)
            ? photoIds[0] ?? null
            : item.coverPhotoId,
        comments: item.comments.filter((comment) => !removed.has(comment.photoId)),
        reactions: item.reactions.filter((reaction) => !removed.has(reaction.photoId)),
        updatedAt: changedAt,
      }
    },
  )
  updateOwnedRecords<CuratorSuggestion>(
    transaction.objectStore(curatorSuggestionsStore),
    ownerEmail,
    (item) => {
      const photoIds = item.photoIds.filter((id) => !removed.has(id))
      return photoIds.length ? { ...item, photoIds, updatedAt: changedAt } : null
    },
  )
  updateOwnedRecords<MemoryWallLayout>(
    transaction.objectStore(memoryWallsStore),
    ownerEmail,
    (item) => ({
      ...item,
      tiles: item.tiles.filter((tile) => !removed.has(tile.photoId)),
      updatedAt: changedAt,
    }),
  )
  await completed
}

export async function clearOwnerData(ownerEmail: string): Promise<void> {
  const storeNames = [
    photosStore,
    albumsStore,
    milestonesStore,
    storiesStore,
    promptResponsesStore,
    booksStore,
    reelsStore,
    capsulesStore,
    familyMembersStore,
    familyStoriesStore,
    familyMilestonesStore,
    sharedAlbumsStore,
    curatorSuggestionsStore,
    deletedPhotosStore,
    profilesStore,
    settingsStore,
    memoryWallsStore,
    notificationsStore,
  ]
  const database = await openDatabase()
  const transaction = database.transaction(storeNames, 'readwrite')
  const completed = transactionDone(transaction)
  storeNames.forEach((storeName) => {
    const store = transaction.objectStore(storeName)
    const request = store.getAll() as IDBRequest<{ id: string; ownerEmail: string }[]>
    request.onsuccess = () => {
      request.result
        .filter((record) => record.ownerEmail === ownerEmail)
        .forEach((record) => store.delete(record.id))
    }
  })
  await completed
}

function updateOwnedRecords<T extends { id: string; ownerEmail: string }>(
  store: IDBObjectStore,
  ownerEmail: string,
  update: (record: T) => T | null,
): void {
  const request = store.getAll() as IDBRequest<T[]>
  request.onsuccess = () => {
    request.result
      .filter((record) => record.ownerEmail === ownerEmail)
      .forEach((record) => {
        const updated = update(record)
        if (updated) store.put(updated)
        else store.delete(record.id)
      })
  }
}
