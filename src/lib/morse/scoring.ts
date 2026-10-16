export const POINTS_PER_LETTER = 100
export const SPEED_BONUS_MAX = 50
export const SPEED_BONUS_WINDOW_S = 20
export const REPLAY_PENALTY = 10
export const MAX_MULTIPLIER = 2

export interface WordResult {
  word: string
  answer: string
  correctLetters: number
  replays: number
  seconds: number
  points: number
}

export function speedBonus(seconds: number): number {
  const frac = 1 - seconds / SPEED_BONUS_WINDOW_S
  return Math.round(SPEED_BONUS_MAX * Math.min(1, Math.max(0, frac)))
}

/** Streak counts consecutive fully correct words before this one. */
export function multiplier(streak: number): number {
  return Math.min(MAX_MULTIPLIER, 1 + 0.25 * Math.max(0, streak))
}

export function countCorrect(word: string, answer: string): number {
  let n = 0
  for (let i = 0; i < word.length; i++) if (word[i] === answer[i]) n++
  return n
}

export function scoreWord(
  word: string,
  answer: string,
  replays: number,
  seconds: number,
  streak: number,
): WordResult {
  const correctLetters = countCorrect(word, answer)
  const perfect = correctLetters === word.length
  const base = correctLetters * POINTS_PER_LETTER + (perfect ? speedBonus(seconds) : 0)
  const raw = Math.max(0, base - replays * REPLAY_PENALTY)
  const points = Math.round(raw * (perfect ? multiplier(streak) : 1))
  return { word, answer, correctLetters, replays, seconds, points }
}
