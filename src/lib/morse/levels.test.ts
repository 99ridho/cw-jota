import { describe, expect, it } from 'vitest'
import { callsign, HARD_CODES, levelChars, LEVELS, MEDIUM_WORDS, pickWords } from './levels'
import { MORSE_TABLE } from './table'

describe('levels', () => {
  it('every level character can be played', () => {
    for (const l of LEVELS) for (const c of levelChars(l)) expect(MORSE_TABLE[c]).toBeDefined()
    expect(levelChars('hard')).toHaveLength(36)
  })

  it('curated lists only use their level characters', () => {
    for (const w of MEDIUM_WORDS) for (const c of w) expect(levelChars('medium')).toContain(c)
    for (const w of HARD_CODES) for (const c of w) expect(levelChars('hard')).toContain(c)
  })

  it('makes callsign-shaped strings of at most 6 characters', () => {
    for (let i = 0; i < 300; i++) {
      const c = callsign()
      expect(c).toMatch(/^[A-Z0-9]{1,2}\d[A-Z]{1,3}$/)
      expect(c.length).toBeLessThanOrEqual(6)
    }
  })

  it('picks 5 distinct items for every level', () => {
    for (const l of LEVELS) {
      for (let i = 0; i < 50; i++) {
        const w = pickWords(l)
        expect(w).toHaveLength(5)
        expect(new Set(w).size).toBe(5)
        for (const word of w) for (const c of word) expect(levelChars(l)).toContain(c)
      }
    }
  })

  it('keeps SOS on easy', () => {
    expect(pickWords('easy')).toContain('SOS')
  })
})
