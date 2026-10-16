import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadPersisted, NO_BESTS, savePersisted, STORAGE_KEY } from './storage'

const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

afterEach(() => vi.unstubAllGlobals())

describe('storage', () => {
  it('round-trips data', () => {
    vi.stubGlobal('localStorage', memory())
    savePersisted({ v: 3, lang: 'id', bests: { ...NO_BESTS, easy2: 900, medium: 120 }, badges: ['sos_master'] })
    expect(loadPersisted()).toMatchObject({ lang: 'id', bests: { ...NO_BESTS, easy2: 900, medium: 120 } })
  })

  it('moves a v1 best score to Easy stage 1', () => {
    const s = memory()
    vi.stubGlobal('localStorage', s)
    s.setItem(STORAGE_KEY, JSON.stringify({ v: 1, lang: 'en', bestScore: 640, badges: ['first_signal'] }))
    const got = loadPersisted()
    expect(got).toMatchObject({ v: 3, lang: 'en', bests: { ...NO_BESTS, easy1: 640 }, badges: ['first_signal'] })
    expect(got).not.toHaveProperty('bestScore')
  })

  it('moves a v2 Easy best to Easy stage 1', () => {
    const s = memory()
    vi.stubGlobal('localStorage', s)
    s.setItem(STORAGE_KEY, JSON.stringify({ v: 2, lang: 'id', bests: { easy: 410, medium: 90, hard: 30 }, badges: [] }))
    const got = loadPersisted()
    expect(got).toEqual({ v: 3, lang: 'id', bests: { ...NO_BESTS, easy1: 410, medium: 90, hard: 30 }, badges: [] })
  })

  it('survives blocked localStorage', () => {
    const throwing = {
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError')
      },
      setItem: () => {
        throw new DOMException('blocked', 'SecurityError')
      },
    }
    vi.stubGlobal('localStorage', throwing)
    expect(() => savePersisted({ v: 3, lang: 'en', bests: NO_BESTS, badges: [] })).not.toThrow()
    expect(loadPersisted()).toBeNull()
  })

  it('discards unknown versions and bad JSON', () => {
    const s = memory()
    vi.stubGlobal('localStorage', s)
    s.setItem(STORAGE_KEY, JSON.stringify({ v: 4, bests: {} }))
    expect(loadPersisted()).toBeNull()
    s.setItem(STORAGE_KEY, '{nope')
    expect(loadPersisted()).toBeNull()
  })
})
