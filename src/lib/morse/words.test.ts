import { describe, expect, it } from 'vitest'
import { MORSE_CHARS } from './table'
import { pickChallengeWords, WORDS } from './words'

describe('words', () => {
  it('only uses the 7 taught characters', () => {
    for (const w of WORDS) for (const c of w) expect(MORSE_CHARS).toContain(c)
  })

  it('contains SOS', () => {
    expect(WORDS).toContain('SOS')
  })

  it('always picks SOS among 5 distinct words', () => {
    for (let i = 0; i < 50; i++) {
      const picked = pickChallengeWords()
      expect(picked).toHaveLength(5)
      expect(picked).toContain('SOS')
      expect(new Set(picked).size).toBe(5)
    }
  })
})
