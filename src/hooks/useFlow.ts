import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { flowStep, parentOf } from '@/lib/flow'

// Pathname at each history index this tab has visited. react-router keeps the
// index in history.state.idx; the record starts empty after a reload.
const entries: string[] = []

const historyIdx = (): number => window.history.state?.idx ?? 0

/** Records where each history entry points. Mount once, at the root. */
export function useTrackHistory() {
  const { pathname } = useLocation()
  useEffect(() => {
    entries[historyIdx()] = pathname
  }, [pathname])
}

/** Forward navigation that keeps history a stack of the flow (`flowStep`). */
export function useFlowNavigate() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (to: string) => {
    const step = flowStep(entries, historyIdx(), pathname, to)
    if ('pop' in step) {
      // The push has to wait for the pop to land, or the pop would remove it.
      window.addEventListener('popstate', () => navigate(to), { once: true })
      navigate(-step.pop)
    } else navigate(to, { replace: 'replace' in step })
  }
}

/** Header Back: the same pop as the browser's back and the phone's back gesture. */
export function useBack() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return () => {
    if (historyIdx() > 0) navigate(-1)
    else navigate(parentOf(pathname) ?? '/', { replace: true })
  }
}
