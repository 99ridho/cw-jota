import { matchPath, type Params } from 'react-router'
import { useSession } from '@/store/session'

// Challenge and Finish belong to the Easy stage being played, or to the level picker.
const levelParent = () => {
  const { level, stage } = useSession.getState()
  return level === 'easy' ? `/stage/${stage}` : '/level'
}

/** The screen one level up from each route (ADR-020). Welcome has none. */
const PARENTS: [pattern: string, parent: (params: Params) => string][] = [
  ['/hook', () => '/'],
  ['/level', () => '/'],
  ['/stage', () => '/level'],
  ['/stage/:stage', () => '/stage'],
  ['/learn/:stage/recap', ({ stage }) => `/stage/${stage}`],
  ['/learn/:stage/:pack', ({ stage }) => `/stage/${stage}`],
  ['/challenge', levelParent],
  ['/finish', levelParent],
]

export function parentOf(path: string): string | undefined {
  for (const [pattern, parent] of PARENTS) {
    const m = matchPath(pattern, path)
    if (m) return parent(m.params)
  }
}

export type FlowStep = { push: true } | { replace: true } | { pop: number }

/**
 * How a forward move from `cur` to `to` changes the history stack (ADR-022):
 * deeper pushes, a sibling swaps the top, and a move under an earlier screen
 * pops back to it first (the caller then pushes `to`).
 */
export function flowStep(entries: readonly string[], idx: number, cur: string, to: string): FlowStep {
  const parent = parentOf(to)
  if (parent === undefined || parent === cur) return { push: true }
  if (parent === parentOf(cur)) return { replace: true }
  const at = idx > 0 ? entries.lastIndexOf(parent, idx - 1) : -1
  return at >= 0 ? { pop: idx - at } : { push: true }
}
