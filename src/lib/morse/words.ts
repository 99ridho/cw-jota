import { shuffle } from './drill'

export const WORDS = [
  'SOS', 'SEA', 'NOTE', 'STONE', 'MEAT', 'TEAM', 'NAME', 'MOON', 'ONSET', 'MEAN',
  'MAT', 'NET', 'TEN', 'SET', 'EAT', 'SEAT', 'MOST', 'NEST', 'TOAST', 'MOAN',
  'SON', 'TONE', 'MANE', 'STEAM', 'MASON', 'NOON', 'OATS', 'TOES', 'MESS', 'TOTEM',
]

/** Five words, always including SOS at a random position. */
export function pickChallengeWords(count = 5, rand: () => number = Math.random): string[] {
  const pool = shuffle(WORDS.filter((w) => w !== 'SOS'), rand)
  const picked = pool.slice(0, count - 1)
  // Short words first so the challenge ramps up.
  picked.sort((a, b) => a.length - b.length)
  picked.splice(Math.floor(rand() * count), 0, 'SOS')
  return picked
}

/**
 * Words for Easy stages 2 to 4. Each uses only letters taught through its stage
 * and at least one letter that stage introduces.
 */
export const STAGE_WORDS: Record<number, string[]> = {
  2: [
    'RADIO', 'KING', 'WIND', 'DRUM', 'GRID', 'TIGER', 'WORD', 'DOG', 'RING', 'SKI',
    'DUST', 'GUARD', 'MOUSE', 'WAGON', 'STORM', 'RAIN', 'SNOW', 'WATER', 'GAME', 'KITE',
    'RIDE', 'TRAIN', 'DREAM', 'GOAT', 'SUN',
  ],
  3: [
    'FISH', 'HELP', 'CLUB', 'PLANE', 'BLUE', 'VAN', 'CAMP', 'FLAG', 'HIKE', 'TORCH',
    'BEACH', 'CLIMB', 'HILL', 'FIRE', 'LAMP', 'BOAT', 'CAVE', 'MAP', 'SHIP', 'BELL',
    'PATROL', 'FOREST', 'VOICE', 'PHONE', 'LIGHT',
  ],
  4: [
    'JOTA', 'QUIZ', 'BOX', 'FOX', 'ZOO', 'JAM', 'SKY', 'KEY', 'YES', 'JUNGLE',
    'PIZZA', 'ZEBRA', 'JUMP', 'QUEEN', 'SIX', 'TAXI', 'YOUTH', 'JOY', 'ZIP', 'EXIT',
    'JACKET', 'QUICK', 'ZONE', 'YELLOW', 'JAZZ',
  ],
}

/** Five words for an Easy stage. Stage 1 keeps its SOS round. */
export function pickStageWords(stage: number, count = 5, rand: () => number = Math.random): string[] {
  const pool = STAGE_WORDS[stage]
  if (!pool) return pickChallengeWords(count, rand)
  return shuffle(pool, rand)
    .slice(0, count)
    .sort((a, b) => a.length - b.length)
}
