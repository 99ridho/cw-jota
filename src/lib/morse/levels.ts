import { shuffle } from './drill'
import { STAGES, stageChars } from './table'
import { MEDIUM_POOL } from './wordPools'
import { pickStageWords } from './words'

export type Level = 'easy' | 'medium' | 'hard'
export const LEVELS: Level[] = ['easy', 'medium', 'hard']

export const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
export const DIGITS = [...'0123456789']

export const EASY_STAGES = STAGES.length

/**
 * Where picking an Easy stage leads, given the packs finished this visit.
 * Earlier stages get a warm-up unless they were all learned this visit; a
 * stage whose packs are done goes straight to its challenge.
 */
export function stageStart(stage: number, packsDone: Record<number, number>): string {
  const packs = STAGES[stage - 1]?.length ?? 0
  const done = packsDone[stage] ?? 0
  if (done >= packs) return '/challenge'
  const learnedBefore = STAGES.slice(0, stage - 1).every((p, i) => (packsDone[i + 1] ?? 0) >= p.length)
  if (done === 0 && !learnedBefore) return `/learn/${stage}/recap`
  return `/learn/${stage}/${done + 1}`
}

/** Characters a level can play. Easy depends on the stage. */
export function levelChars(level: Level, stage = 1): string[] {
  if (level === 'easy') return stageChars(stage)
  if (level === 'medium') return LETTERS
  return [...LETTERS, ...DIGITS]
}

/** Ham radio shorthand that mixes in digits. */
export const HARD_CODES = ['73', '88', '599', '5NN', 'CQ', 'QTH', 'QSL', 'QRZ', 'JOTA26']

const ID_PREFIXES = ['YB', 'YC', 'YD', 'YE', 'YF', 'YG', 'YH']
const WORLD_PREFIXES = ['W', 'K', 'N', 'VK', 'JA', 'DL', 'G', 'VE', '9M', '9V', 'HS', 'DU']

const pickOne = <T>(arr: T[], rand: () => number): T => arr[Math.floor(rand() * arr.length)]!

/** A made-up amateur callsign: prefix, one digit, then letters, at most 6 characters. */
export function callsign(rand: () => number = Math.random): string {
  const prefix = pickOne(rand() < 0.5 ? ID_PREFIXES : WORLD_PREFIXES, rand)
  const room = 6 - prefix.length - 1
  const n = 1 + Math.floor(rand() * Math.min(3, room))
  const suffix = Array.from({ length: n }, () => pickOne(LETTERS, rand)).join('')
  return prefix + pickOne(DIGITS, rand) + suffix
}

export function pickWords(level: Level, stage = 1, count = 5, rand: () => number = Math.random): string[] {
  if (level === 'easy') return pickStageWords(stage, count, rand)
  if (level === 'medium') {
    return shuffle(MEDIUM_POOL, rand)
      .slice(0, count)
      .sort((a, b) => a.length - b.length)
  }
  const code = pickOne(HARD_CODES, rand)
  const word = pickOne(MEDIUM_POOL, rand)
  const calls = new Set<string>()
  while (calls.size < count - 2) calls.add(callsign(rand))
  // Familiar items open the round; the callsigns, which must be heard letter by letter, close it.
  return [code, word, ...calls]
}
