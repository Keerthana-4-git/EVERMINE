import { useContext } from 'react'
import { MemoryContext } from './memoryContext'

export function useMemory() {
  const context = useContext(MemoryContext)
  if (!context) throw new Error('useMemory must be used within MemoryProvider.')
  return context
}
