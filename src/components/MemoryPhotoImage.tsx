import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { useObjectUrl } from './useObjectUrl'
import type { MemoryPhoto } from '../data/memoryTypes'

export function MemoryPhotoImage({
  photo,
  alt,
  className = '',
}: {
  photo?: MemoryPhoto
  alt?: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const url = useObjectUrl(photo?.blob)

  return (
    <div className={`photo-fallback relative overflow-hidden ${className}`}>
      {url && !failed ? (
        <img
          src={url}
          alt={alt ?? photo?.title ?? ''}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-[#8b8175]"
          role="img"
          aria-label={alt ?? 'Photograph preview unavailable'}
        >
          <ImageOff size={23} strokeWidth={1.3} />
        </div>
      )}
    </div>
  )
}
