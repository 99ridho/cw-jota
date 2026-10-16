import { describe, expect, it } from 'vitest'
import { MAX_MULTIPLIER, multiplier, scoreWord, SPEED_BONUS_MAX, speedBonus } from './scoring'

describe('scoring', () => {
  it('speed bonus stays within 0..max', () => {
    expect(speedBonus(0)).toBe(SPEED_BONUS_MAX)
    expect(speedBonus(1000)).toBe(0)
    expect(speedBonus(-5)).toBe(SPEED_BONUS_MAX)
  })

  it('streak multiplier caps at 2x', () => {
    expect(multiplier(0)).toBe(1)
    expect(multiplier(2)).toBe(1.5)
    expect(multiplier(99)).toBe(MAX_MULTIPLIER)
  })

  it('applies replay penalty and never goes negative', () => {
    const a = scoreWord('SOS', 'SOS', 0, 100, 0)
    const b = scoreWord('SOS', 'SOS', 2, 100, 0)
    expect(a.points - b.points).toBe(20)
    expect(scoreWord('SOS', 'TTT', 50, 100, 0).points).toBe(0)
  })

  it('scores partial answers per correct letter without bonus or multiplier', () => {
    expect(scoreWord('TEAM', 'TEAN', 0, 0, 4).points).toBe(300)
  })

  it('multiplies perfect words by the streak', () => {
    expect(scoreWord('SEA', 'SEA', 0, 100, 4).points).toBe(600)
  })
})
