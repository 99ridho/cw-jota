export type MorseChar =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
export type Element = '.' | '-'

/** Easy stages, each split into packs. Stage 1 is the original seven letters. */
export const STAGES: MorseChar[][][] = [
  [['E', 'T'], ['A', 'N'], ['S', 'O', 'M']],
  [['I', 'R'], ['D', 'U'], ['K', 'G', 'W']],
  [['H', 'V'], ['F', 'L'], ['P', 'B', 'C']],
  [['J', 'Q'], ['X', 'Y', 'Z']],
]

export const MORSE_CHARS: MorseChar[] = STAGES[0]!.flat()

/** Letters introduced by `stage` (1-based). */
export function stageNew(stage: number): MorseChar[] {
  return STAGES[stage - 1]?.flat() ?? []
}

/** Letters taught in stages before `stage`. */
export function priorChars(stage: number): MorseChar[] {
  return STAGES.slice(0, stage - 1).flat(2)
}

/** Every letter known once `stage` is finished. */
export function stageChars(stage: number): MorseChar[] {
  return STAGES.slice(0, stage).flat(2)
}

// Digits are only played on Hard and on the name card; they are never taught.
export const MORSE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
  6: '-....', 7: '--...', 8: '---..', 9: '----.',
}

export function encode(text: string): string[] {
  return [...text.toUpperCase()].map((c) => MORSE_TABLE[c] ?? '')
}

export function decode(pattern: string): string | undefined {
  return Object.keys(MORSE_TABLE).find((k) => MORSE_TABLE[k] === pattern)
}

/** "di-dah" style rhythm word; the last dit is "dit" when it ends the character. */
export function rhythm(pattern: string): string {
  return [...pattern]
    .map((el, i) => (el === '-' ? 'dah' : i === pattern.length - 1 ? 'dit' : 'di'))
    .join('-')
}

export function prettyPattern(pattern: string): string {
  return [...pattern].map((el) => (el === '.' ? '·' : '–')).join(' ')
}
