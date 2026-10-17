import { shuffle } from './drill'
import { EASY_POOLS } from './wordPools'

const shortFirst = (words: string[]) => words.sort((a, b) => a.length - b.length)

/** Five Easy stage 1 words, always including SOS at a random position. */
export function pickChallengeWords(count = 5, rand: () => number = Math.random): string[] {
  const pool = shuffle(EASY_POOLS[1]!.filter((w) => w !== 'SOS'), rand)
  // Short words first so the challenge ramps up.
  const picked = shortFirst(pool.slice(0, count - 1))
  picked.splice(Math.floor(rand() * count), 0, 'SOS')
  return picked
}

/** Five words for an Easy stage, short first. Stage 1 keeps its SOS round. */
export function pickStageWords(stage: number, count = 5, rand: () => number = Math.random): string[] {
  if (stage <= 1 || !EASY_POOLS[stage]) return pickChallengeWords(count, rand)
  return shortFirst(shuffle(EASY_POOLS[stage], rand).slice(0, count))
}
