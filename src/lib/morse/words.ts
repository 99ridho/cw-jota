export const WORDS = [
  'SOS', 'SEA', 'NOTE', 'STONE', 'MEAT', 'TEAM', 'NAME', 'MOON', 'ONSET', 'MEAN',
  'MAT', 'NET', 'TEN', 'SET', 'EAT', 'SEAT', 'MOST', 'NEST', 'TOAST', 'MOAN',
  'SON', 'TONE', 'MANE', 'STEAM', 'MASON', 'NOON', 'OATS', 'TOES', 'MESS', 'TOTEM',
]

/** Five words, always including SOS at a random position. */
export function pickChallengeWords(count = 5, rand: () => number = Math.random): string[] {
  const pool = WORDS.filter((w) => w !== 'SOS')
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  const picked = pool.slice(0, count - 1)
  // Short words first so the challenge ramps up.
  picked.sort((a, b) => a.length - b.length)
  picked.splice(Math.floor(rand() * count), 0, 'SOS')
  return picked
}
