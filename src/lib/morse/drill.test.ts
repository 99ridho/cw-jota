import { describe, expect, it } from 'vitest'
import { DRILL_LENGTH, learnedThrough, makeDrill, optionCount, packChars, sendTargets } from './drill'
import { STAGES } from './table'

const everyPack = STAGES.flatMap((packs, s) => packs.map((_, p) => [s + 1, p + 1] as const))

describe('drill', () => {
  it('has 6 questions with 2/3/4 options from learned chars, in every pack', () => {
    for (const [s, p] of everyPack) {
      const qs = makeDrill(s, p)
      expect(qs).toHaveLength(DRILL_LENGTH)
      for (const q of qs) {
        expect(packChars(s, p)).toContain(q.target)
        expect(q.options).toHaveLength(optionCount(p))
        expect(q.options).toContain(q.target)
        expect(new Set(q.options).size).toBe(q.options.length)
        for (const o of q.options) expect(learnedThrough(s, p)).toContain(o)
      }
    }
  })

  it('counts earlier stages as learned', () => {
    expect(learnedThrough(1, 2)).toEqual(['E', 'T', 'A', 'N'])
    expect(learnedThrough(2, 1)).toEqual(['E', 'T', 'A', 'N', 'S', 'O', 'M', 'I', 'R'])
  })

  it('sends each pack letter twice', () => {
    expect(sendTargets(4, 2)).toEqual(['X', 'Y', 'Z', 'X', 'Y', 'Z'])
  })
})
