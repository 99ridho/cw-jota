import { describe, expect, it } from 'vitest'
import { MORSE_CHARS, stageChars, stageNew, STAGES } from './table'
import { EASY_POOLS, MEDIUM_POOL } from './wordPools'
import { pickChallengeWords, pickStageWords } from './words'

describe('words', () => {
  it('stage 1 only uses the 7 taught characters and contains SOS', () => {
    for (const w of EASY_POOLS[1]!) for (const c of w) expect(MORSE_CHARS, w).toContain(c)
    expect(EASY_POOLS[1]).toContain('SOS')
  })

  it('pools are large, distinct, and 3 to 6 letters', () => {
    expect(EASY_POOLS[1]!.length).toBeGreaterThanOrEqual(40)
    for (let stage = 2; stage <= STAGES.length; stage++) expect(EASY_POOLS[stage]!.length).toBeGreaterThanOrEqual(200)
    expect(MEDIUM_POOL.length).toBeGreaterThanOrEqual(1000)
    for (const pool of [...Object.values(EASY_POOLS), MEDIUM_POOL]) {
      expect(new Set(pool).size).toBe(pool.length)
      for (const w of pool) expect(w).toMatch(/^[A-Z]{3,6}$/)
    }
  })

  it('always picks SOS among 5 distinct words', () => {
    for (let i = 0; i < 50; i++) {
      const picked = pickChallengeWords()
      expect(picked).toHaveLength(5)
      expect(picked).toContain('SOS')
      expect(new Set(picked).size).toBe(5)
    }
  })

  it('stage words use only letters taught so far, and at least one new one', () => {
    for (let stage = 2; stage <= STAGES.length; stage++) {
      const words = EASY_POOLS[stage]!
      for (const w of words) {
        for (const c of w) expect(stageChars(stage), w).toContain(c)
        expect([...w].some((c) => (stageNew(stage) as string[]).includes(c)), w).toBe(true)
      }
    }
  })

  it('picks 5 distinct stage words, short first', () => {
    for (let stage = 1; stage <= STAGES.length; stage++) {
      for (let i = 0; i < 30; i++) {
        const picked = pickStageWords(stage)
        expect(picked).toHaveLength(5)
        expect(new Set(picked).size).toBe(5)
        if (stage > 1) expect(picked.map((w) => w.length)).toEqual([...picked.map((w) => w.length)].sort((a, b) => a - b))
      }
    }
  })
})
