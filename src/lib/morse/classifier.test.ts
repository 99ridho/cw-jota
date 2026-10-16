import { describe, expect, it } from 'vitest'
import { commitDelay, createClassifier, matchesTarget, pattern, pushPress, shouldCommitNow, UNIT_MAX_MS, UNIT_MIN_MS } from './classifier'

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
    expect(commitDelay(createClassifier(100))).toBe(800)
    expect(commitDelay(createClassifier(200))).toBe(1000)
  })

  it('commits early once the target length is reached', () => {
    expect(shouldCommitNow(run([100]), '.-')).toBe(false)
    expect(shouldCommitNow(run([100, 450]), '.-')).toBe(true)
  })

  it('accepts borderline presses as either element', () => {
    // 250 ms at a 150 ms unit sits between 1.4u and 2.6u.
    expect(matchesTarget(run([250]), '.')).toBe(true)
    expect(matchesTarget(run([250]), '-')).toBe(true)
    expect(matchesTarget(run([120, 250]), '.-')).toBe(true)
  })

  it('rejects clearly wrong elements and wrong lengths', () => {
    expect(matchesTarget(run([450]), '.')).toBe(false)
    expect(matchesTarget(run([100]), '-')).toBe(false)
    expect(matchesTarget(run([100]), '.-')).toBe(false)
    expect(matchesTarget(run([100, 450, 100]), '.-')).toBe(false)
  })

  it('does not adapt the unit on borderline presses', () => {
    expect(run([250]).unit).toBe(150)
  })
})
