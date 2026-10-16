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
    savePersisted({ v: 1, lang: 'id', bestScore: 900, badges: ['sos_master'] })
    expect(loadPersisted()).toMatchObject({ lang: 'id', bestScore: 900 })
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
    expect(() => savePersisted({ v: 1, lang: 'en', bestScore: 0, badges: [] })).not.toThrow()
    expect(loadPersisted()).toBeNull()
  })

  it('discards unknown versions and bad JSON', () => {
    const s = memory()
    vi.stubGlobal('localStorage', s)
    s.setItem(STORAGE_KEY, JSON.stringify({ v: 2, bestScore: 1 }))
    expect(loadPersisted()).toBeNull()
    s.setItem(STORAGE_KEY, '{nope')
    expect(loadPersisted()).toBeNull()
  })
})
