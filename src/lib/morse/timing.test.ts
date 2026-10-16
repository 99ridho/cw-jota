import { describe, expect, it } from 'vitest'
import { buildSchedule, ditSec, farnsworthUnit, gaps } from './timing'

describe('timing', () => {
  it('dit is 1.2/c and dah is 3 dits', () => {
    expect(ditSec(18)).toBeCloseTo(0.0667, 4)
    const g = gaps({ c: 18, s: 8 })
    expect(g.dah).toBeCloseTo(3 * g.dit)
    expect(g.intra).toBeCloseTo(g.dit)
  })

  it('farnsworth unit equals one dit when s == c', () => {
    for (const c of [5, 12, 18, 20]) expect(farnsworthUnit(c, c)).toBeCloseTo(ditSec(c), 10)
  })

  it('farnsworth stretches gaps when s < c', () => {
    const g = gaps({ c: 18, s: 8 })
    expect(farnsworthUnit(18, 8)).toBeGreaterThan(ditSec(18))
    expect(g.word / g.char).toBeCloseTo(7 / 3)
  })

  it('schedules elements and gaps for a word', () => {
    const p = { c: 20, s: 20 }
    const g = gaps(p)
    const { events, duration } = buildSchedule('ET', p)
    expect(events).toHaveLength(2)
    expect(events[1]!.t).toBeCloseTo(g.dit + g.char)
    expect(duration).toBeCloseTo(g.dit + g.char + g.dah)
  })

  it('uses a word gap for spaces', () => {
    const p = { c: 20, s: 20 }
    const g = gaps(p)
    const { events } = buildSchedule('E E', p)
    expect(events[1]!.t).toBeCloseTo(g.dit + g.word)
  })
})
