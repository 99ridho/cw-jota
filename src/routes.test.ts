import { describe, expect, it } from 'vitest'
import { generatePath } from 'react-router'
import { parentOf } from './lib/flow'
import { routes } from './routes'

describe('routes', () => {
  it('gives every screen but Welcome a parent in lib/flow.ts', () => {
    const paths = routes[0]!.children!.map((r) => r.path!).filter((p) => p !== '/' && p !== '*')
    for (const p of paths) expect(parentOf(generatePath(p, { stage: '2', pack: '1' })), p).toBeDefined()
  })
})
