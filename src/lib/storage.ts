import type { BadgeId } from './badges'
import type { Level } from './morse/levels'

export const STORAGE_KEY = 'jota-morse'

export type Bests = Record<Level, number>

export interface Persisted {
  v: 2
  lang: 'en' | 'id'
  nickname?: string
  /** Personal best per level. */
  bests: Bests
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
    const data = JSON.parse(raw) as (Omit<Partial<Persisted>, 'v'> & { v?: number; bestScore?: number }) | null
    // v1 had one best score, from the 7-letter challenge that is now Easy.
    if (data?.v === 1) {
      const { bestScore, ...rest } = data
      return { ...rest, v: 2, bests: { easy: bestScore ?? 0, medium: 0, hard: 0 } }
    }
    // Unknown versions are discarded rather than half-trusted.
    if (data?.v !== 2) return null
    return data as Partial<Persisted>
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
