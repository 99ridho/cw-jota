import { useEffect } from 'react'
import { useLocation, useMatches, useNavigate } from 'react-router'
import type { RouteHandle } from '@/routes'

// Pathname at each history index this tab has visited. react-router keeps the
// index in history.state.idx; the record starts empty after a reload.
const entries: string[] = []

const historyIdx = (): number => window.history.state?.idx ?? 0

/** Pop when the parent is the entry right behind, else swap the current entry for it. */
export function backStep(entries: readonly string[], idx: number, parent: string): { delta: -1 } | { to: string } {
  return idx > 0 && entries[idx - 1] === parent ? { delta: -1 } : { to: parent }
}

/** Records where each history entry points. Mount once, at the root. */
export function useTrackHistory() {
  const { pathname } = useLocation()
  useEffect(() => {
    entries[historyIdx()] = pathname
  }, [pathname])
}

/** Header Back: goes to the route's parent (routes.tsx) without growing history. */
export function useBack() {
  const navigate = useNavigate()
  const match = useMatches().at(-1)
  return () => {
    const parent = (match?.handle as RouteHandle | undefined)?.parent(match!.params) ?? '/'
    const step = backStep(entries, historyIdx(), parent)
    if ('delta' in step) navigate(-1)
    else navigate(step.to, { replace: true })
  }
}
