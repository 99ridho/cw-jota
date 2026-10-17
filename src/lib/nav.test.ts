import { describe, expect, it } from 'vitest'
import { parentPath } from './nav'

describe('parentPath', () => {
  it('walks up the Easy flow', () => {
    expect(parentPath('/learn/2/3', 'easy', 2)).toBe('/stage/2')
    expect(parentPath('/learn/3/recap', 'easy', 3)).toBe('/stage/3')
    expect(parentPath('/stage/1', 'easy', 1)).toBe('/stage')
    expect(parentPath('/stage', 'easy', 1)).toBe('/level')
    expect(parentPath('/challenge', 'easy', 4)).toBe('/stage/4')
    expect(parentPath('/finish', 'easy', 2)).toBe('/stage/2')
  })

  it('sends Medium and Hard back to the level picker', () => {
    expect(parentPath('/challenge', 'medium', 1)).toBe('/level')
    expect(parentPath('/finish', 'hard', 1)).toBe('/level')
  })

  it('goes home from the first screens', () => {
    expect(parentPath('/level', null, 1)).toBe('/')
    expect(parentPath('/hook', null, 1)).toBe('/')
  })
})
