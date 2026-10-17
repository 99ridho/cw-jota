import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/store/session'
import { flowStep, parentOf } from './flow'

describe('parentOf', () => {
  it('names the screen one level up', () => {
    expect(parentOf('/hook')).toBe('/')
    expect(parentOf('/stage/2')).toBe('/stage')
    expect(parentOf('/learn/2/recap')).toBe('/stage/2')
    expect(parentOf('/learn/2/3')).toBe('/stage/2')
    expect(parentOf('/')).toBeUndefined()
  })

  it('puts Challenge under the stage on Easy and under the level picker otherwise', () => {
    useSession.setState({ level: 'easy', stage: 3 })
    expect(parentOf('/challenge')).toBe('/stage/3')
    useSession.setState({ level: 'hard' })
    expect(parentOf('/finish')).toBe('/level')
  })
})

describe('flowStep', () => {
  beforeEach(() => useSession.setState({ level: 'easy', stage: 1 }))

  it('pushes when going one level deeper', () => {
    expect(flowStep(['/', '/level'], 1, '/level', '/stage')).toEqual({ push: true })
    expect(flowStep(['/', '/level', '/stage', '/stage/1'], 3, '/stage/1', '/learn/1/1')).toEqual({ push: true })
  })

  it('swaps the top for a sibling', () => {
    const stack = ['/', '/level', '/stage', '/stage/1', '/learn/1/1']
    expect(flowStep(stack, 4, '/learn/1/1', '/learn/1/2')).toEqual({ replace: true })
    expect(flowStep(stack, 4, '/learn/1/3', '/challenge')).toEqual({ replace: true })
    expect(flowStep(['/', '/hook'], 1, '/hook', '/level')).toEqual({ replace: true })
    expect(flowStep(['/', '/level', '/stage', '/stage/1', '/challenge'], 4, '/challenge', '/finish')).toEqual({ replace: true })
  })

  it('pops back to an earlier parent before pushing', () => {
    const stack = ['/', '/level', '/stage', '/stage/1', '/finish']
    expect(flowStep(stack, 4, '/finish', '/stage/2')).toEqual({ pop: 2 })
    expect(flowStep(stack, 4, '/finish', '/level')).toEqual({ pop: 4 })
  })

  it('ignores stale entries above the current one', () => {
    expect(flowStep(['/', '/level', '/stage', '/stage/1', '/finish'], 1, '/hook', '/stage/2')).toEqual({ push: true })
  })

  it('pushes when the parent is not in the stack', () => {
    expect(flowStep([], 0, '/finish', '/stage/2')).toEqual({ push: true })
  })
})
