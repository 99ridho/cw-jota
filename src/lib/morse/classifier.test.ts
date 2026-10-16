import { describe, expect, it } from 'vitest'
import { commitDelay, createClassifier, pattern, pushPress, shouldCommitNow, UNIT_MAX_MS, UNIT_MIN_MS } from './classifier'

const run = (presses: number[], unit?: number) => presses.reduce(pushPress, createClassifier(unit))

describe('classifier', () => {
  it('classifies clean dits and dahs', () => {
    expect(pattern(run([150, 450]))).toBe('.-')
  })

  it('handles sloppy beginner timing', () => {
    expect(pattern(run([110, 520, 180, 90]))).toBe('.-..')
  })

  it('adapts to a slow sender', () => {
    expect(pattern(run([260, 280, 250, 900, 950]))).toBe('...--')
  })

  it('clamps the unit', () => {
    expect(run([5, 5, 5, 5, 5, 5, 5, 5]).unit).toBe(UNIT_MIN_MS)
    expect(run([5000, 5000, 5000, 5000, 5000]).unit).toBeLessThanOrEqual(UNIT_MAX_MS)
  })

  it('commits after 5 elements or an idle gap', () => {
    expect(shouldCommitNow(run([100, 100, 100, 100]))).toBe(false)
    expect(shouldCommitNow(run([100, 100, 100, 100, 100]))).toBe(true)
    expect(commitDelay(createClassifier(100))).toBe(500)
    expect(commitDelay(createClassifier(200))).toBe(800)
  })
})
