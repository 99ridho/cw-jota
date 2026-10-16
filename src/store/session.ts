import { create } from 'zustand'
import type { BadgeId } from '@/lib/badges'
import type { WordResult } from '@/lib/morse/scoring'
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
  submitScore: (score: number) => boolean
}

const saved = loadPersisted()

export const usePersisted = create<PersistedStore>()((set, get) => ({
  v: 1,
  lang: saved?.lang ?? detectLang(),
  nickname: saved?.nickname,
  bestScore: saved?.bestScore ?? 0,
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
  submitScore: (score) => {
    if (score <= get().bestScore) return false
    set({ bestScore: score })
    return true
  },
}))

usePersisted.subscribe((s) =>
  savePersisted({
    v: 1,
    lang: s.lang,
    nickname: s.nickname,
    bestScore: s.bestScore,
    badges: s.badges,
    reduceMotion: s.reduceMotion,
  }),
)

interface SessionStore {
  groupIndex: number
  /** Highest learn group finished this session (0 = none). */
  groupsDone: number
  score: number
  streak: number
  challenge: { words: string[]; results: WordResult[] }
  /** Badges earned in this run, for the finish screen highlight. */
  newBadges: BadgeId[]
  completeGroup: (group: number) => void
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
  newBadges: [],
  ...freshRun(),
  completeGroup: (group) =>
    set((s) => ({ groupsDone: Math.max(s.groupsDone, group), groupIndex: group })),
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
