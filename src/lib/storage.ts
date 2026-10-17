import type { BadgeId } from './badges'
import type { Level } from './morse/levels'

export const STORAGE_KEY = 'jota-morse'

/** Easy keeps one best per stage; Medium and Hard keep one each. */
export type BestKey = 'easy1' | 'easy2' | 'easy3' | 'easy4' | 'medium' | 'hard'
export type Bests = Record<BestKey, number>

export const NO_BESTS: Bests = { easy1: 0, easy2: 0, easy3: 0, easy4: 0, medium: 0, hard: 0 }

export function bestKey(level: Level, stage: number): BestKey {
  return level === 'easy' ? (`easy${stage}` as BestKey) : level
}

export interface Persisted {
  v: 3
  lang: 'en' | 'id'
  nickname?: string
  /** Personal best per Easy stage, Medium, and Hard. */
  bests: Bests
  badges: BadgeId[]
  reduceMotion?: boolean
  /** Missing means light: first start is always light, whatever the OS says. */
  theme?: 'light' | 'dark'
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
    const data = JSON.parse(raw) as
      | (Omit<Partial<Persisted>, 'v' | 'bests'> & { v?: number; bestScore?: number; bests?: Record<string, number> })
      | null
    // v1 had one best score, from the 7-letter challenge that is now Easy stage 1.
    if (data?.v === 1) {
      const { bestScore, bests: _, ...rest } = data
      return { ...rest, v: 3, bests: { ...NO_BESTS, easy1: bestScore ?? 0 } }
    }
    // v2 had one Easy best, also from the 7-letter stage.
    if (data?.v === 2) {
      const { easy = 0, medium = 0, hard = 0 } = data.bests ?? {}
      return { ...data, v: 3, bests: { ...NO_BESTS, easy1: easy, medium, hard } }
    }
    // Unknown versions are discarded rather than half-trusted.
    if (data?.v !== 3) return null
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
