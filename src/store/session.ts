import { create } from 'zustand'
import type { BadgeId } from '@/lib/badges'
import type { WordResult } from '@/lib/morse/scoring'
import type { Level } from '@/lib/morse/levels'
import { loadPersisted, NO_BESTS, savePersisted, type BestKey, type Persisted } from '@/lib/storage'

function detectLang(): Persisted['lang'] {
  try {
    return navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en'
  } catch {
    return 'en'
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

interface PersistedStore extends Persisted {
  setLang: (lang: Persisted['lang']) => void
  setNickname: (nickname: string) => void
  setReduceMotion: (on: boolean) => void
  /** Returns true when the badge is new. */
  awardBadge: (id: BadgeId) => boolean
  /** Returns true when the score beats the best for that level or stage. */
  submitScore: (key: BestKey, score: number) => boolean
}

const saved = loadPersisted()

export const usePersisted = create<PersistedStore>()((set, get) => ({
  v: 3,
  lang: saved?.lang ?? detectLang(),
  nickname: saved?.nickname,
  bests: { ...NO_BESTS, ...saved?.bests },
  badges: saved?.badges ?? [],
  reduceMotion: saved?.reduceMotion ?? prefersReducedMotion(),
  setLang: (lang) => set({ lang }),
  setNickname: (nickname) => set({ nickname }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  awardBadge: (id) => {
    if (get().badges.includes(id)) return false
    set({ badges: [...get().badges, id] })
    return true
  },
  submitScore: (key, score) => {
    if (score <= get().bests[key]) return false
    set({ bests: { ...get().bests, [key]: score } })
    return true
  },
}))

usePersisted.subscribe((s) =>
  savePersisted({
    v: 3,
    lang: s.lang,
    nickname: s.nickname,
    bests: s.bests,
    badges: s.badges,
    reduceMotion: s.reduceMotion,
  }),
)

interface SessionStore {
  /** Packs finished this visit, per Easy stage (0 = none). */
  packsDone: Record<number, number>
  /** Picked on the level screen; null until then. */
  level: Level | null
  /** Easy stage, picked on the stage screen. */
  stage: number
  score: number
  streak: number
  challenge: { words: string[]; results: WordResult[] }
  /** Badges earned in this run, for the finish screen highlight. */
  newBadges: BadgeId[]
  completePack: (stage: number, pack: number) => void
  setLevel: (level: Level) => void
  setStage: (stage: number) => void
  startChallenge: (words: string[]) => void
  recordWord: (r: WordResult) => void
  noteBadge: (id: BadgeId) => void
  resetRun: () => void
}

const freshRun = () => ({
  score: 0,
  streak: 0,
  challenge: { words: [] as string[], results: [] as WordResult[] },
})

export const useSession = create<SessionStore>()((set) => ({
  packsDone: {},
  level: null,
  stage: 1,
  newBadges: [],
  ...freshRun(),
  completePack: (stage, pack) =>
    set((s) => ({ packsDone: { ...s.packsDone, [stage]: Math.max(s.packsDone[stage] ?? 0, pack) } })),
  setLevel: (level) => set({ level }),
  setStage: (stage) => set({ stage }),
  startChallenge: (words) => set({ ...freshRun(), challenge: { words, results: [] } }),
  recordWord: (r) =>
    set((s) => ({
      score: s.score + r.points,
      streak: r.correctLetters === r.word.length ? s.streak + 1 : 0,
      challenge: { ...s.challenge, results: [...s.challenge.results, r] },
    })),
  noteBadge: (id) => set((s) => (s.newBadges.includes(id) ? s : { newBadges: [...s.newBadges, id] })),
  resetRun: () => set({ ...freshRun(), newBadges: [] }),
}))
