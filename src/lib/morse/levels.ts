import { shuffle } from './drill'
import { MORSE_CHARS } from './table'
import { pickChallengeWords } from './words'

export type Level = 'easy' | 'medium' | 'hard'
export const LEVELS: Level[] = ['easy', 'medium', 'hard']

export const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
export const DIGITS = [...'0123456789']

export function levelChars(level: Level): string[] {
  if (level === 'easy') return [...MORSE_CHARS]
  if (level === 'medium') return LETTERS
  return [...LETTERS, ...DIGITS]
}

/** Short words a scout at the station would know, in English or as loanwords in Indonesian. */
export const MEDIUM_WORDS = [
  'RADIO', 'CAMP', 'TENT', 'KNOT', 'SCOUT', 'WAVE', 'FIRE', 'FLAG', 'ROPE', 'HIKE',
  'JOTA', 'MAP', 'SKY', 'BUS', 'KEY', 'HELLO', 'BADGE', 'TORCH', 'RIVER', 'FOX',
  'JAM', 'ZOO', 'QUIZ', 'WOLF', 'BOX', 'GPS', 'VOICE', 'PIZZA', 'JUNGLE', 'LIGHT',
]

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

export function pickWords(level: Level, count = 5, rand: () => number = Math.random): string[] {
  if (level === 'easy') return pickChallengeWords(count, rand)
  if (level === 'medium') {
    return shuffle(MEDIUM_WORDS, rand)
      .slice(0, count)
      .sort((a, b) => a.length - b.length)
  }
  const codes = shuffle(HARD_CODES, rand).slice(0, 2)
  const calls = new Set<string>()
  while (calls.size < count - codes.length) calls.add(callsign(rand))
  // Codes are shorter, so they open the round.
  return [...codes, ...calls]
}
