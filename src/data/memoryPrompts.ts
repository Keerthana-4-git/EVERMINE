import { promptCategories, type PromptCategory } from './memoryTypes'

export interface MemoryPrompt {
  id: string
  category: PromptCategory
  text: string
}

export const memoryPrompts: MemoryPrompt[] = [
  { id: 'childhood-hideaway', category: 'Childhood memories', text: 'Where did you go when you wanted a little time to yourself as a child?' },
  { id: 'childhood-summer', category: 'Childhood memories', text: 'What did a perfect summer afternoon look, sound, and smell like when you were young?' },
  { id: 'childhood-treasure', category: 'Childhood memories', text: 'What small object did you treasure, and what made it feel so important?' },
  { id: 'childhood-game', category: 'Childhood memories', text: 'What game could keep you happily occupied for hours?' },
  { id: 'family-table', category: 'Family moments', text: 'What meal or gathering brings your family to mind, and who was usually there?' },
  { id: 'family-phrase', category: 'Family moments', text: 'What saying or expression from someone in your family do you still remember?' },
  { id: 'family-tradition', category: 'Family moments', text: 'Which family tradition would you like to pass along, and why?' },
  { id: 'family-kindness', category: 'Family moments', text: 'Recall a quiet act of care from a family member that stayed with you.' },
  { id: 'friendship-laughter', category: 'Friendship', text: 'Who can make you laugh almost immediately, and what memory captures that?' },
  { id: 'friendship-beginning', category: 'Friendship', text: 'How did an important friendship begin?' },
  { id: 'friendship-adventure', category: 'Friendship', text: 'What spontaneous day with a friend would you happily relive?' },
  { id: 'friendship-lesson', category: 'Friendship', text: 'What has a friend taught you about the kind of person you want to be?' },
  { id: 'school-first-day', category: 'School and college', text: 'What do you remember most clearly about a first day at school or college?' },
  { id: 'school-mentor', category: 'School and college', text: 'Which teacher, classmate, or mentor helped you see yourself differently?' },
  { id: 'school-after-class', category: 'School and college', text: 'What did you and your friends do after classes ended?' },
  { id: 'school-proud', category: 'School and college', text: 'What achievement from those years felt meaningful to you?' },
  { id: 'travel-window', category: 'Travel adventures', text: 'Describe a view from a journey that made you pause and take it in.' },
  { id: 'travel-detour', category: 'Travel adventures', text: 'When did an unexpected detour become part of the best travel story?' },
  { id: 'travel-local', category: 'Travel adventures', text: 'What place felt familiar surprisingly quickly, even though you had never been there?' },
  { id: 'travel-senses', category: 'Travel adventures', text: 'Which taste, sound, or scent can take you straight back to a trip?' },
  { id: 'celebration-small', category: 'Celebrations', text: 'What small celebration made an ordinary day feel special?' },
  { id: 'celebration-toast', category: 'Celebrations', text: 'What words from a celebration would you like to remember?' },
  { id: 'celebration-tradition', category: 'Celebrations', text: 'Which celebration tradition always brings you comfort or joy?' },
  { id: 'celebration-surprise', category: 'Celebrations', text: 'Recall a celebration that turned out differently, in a good way, than you expected.' },
  { id: 'growth-courage', category: 'Personal growth', text: 'When did you do something that once seemed a little beyond your reach?' },
  { id: 'growth-change', category: 'Personal growth', text: 'What change in yourself did you only notice when you looked back?' },
  { id: 'growth-advice', category: 'Personal growth', text: 'What would you tell a past version of yourself about a difficult season?' },
  { id: 'growth-practice', category: 'Personal growth', text: 'What everyday practice has helped you become more yourself?' },
  { id: 'everyday-morning', category: 'Everyday moments', text: 'What simple morning moment would you like to remember from this season of life?' },
  { id: 'everyday-home', category: 'Everyday moments', text: 'Which familiar corner of home holds the most ordinary, lovely memories?' },
  { id: 'everyday-sound', category: 'Everyday moments', text: 'What everyday sound makes a place feel like yours?' },
  { id: 'everyday-kindness', category: 'Everyday moments', text: 'What small kindness did you notice recently?' },
]

export function getDailyPrompt(date: Date): MemoryPrompt {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  const index = ((dayNumber % memoryPrompts.length) + memoryPrompts.length) % memoryPrompts.length
  return memoryPrompts[index]
}

export function getPromptCategory(promptId: string): PromptCategory {
  return memoryPrompts.find((prompt) => prompt.id === promptId)?.category ?? promptCategories[0]
}

export function categoryForStory(category: PromptCategory) {
  switch (category) {
    case 'Childhood memories':
      return 'Childhood' as const
    case 'Family moments':
      return 'Family' as const
    case 'Friendship':
      return 'Friends' as const
    case 'School and college':
      return 'School and College' as const
    case 'Travel adventures':
      return 'Travel' as const
    case 'Celebrations':
      return 'Celebrations' as const
    case 'Personal growth':
      return 'Personal Growth' as const
    case 'Everyday moments':
      return 'Everyday Moments' as const
  }
}
