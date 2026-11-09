import { useEffect, useState } from 'react'

export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const objectUrl = blob ? URL.createObjectURL(blob) : null
    queueMicrotask(() => {
      if (active) setUrl(objectUrl)
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [blob])

  return url
}
