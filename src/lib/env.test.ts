import { describe, expect, it } from 'vitest'
import { bool, num, speed, str } from './env'

describe('env parsing', () => {
  it('treats blank strings as unset', () => {
    expect(str('', 'x')).toBe('x')
    expect(str('  ', 'x')).toBe('x')
    expect(str(undefined, 'x')).toBe('x')
    expect(str(' YB1 ', 'x')).toBe('YB1')
  })

  it('falls back on bad numbers', () => {
    expect(num('', 650)).toBe(650)
    expect(num('abc', 650)).toBe(650)
    expect(num('0', 650)).toBe(650)
    expect(num('700', 650)).toBe(700)
  })

  it('reads on/off switches', () => {
    expect(bool('false', true)).toBe(false)
    expect(bool(' OFF ', true)).toBe(false)
    expect(bool('0', true)).toBe(false)
    expect(bool('yes', false)).toBe(true)
    expect(bool('', true)).toBe(true)
    expect(bool('maybe', false)).toBe(false)
  })

  it('parses c/s speeds', () => {
    expect(speed('20/10', { c: 18, s: 8 })).toEqual({ c: 20, s: 10 })
    expect(speed(' 18 / 8 ', { c: 1, s: 1 })).toEqual({ c: 18, s: 8 })
    expect(speed('18', { c: 18, s: 8 })).toEqual({ c: 18, s: 8 })
    expect(speed('10/20', { c: 18, s: 8 })).toEqual({ c: 10, s: 10 })
  })
})
