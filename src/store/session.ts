import { create } from 'zustand'
import type { BadgeId } from '@/lib/badges'
import type { WordResult } from '@/lib/morse/scoring'
import type { Level } from '@/lib/morse/levels'
import { loadPersisted, savePersisted, type Persisted } from '@/lib/storage'

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
  /** Returns true when the score beats the level's best. */
  submitScore: (level: Level, score: number) => boolean
}

const saved = loadPersisted()

export const usePersisted = create<PersistedStore>()((set, get) => ({
  v: 2,
  lang: saved?.lang ?? detectLang(),
  nickname: saved?.nickname,
  bests: { easy: 0, medium: 0, hard: 0, ...saved?.bests },
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
  submitScore: (level, score) => {
    if (score <= get().bests[level]) return false
    set({ bests: { ...get().bests, [level]: score } })
    return true
  },
}))

usePersisted.subscribe((s) =>
  savePersisted({
    v: 2,
    lang: s.lang,
    nickname: s.nickname,
    bests: s.bests,
    badges: s.badges,
    reduceMotion: s.reduceMotion,
  }),
)

interface SessionStore {
  groupIndex: number
  /** Highest learn group finished this session (0 = none). */
  groupsDone: number
  /** Picked on the level screen; null until then. */
  level: Level | null
  score: number
  streak: number
  challenge: { words: string[]; results: WordResult[] }
  /** Badges earned in this run, for the finish screen highlight. */
  newBadges: BadgeId[]
  completeGroup: (group: number) => void
  setLevel: (level: Level) => void
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
  groupIndex: 0,
  groupsDone: 0,
  level: null,
  newBadges: [],
  ...freshRun(),
  completeGroup: (group) =>
    set((s) => ({ groupsDone: Math.max(s.groupsDone, group), groupIndex: group })),
  setLevel: (level) => set({ level }),
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
