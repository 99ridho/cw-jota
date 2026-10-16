import { describe, expect, it } from 'vitest'
import { DRILL_LENGTH, learnedThrough, makeDrill, optionCount } from './drill'

describe('drill', () => {
  it('has 6 questions with 2/3/4 options from learned chars', () => {
    for (const g of [1, 2, 3]) {
      const qs = makeDrill(g)
      expect(qs).toHaveLength(DRILL_LENGTH)
      for (const q of qs) {
        expect(q.options).toHaveLength(optionCount(g))
        expect(q.options).toContain(q.target)
        expect(new Set(q.options).size).toBe(q.options.length)
        for (const o of q.options) expect(learnedThrough(g)).toContain(o)
      }
    }
  })
})
