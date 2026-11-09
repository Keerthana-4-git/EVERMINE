import { createContext } from 'react'
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
  SharedAlbum,
  SharedAlbumDetails,
  SharedAlbumPermission,
  CuratorSuggestion,
  FamilyMember,
  FamilyMemberDetails,
  FamilyStory,
  FamilyStoryDetails,
  FamilyMilestone,
  FamilyMilestoneDetails,
  TimeCapsule,
  TimeCapsuleDetails,
  DeletedMemoryPhoto,
  MemoryNotification,
  MemorySettings,
  MemoryWallLayout,
  MemoryWallLayoutDetails,
  UserProfile,
  UserProfileDetails,
  PromptResponseDetails,
  PhotoDetails,
  StoryDetails,
} from './memoryTypes'

export interface MemoryContextValue {
  photos: MemoryPhoto[]
  albums: MemoryAlbum[]
  milestones: LifeMilestone[]
  stories: MemoryStory[]
  promptResponses: MemoryPromptResponse[]
  books: MemoryBook[]
  reels: MemoryReel[]
  capsules: TimeCapsule[]
  familyMembers: FamilyMember[]
  familyStories: FamilyStory[]
  familyMilestones: FamilyMilestone[]
  sharedAlbums: SharedAlbum[]
  curatorSuggestions: CuratorSuggestion[]
  deletedPhotos: DeletedMemoryPhoto[]
  profile: UserProfile
  settings: MemorySettings
  memoryWalls: MemoryWallLayout[]
  notifications: MemoryNotification[]
  loading: boolean
  storageError: string
  addPhoto: (photo: Omit<MemoryPhoto, 'ownerEmail'>) => Promise<void>
  updatePhoto: (id: string, details: PhotoDetails) => Promise<void>
  deletePhotos: (ids: string[]) => Promise<void>
  restorePhotos: (ids: string[]) => Promise<void>
  permanentlyDeletePhotos: (ids: string[]) => Promise<void>
  saveProfile: (details: UserProfileDetails) => Promise<void>
  saveSettings: (settings: MemorySettings) => Promise<void>
  saveMemoryWall: (details: MemoryWallLayoutDetails, id?: string) => Promise<string>
  deleteMemoryWall: (id: string) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearNotifications: () => Promise<void>
  clearApplicationData: () => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  createAlbum: (details: AlbumDetails) => Promise<void>
  updateAlbum: (id: string, details: AlbumDetails) => Promise<void>
  deleteAlbum: (id: string) => Promise<void>
  createMilestone: (details: MilestoneDetails) => Promise<void>
  updateMilestone: (id: string, details: MilestoneDetails) => Promise<void>
  deleteMilestone: (id: string) => Promise<void>
  createStory: (details: StoryDetails) => Promise<string>
  updateStory: (id: string, details: StoryDetails) => Promise<void>
  deleteStory: (id: string) => Promise<void>
  createPromptResponse: (details: PromptResponseDetails) => Promise<string>
  updatePromptResponse: (id: string, details: PromptResponseDetails) => Promise<void>
  deletePromptResponse: (id: string) => Promise<void>
  createBook: (details: MemoryBookDetails) => Promise<string>
  updateBook: (id: string, details: MemoryBookDetails) => Promise<void>
  deleteBook: (id: string) => Promise<void>
  duplicateBook: (id: string) => Promise<string>
  createReel: (details: MemoryReelDetails) => Promise<string>
  updateReel: (id: string, details: MemoryReelDetails) => Promise<void>
  deleteReel: (id: string) => Promise<void>
  createCapsule: (details: TimeCapsuleDetails) => Promise<string>
  updateCapsule: (id: string, details: TimeCapsuleDetails) => Promise<void>
  deleteCapsule: (id: string) => Promise<void>
  openCapsule: (id: string) => Promise<void>
  updateCapsuleReflection: (id: string, reflection: string) => Promise<void>
  createFamilyMember: (details: FamilyMemberDetails) => Promise<string>
  updateFamilyMember: (id: string, details: FamilyMemberDetails) => Promise<void>
  deleteFamilyMember: (id: string) => Promise<void>
  createFamilyStory: (details: FamilyStoryDetails) => Promise<string>
  updateFamilyStory: (id: string, details: FamilyStoryDetails) => Promise<void>
  deleteFamilyStory: (id: string) => Promise<void>
  createFamilyMilestone: (details: FamilyMilestoneDetails) => Promise<string>
  updateFamilyMilestone: (id: string, details: FamilyMilestoneDetails) => Promise<void>
  deleteFamilyMilestone: (id: string) => Promise<void>
  createSharedAlbum: (details: SharedAlbumDetails) => Promise<string>
  updateSharedAlbum: (id: string, details: SharedAlbumDetails) => Promise<void>
  deleteSharedAlbum: (id: string) => Promise<void>
  inviteCollaborator: (albumId: string, details: { name: string; email: string; permission: SharedAlbumPermission }) => Promise<void>
  cancelInvitation: (albumId: string, collaboratorId: string) => Promise<void>
  simulateInvitationAcceptance: (albumId: string, collaboratorId: string) => Promise<void>
  updateCollaboratorPermission: (albumId: string, collaboratorId: string, permission: SharedAlbumPermission) => Promise<void>
  removeCollaborator: (albumId: string, collaboratorId: string) => Promise<void>
  addSharedAlbumComment: (albumId: string, photoId: string, body: string) => Promise<void>
  toggleSharedAlbumReaction: (albumId: string, photoId: string) => Promise<void>
  saveCuratorSuggestion: (suggestion: CuratorSuggestion) => Promise<void>
}

export const MemoryContext = createContext<MemoryContextValue | null>(null)
