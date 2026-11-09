export const photoCategories = [
  'Family',
  'Friends',
  'Childhood',
  'Travel',
  'Celebrations',
  'College',
  'Everyday Moments',
  'Special Occasions',
] as const

export type PhotoCategory = (typeof photoCategories)[number]

export interface MemoryPhoto {
  id: string
  ownerEmail: string
  fileName: string
  mimeType: string
  blob: Blob
  title: string
  caption: string
  date: string
  location: string
  tags: string[]
  category: PhotoCategory | ''
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface MemoryAlbum {
  id: string
  ownerEmail: string
  name: string
  description: string
  category: PhotoCategory
  photoIds: string[]
  coverPhotoId: string | null
  createdAt: string
  updatedAt: string
}

export type SharedAlbumPermission = 'viewer' | 'contributor' | 'editor'
export type SharedCollaboratorStatus = 'pending' | 'accepted'

export interface SharedCollaborator {
  id: string
  name: string
  email: string
  permission: SharedAlbumPermission
  status: SharedCollaboratorStatus
  invitedAt: string
}

export interface SharedAlbumComment {
  id: string
  photoId: string
  author: string
  body: string
  createdAt: string
}

export interface SharedAlbumReaction {
  photoId: string
  count: number
  ownerReacted: boolean
}

export interface SharedAlbumActivity {
  id: string
  message: string
  createdAt: string
}

export interface SharedAlbum {
  id: string
  ownerEmail: string
  name: string
  description: string
  photoIds: string[]
  coverPhotoId: string | null
  collaborators: SharedCollaborator[]
  comments: SharedAlbumComment[]
  reactions: SharedAlbumReaction[]
  activity: SharedAlbumActivity[]
  createdAt: string
  updatedAt: string
}

export type SharedAlbumDetails = Pick<
  SharedAlbum,
  'name' | 'description' | 'photoIds' | 'coverPhotoId'
>

export type CuratorSuggestionKind =
  | 'collection'
  | 'caption'
  | 'tags'
  | 'category'
  | 'similar'
  | 'duplicate'
export type CuratorSuggestionStatus = 'suggested' | 'accepted' | 'dismissed'

export interface CuratorSuggestion {
  id: string
  ownerEmail: string
  kind: CuratorSuggestionKind
  title: string
  description: string
  photoIds: string[]
  status: CuratorSuggestionStatus
  suggestedCategory: PhotoCategory | null
  suggestedTags: string[]
  suggestedCaption: string | null
  collectionName: string | null
  createdAt: string
  updatedAt: string
}

export interface LifeMilestone {
  id: string
  ownerEmail: string
  title: string
  date: string
  description: string
  photoId: string | null
  createdAt: string
  updatedAt: string
}

export const storyCategories = [
  'Family',
  'Friends',
  'Childhood',
  'School and College',
  'Travel',
  'Celebrations',
  'Personal Growth',
  'Everyday Moments',
] as const

export type StoryCategory = (typeof storyCategories)[number]
export type StoryState = 'draft' | 'private' | 'published'

export interface MemoryStory {
  id: string
  ownerEmail: string
  title: string
  body: string
  date: string
  location: string
  people: string[]
  category: StoryCategory
  tags: string[]
  photoIds: string[]
  state: StoryState
  createdAt: string
  updatedAt: string
}

export type StoryDetails = Pick<
  MemoryStory,
  'title' | 'body' | 'date' | 'location' | 'people' | 'category' | 'tags' | 'photoIds' | 'state'
>

export const promptCategories = [
  'Childhood memories',
  'Family moments',
  'Friendship',
  'School and college',
  'Travel adventures',
  'Celebrations',
  'Personal growth',
  'Everyday moments',
] as const

export type PromptCategory = (typeof promptCategories)[number]
export type PromptResponseState = 'draft' | 'completed'

export interface MemoryPromptResponse {
  id: string
  ownerEmail: string
  promptId: string
  prompt: string
  category: PromptCategory
  response: string
  photoIds: string[]
  state: PromptResponseState
  storyId: string | null
  createdAt: string
  updatedAt: string
}

export type PromptResponseDetails = Pick<
  MemoryPromptResponse,
  'promptId' | 'prompt' | 'category' | 'response' | 'photoIds' | 'state' | 'storyId'
>

export const memoryBookThemes = [
  'Minimal Memories',
  'Family Heritage',
  'Travel Journal',
  'Childhood Stories',
  'Celebrations',
  'Everyday Moments',
] as const

export type MemoryBookTheme = (typeof memoryBookThemes)[number]
export type MemoryBookLayout = 'full-page' | 'editorial' | 'gallery'
export type MemoryBookPageLayout = 'full' | 'split' | 'grid' | 'story'

export interface MemoryBookPage {
  id: string
  title: string
  caption: string
  photoIds: string[]
  storyId: string | null
  layout: MemoryBookPageLayout
}

export interface MemoryBook {
  id: string
  ownerEmail: string
  title: string
  description: string
  coverPhotoId: string | null
  theme: MemoryBookTheme
  layout: MemoryBookLayout
  pages: MemoryBookPage[]
  state: 'draft' | 'finished'
  createdAt: string
  updatedAt: string
}

export type MemoryBookDetails = Pick<
  MemoryBook,
  'title' | 'description' | 'coverPhotoId' | 'theme' | 'layout' | 'pages' | 'state'
>

export const memoryReelThemes = [
  'Nostalgic Film',
  'Warm Memories',
  'Minimal Editorial',
  'Travel Diary',
  'Family Moments',
] as const

export type MemoryReelTheme = (typeof memoryReelThemes)[number]
export type MemoryReelTransition = 'fade' | 'dissolve' | 'slide' | 'cut'

export interface MemoryReelSlide {
  id: string
  photoId: string
  caption: string
  duration: number
  transition: MemoryReelTransition
}

export interface MemoryReel {
  id: string
  ownerEmail: string
  title: string
  theme: MemoryReelTheme
  slides: MemoryReelSlide[]
  musicName: string | null
  musicBlob: Blob | null
  createdAt: string
  updatedAt: string
}

export type MemoryReelDetails = Pick<
  MemoryReel,
  'title' | 'theme' | 'slides' | 'musicName' | 'musicBlob'
>

export type TimeCapsuleState = 'draft' | 'sealed' | 'opened'

export interface TimeCapsule {
  id: string
  ownerEmail: string
  title: string
  description: string
  letter: string
  unlockDate: string
  coverPhotoId: string | null
  photoIds: string[]
  storyIds: string[]
  state: TimeCapsuleState
  openedAt: string | null
  reflection: string
  createdAt: string
  updatedAt: string
}

export type TimeCapsuleDetails = Pick<
  TimeCapsule,
  'title' | 'description' | 'letter' | 'unlockDate' | 'coverPhotoId' | 'photoIds' | 'storyIds' | 'state'
>

export interface FamilyMember {
  id: string
  ownerEmail: string
  name: string
  relationship: string
  birthDate: string
  biography: string
  photoId: string | null
  generation: string
  createdAt: string
  updatedAt: string
}

export type FamilyMemberDetails = Pick<
  FamilyMember,
  'name' | 'relationship' | 'birthDate' | 'biography' | 'photoId' | 'generation'
>

export const familyStoryCategories = [
  'Family tradition',
  'Growing up',
  'A celebration',
  'A journey',
  'A lesson remembered',
  'Everyday life',
  'Other',
] as const

export type FamilyStoryCategory = (typeof familyStoryCategories)[number]

export interface FamilyStory {
  id: string
  ownerEmail: string
  title: string
  body: string
  date: string
  location: string
  category: FamilyStoryCategory
  tags: string[]
  photoIds: string[]
  memberIds: string[]
  createdAt: string
  updatedAt: string
}

export type FamilyStoryDetails = Pick<
  FamilyStory,
  'title' | 'body' | 'date' | 'location' | 'category' | 'tags' | 'photoIds' | 'memberIds'
>

export const familyMilestoneCategories = [
  'Birthday',
  'Anniversary',
  'Graduation',
  'Wedding',
  'Family reunion',
  'Achievement',
  'Other',
] as const

export type FamilyMilestoneCategory = (typeof familyMilestoneCategories)[number]

export interface FamilyMilestone {
  id: string
  ownerEmail: string
  title: string
  date: string
  description: string
  category: FamilyMilestoneCategory
  memberIds: string[]
  photoId: string | null
  createdAt: string
  updatedAt: string
}

export type FamilyMilestoneDetails = Pick<
  FamilyMilestone,
  'title' | 'date' | 'description' | 'category' | 'memberIds' | 'photoId'
>

export type PhotoDetails = Pick<
  MemoryPhoto,
  'title' | 'caption' | 'date' | 'location' | 'tags' | 'category'
>

export type AlbumDetails = Pick<
  MemoryAlbum,
  'name' | 'description' | 'category' | 'photoIds' | 'coverPhotoId'
>

export type MilestoneDetails = Pick<
  LifeMilestone,
  'title' | 'date' | 'description' | 'photoId'
>

export type MemoryWallLayoutKind =
  | 'Editorial Grid'
  | 'Masonry Wall'
  | 'Film Strip'
  | 'Minimal Collage'
  | 'Family Memories'

export type MemoryWallBackground = 'ivory' | 'sand' | 'sage' | 'charcoal'

export interface MemoryWallTile {
  photoId: string
  size: 'regular' | 'featured'
  caption: string
}

export interface MemoryWallLayout {
  id: string
  ownerEmail: string
  name: string
  layout: MemoryWallLayoutKind
  background: MemoryWallBackground
  tiles: MemoryWallTile[]
  createdAt: string
  updatedAt: string
}

export type MemoryWallLayoutDetails = Pick<
  MemoryWallLayout,
  'name' | 'layout' | 'background' | 'tiles'
>

export interface DeletedMemoryPhoto {
  id: string
  ownerEmail: string
  photo: MemoryPhoto
  deletedAt: string
}

export interface UserProfile {
  id: string
  ownerEmail: string
  fullName: string
  biography: string
  photoBlob: Blob | null
  accountCreatedAt: string | null
  updatedAt: string
}

export type MemoryNotificationCategory =
  | 'memory-reminder'
  | 'time-capsule-update'
  | 'shared-album-activity'
  | 'story-update'
  | 'application-announcement'

export interface MemoryNotification {
  id: string
  ownerEmail: string
  category: MemoryNotificationCategory
  title: string
  body: string
  href: string
  createdAt: string
  readAt: string | null
}

export interface NotificationPreferences {
  memoryReminders: boolean
  timeCapsuleReminders: boolean
  sharedAlbumActivity: boolean
  storyUpdates: boolean
  applicationAnnouncements: boolean
}

export interface MemorySettings {
  id: string
  ownerEmail: string
  theme: 'light'
  galleryDensity: 'comfortable' | 'compact'
  profileVisibility: 'private' | 'local-demo'
  sharedAlbumPrivacy: 'private' | 'invitation-only'
  notifications: NotificationPreferences
  updatedAt: string
}

export type UserProfileDetails = Pick<UserProfile, 'fullName' | 'biography' | 'photoBlob'>
