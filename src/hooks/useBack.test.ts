import { describe, expect, it } from 'vitest'
import { backStep } from './useBack'

describe('backStep', () => {
  it('pops when the parent is right behind', () => {
    expect(backStep(['/', '/level', '/stage', '/stage/2', '/learn/2/3'], 4, '/stage/2')).toEqual({ delta: -1 })
  })

  it('replaces when something else is behind, like the previous pack', () => {
    expect(backStep(['/', '/stage/1', '/learn/1/1', '/learn/1/2'], 3, '/stage/1')).toEqual({ to: '/stage/1' })
  })

  it('replaces when the tab has no history', () => {
    expect(backStep([], 0, '/')).toEqual({ to: '/' })
  })
})
