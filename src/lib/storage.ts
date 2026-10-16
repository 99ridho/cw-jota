import type { BadgeId } from './badges'

export const STORAGE_KEY = 'jota-morse'

export interface Persisted {
  v: 1
  lang: 'en' | 'id'
  nickname?: string
  bestScore: number
  badges: BadgeId[]
  reduceMotion?: boolean
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function loadPersisted(): Partial<Persisted> | null {
  try {
    const raw = getStorage()?.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<Persisted>
    // Unknown versions are discarded rather than half-trusted.
    if (data?.v !== 1) return null
    return data
  } catch {
    return null
  }
}

export function savePersisted(data: Persisted): void {
  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage blocked or full: the game keeps running on in-memory state.
  }
}
