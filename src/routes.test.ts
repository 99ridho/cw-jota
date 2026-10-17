import { describe, expect, it } from 'vitest'
import { matchRoutes } from 'react-router'
import { routes, type RouteHandle } from './routes'
import { useSession } from './store/session'

const back = (path: string) => {
  const m = matchRoutes(routes, path)!.at(-1)!
  return (m.route.handle as RouteHandle | undefined)?.parent(m.params)
}

describe('Back parents', () => {
  it('walks up the Easy flow', () => {
    expect(back('/learn/2/3')).toBe('/stage/2')
    expect(back('/learn/3/recap')).toBe('/stage/3')
    expect(back('/stage/1')).toBe('/stage')
    expect(back('/stage')).toBe('/level')
    expect(back('/level')).toBe('/')
    expect(back('/hook')).toBe('/')
  })

  it('sends Challenge and Finish to the stage on Easy, else the level picker', () => {
    useSession.setState({ level: 'easy', stage: 4 })
    expect(back('/challenge')).toBe('/stage/4')
    expect(back('/finish')).toBe('/stage/4')
    useSession.setState({ level: 'medium' })
    expect(back('/challenge')).toBe('/level')
  })

  it('has no parent on Welcome', () => {
    expect(back('/')).toBeUndefined()
  })
})
