export type MorseChar = 'E' | 'T' | 'A' | 'N' | 'S' | 'O' | 'M'
export type Element = '.' | '-'

export const MORSE_CHARS: MorseChar[] = ['E', 'T', 'A', 'N', 'S', 'O', 'M']

// Full table exists only to render the name-in-Morse card.
// Only the 7 MorseChars above are ever played, taught, or scored.
export const MORSE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
  6: '-....', 7: '--...', 8: '---..', 9: '----.',
}

export const GROUPS: MorseChar[][] = [['E', 'T'], ['A', 'N'], ['S', 'O', 'M']]

export function isMorseChar(c: string): c is MorseChar {
  return (MORSE_CHARS as string[]).includes(c)
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
