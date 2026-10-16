import { describe, expect, it } from 'vitest'
import { MORSE_CHARS, stageChars, stageNew, STAGES } from './table'
import { pickChallengeWords, pickStageWords, STAGE_WORDS, WORDS } from './words'

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

  it('stage words use only letters taught so far, and at least one new one', () => {
    for (let stage = 2; stage <= STAGES.length; stage++) {
      const words = STAGE_WORDS[stage]!
      expect(new Set(words).size).toBe(words.length)
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
