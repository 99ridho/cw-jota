import { describe, expect, it } from 'vitest'
import { callsign, EASY_STAGES, stageStart, HARD_CODES, levelChars, LEVELS, pickWords } from './levels'
import { MEDIUM_POOL } from './wordPools'
import { MORSE_TABLE } from './table'

describe('levels', () => {
  it('every level character can be played', () => {
    for (const l of LEVELS) for (const c of levelChars(l)) expect(MORSE_TABLE[c]).toBeDefined()
    expect(levelChars('hard')).toHaveLength(36)
  })

  it('word lists only use their level characters', () => {
    for (const w of MEDIUM_POOL) for (const c of w) expect(levelChars('medium')).toContain(c)
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

  it('mixes a code, a word, and three callsigns on hard', () => {
    for (let i = 0; i < 50; i++) {
      const [code, word, ...calls] = pickWords('hard')
      expect(HARD_CODES).toContain(code)
      expect(MEDIUM_POOL).toContain(word)
      expect(calls).toHaveLength(3)
      for (const c of calls) expect(c).toMatch(/^[A-Z0-9]{1,2}\d[A-Z]{1,3}$/)
    }
  })

  it('routes a stage pick to warm-up, the next pack, or the challenge', () => {
    expect(stageStart(1, {})).toBe('/learn/1/1')
    expect(stageStart(3, {})).toBe('/learn/3/recap')
    expect(stageStart(2, { 1: 3 })).toBe('/learn/2/1')
    expect(stageStart(2, { 1: 3, 2: 1 })).toBe('/learn/2/2')
    expect(stageStart(4, { 4: 2 })).toBe('/challenge')
  })

  it('keeps SOS on easy stage 1', () => {
    expect(pickWords('easy', 1)).toContain('SOS')
  })

  it('easy stages grow to the full alphabet, and words stay inside the stage', () => {
    expect(levelChars('easy', 1)).toHaveLength(7)
    expect([...levelChars('easy', EASY_STAGES)].sort()).toEqual([...levelChars('medium')].sort())
    for (let s = 1; s <= EASY_STAGES; s++) {
      for (const word of pickWords('easy', s)) for (const c of word) expect(levelChars('easy', s)).toContain(c)
    }
  })
})
