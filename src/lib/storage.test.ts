import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadPersisted, savePersisted, STORAGE_KEY } from './storage'

const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

afterEach(() => vi.unstubAllGlobals())

describe('storage', () => {
  it('round-trips data', () => {
    vi.stubGlobal('localStorage', memory())
    savePersisted({ v: 2, lang: 'id', bests: { easy: 900, medium: 120, hard: 0 }, badges: ['sos_master'] })
    expect(loadPersisted()).toMatchObject({ lang: 'id', bests: { easy: 900, medium: 120, hard: 0 } })
  })

  it('moves a v1 best score to Easy', () => {
    const s = memory()
    vi.stubGlobal('localStorage', s)
    s.setItem(STORAGE_KEY, JSON.stringify({ v: 1, lang: 'en', bestScore: 640, badges: ['first_signal'] }))
    const got = loadPersisted()
    expect(got).toMatchObject({ v: 2, lang: 'en', bests: { easy: 640, medium: 0, hard: 0 }, badges: ['first_signal'] })
    expect(got).not.toHaveProperty('bestScore')
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
    expect(() => savePersisted({ v: 2, lang: 'en', bests: { easy: 0, medium: 0, hard: 0 }, badges: [] })).not.toThrow()
    expect(loadPersisted()).toBeNull()
  })

  it('discards unknown versions and bad JSON', () => {
    const s = memory()
    vi.stubGlobal('localStorage', s)
    s.setItem(STORAGE_KEY, JSON.stringify({ v: 3, bests: {} }))
    expect(loadPersisted()).toBeNull()
    s.setItem(STORAGE_KEY, '{nope')
    expect(loadPersisted()).toBeNull()
  })
})
