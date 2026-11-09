import type { MemoryPhoto } from './memoryTypes'

export interface CalendarDateParts {
  year: number
  month: number
  day: number
}

export interface OnThisDayGroup {
  year: number
  photos: MemoryPhoto[]
}

export function parseCalendarDate(value: string): CalendarDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return { year, month, day }
}

export function toCalendarDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateFromCalendarValue(value: string): Date | null {
  const parts = parseCalendarDate(value)
  return parts ? new Date(parts.year, parts.month - 1, parts.day) : null
}

export function shiftCalendarDate(value: string, days: number): string {
  const date = dateFromCalendarValue(value)
  if (!date) return value
  date.setDate(date.getDate() + days)
  return toCalendarDate(date)
}

export function formatCalendarDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' },
): string {
  const date = dateFromCalendarValue(value)
  return date
    ? new Intl.DateTimeFormat(undefined, options).format(date)
    : 'Date not set'
}

export function photosOnThisDay(
  photos: MemoryPhoto[],
  dateValue: string,
): OnThisDayGroup[] {
  const selectedDate = parseCalendarDate(dateValue)
  if (!selectedDate) return []

  const byYear = new Map<number, MemoryPhoto[]>()
  photos.forEach((photo) => {
    const photoDate = parseCalendarDate(photo.date)
    if (
      !photoDate ||
      photoDate.year >= selectedDate.year ||
      photoDate.month !== selectedDate.month ||
      photoDate.day !== selectedDate.day
    ) {
      return
    }
    const yearPhotos = byYear.get(photoDate.year) ?? []
    yearPhotos.push(photo)
    byYear.set(photoDate.year, yearPhotos)
  })

  return [...byYear.entries()]
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, yearPhotos]) => ({
      year,
      photos: yearPhotos.sort((a, b) => a.title.localeCompare(b.title)),
    }))
}
