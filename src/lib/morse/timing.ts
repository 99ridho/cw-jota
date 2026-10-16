import { MORSE_TABLE } from './table'

export interface SpeedPreset {
  /** Character speed, WPM. */
  c: number
  /** Overall (Farnsworth) speed, WPM. */
  s: number
}

export const ditSec = (c: number) => 1.2 / c

/** Farnsworth delay unit in seconds. Equals one dit when s == c. */
export function farnsworthUnit(c: number, s: number): number {
  if (s >= c) return ditSec(c)
  return (60 * c - 37.2 * s) / (19 * c * s)
}

export function gaps(preset: SpeedPreset) {
  const dit = ditSec(preset.c)
  const ta = farnsworthUnit(preset.c, preset.s)
  return { dit, dah: 3 * dit, intra: dit, char: 3 * ta, word: 7 * ta }
}

export interface ToneEvent {
  /** Seconds from schedule start. */
  t: number
  dur: number
  charIndex: number
  elIndex: number
}

export interface Schedule {
  events: ToneEvent[]
  /** Total length in seconds. */
  duration: number
}

export function buildSchedule(text: string, preset: SpeedPreset): Schedule {
  const g = gaps(preset)
  const events: ToneEvent[] = []
  let t = 0
  const chars = [...text.toUpperCase()]
  chars.forEach((ch, charIndex) => {
    if (ch === ' ') {
      // A word gap replaces the char gap already added after the previous char.
      t += g.word - g.char
      return
    }
    const pattern = MORSE_TABLE[ch]
    if (!pattern) return
    ;[...pattern].forEach((el, elIndex) => {
      const dur = el === '.' ? g.dit : g.dah
      events.push({ t, dur, charIndex, elIndex })
      t += dur
      if (elIndex < pattern.length - 1) t += g.intra
    })
    if (charIndex < chars.length - 1) t += g.char
  })
  return { events, duration: t }
}
