import type {
  CuratorSuggestion,
  MemoryAlbum,
  MemoryPhoto,
  PhotoCategory,
} from './memoryTypes'

const categoryClues: Array<{ category: PhotoCategory; terms: string[] }> = [
  { category: 'Family', terms: ['family', 'parent', 'grandma', 'grandpa', 'sibling', 'cousin'] },
  { category: 'Friends', terms: ['friend', 'bestie', 'mates'] },
  { category: 'Childhood', terms: ['childhood', 'kid', 'school', 'toy', 'birthday'] },
  { category: 'Travel', terms: ['travel', 'trip', 'flight', 'beach', 'mountain', 'hotel', 'journey'] },
  { category: 'Celebrations', terms: ['celebration', 'party', 'wedding', 'anniversary', 'graduation'] },
  { category: 'College', terms: ['college', 'university', 'campus', 'lecture', 'class'] },
  { category: 'Special Occasions', terms: ['occasion', 'ceremony', 'festival', 'reunion'] },
  { category: 'Everyday Moments', terms: ['everyday', 'home', 'garden', 'daily', 'ordinary'] },
]

export function generateLocalCuratorSuggestions(
  photos: MemoryPhoto[],
  albums: MemoryAlbum[],
  ownerEmail: string,
): CuratorSuggestion[] {
  const generatedAt = new Date().toISOString()
  const membership = new Set(albums.flatMap((album) => album.photoIds))
  const suggestions: CuratorSuggestion[] = []
  const add = (
    kind: CuratorSuggestion['kind'],
    photoIds: string[],
    title: string,
    description: string,
    values: Partial<Pick<CuratorSuggestion, 'suggestedCategory' | 'suggestedTags' | 'suggestedCaption' | 'collectionName'>> = {},
  ) => {
    const ids = [...new Set(photoIds)].filter((id) => photos.some((photo) => photo.id === id)).sort()
    if (!ids.length) return
    suggestions.push({
      id: `curator:${kind}:${ids.map(encodeURIComponent).join(':')}`,
      ownerEmail,
      kind,
      title,
      description,
      photoIds: ids,
      status: 'suggested',
      suggestedCategory: null,
      suggestedTags: [],
      suggestedCaption: null,
      collectionName: null,
      ...values,
      createdAt: generatedAt,
      updatedAt: generatedAt,
    })
  }

  for (const photo of photos) {
    if (!photo.category) {
      const category = inferCategory(photo)
      if (category) {
        add('category', [photo.id], `Place this in ${category}`, `The words already saved with “${photo.title}” fit this category.`, {
          suggestedCategory: category,
        })
      }
    }

    if (!photo.caption.trim()) {
      const year = photo.date.slice(0, 4)
      const caption = photo.location.trim()
        ? `A moment in ${photo.location.trim()}${year ? `, ${year}` : ''}.`
        : year ? `A moment worth keeping from ${year}.` : `A moment worth keeping: ${photo.title}.`
      add('caption', [photo.id], `Give “${photo.title}” a caption`, 'A locally composed starting point, ready for your own words.', {
        suggestedCaption: caption,
      })
    }

    if (photo.tags.length < 2) {
      const locationTags = photo.location.trim().toLowerCase()
        .replace(/[^\p{L}\p{N} ]/gu, '')
        .split(/\s+/)
        .filter((part) => part.length > 2)
        .slice(0, 2)
      const suggestedTags = [...new Set([
        ...photo.tags,
        ...locationTags,
        ...(photo.category ? [photo.category.toLowerCase()] : []),
      ])].slice(0, 4)
      if (suggestedTags.length > photo.tags.length) {
        add('tags', [photo.id], `Add a few tags to “${photo.title}”`, 'Suggestions come from this photograph’s own location and category fields.', {
          suggestedTags,
        })
      }
    }
  }

  const unfiled = photos.filter((photo) => !membership.has(photo.id))
  const byLocation = groupBy(unfiled.filter((photo) => photo.location.trim()), (photo) => photo.location.trim().toLowerCase())
  for (const group of byLocation.values()) {
    if (group.length < 2) continue
    const name = titleCase(group[0].location.trim())
    add('collection', group.map((photo) => photo.id), `Gather moments from ${name}`, `${group.length} unfiled photographs share this location.`, {
      collectionName: name,
    })
  }

  const byCategoryYear = groupBy(
    photos.filter((photo) => photo.category),
    (photo) => `${photo.category}:${photo.date.slice(0, 4) || 'undated'}`,
  )
  for (const [key, group] of byCategoryYear) {
    if (group.length < 3) continue
    const [category, year] = key.split(':')
    add('similar', group.map((photo) => photo.id), `A ${category.toLowerCase()} chapter from ${year}`, `${group.length} photographs share a category and year. Review them as a possible collection.`, {
      collectionName: `${year} ${category}`,
    })
  }

  const byFile = groupBy(photos, (photo) => `${photo.fileName.trim().toLowerCase()}:${photo.mimeType}:${photo.blob.size}`)
  for (const group of byFile.values()) {
    if (group.length < 2 || !group[0].fileName.trim()) continue
    add('duplicate', group.map((photo) => photo.id), `Review possible copies of “${group[0].fileName}”`, 'These files share a name, format and size. This is only a local comparison; nothing will be removed automatically.')
  }

  return suggestions
}

function inferCategory(photo: MemoryPhoto): PhotoCategory | null {
  const text = `${photo.title} ${photo.caption} ${photo.location} ${photo.tags.join(' ')}`.toLowerCase()
  return categoryClues.find(({ terms }) => terms.some((term) => text.includes(term)))?.category ?? null
}

function groupBy<T>(items: T[], keyFor: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFor(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return groups
}

function titleCase(value: string): string {
  return value.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())
}
