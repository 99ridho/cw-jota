import { useCallback, useEffect, useRef, useState } from 'react'
import { sidetoneOff, sidetoneOn } from '@/lib/audio/engine'
import {
  commitDelay,
  createClassifier,
  elementMatches,
  matchesTarget,
  pattern,
  pushPress,
  shouldCommitNow,
  type ClassifierState,
} from '@/lib/morse/classifier'

export interface SendResult {
  pattern: string
  /** Matches `target` within the timing tolerance. False when there is no target. */
  ok: boolean
}

interface Options {
  onCommit: (result: SendResult) => void
  enabled?: boolean
  /** Known pattern to send. Commits as soon as that many elements are in. */
  target?: string
}

/** Turns presses into dits and dahs. Space works anywhere on the page while enabled. */
export function useSendInput({ onCommit, enabled = true, target }: Options) {
  const state = useRef<ClassifierState>(createClassifier())
  const downAt = useRef<number | null>(null)
  const pointerId = useRef<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const commitRef = useRef(onCommit)
  commitRef.current = onCommit
  const targetRef = useRef(target)
  targetRef.current = target
  const [buffer, setBuffer] = useState('')
  const [matched, setMatched] = useState<boolean[]>([])
  const [pressed, setPressed] = useState(false)

  const commit = useCallback(() => {
    clearTimeout(timer.current)
    const s = state.current
    const p = pattern(s)
    const t = targetRef.current
    state.current = { ...s, buffer: [], presses: [] }
    setBuffer('')
    setMatched([])
    if (p) commitRef.current({ pattern: p, ok: t !== undefined && matchesTarget(s, t) })
  }, [])

  const down = useCallback(() => {
    if (!enabled || downAt.current !== null) return
    clearTimeout(timer.current)
    downAt.current = performance.now()
    setPressed(true)
    sidetoneOn()
  }, [enabled])

  const up = useCallback(() => {
    if (downAt.current === null) return
    const d = performance.now() - downAt.current
    downAt.current = null
    setPressed(false)
    sidetoneOff()
    state.current = pushPress(state.current, d)
    setBuffer(pattern(state.current))
    if (targetRef.current) setMatched(elementMatches(state.current, targetRef.current))
    if (shouldCommitNow(state.current, targetRef.current)) commit()
    else timer.current = setTimeout(commit, commitDelay(state.current))
  }, [commit])

  useEffect(() => {
    if (!enabled) return
    const kd = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()
      down()
    }
    const ku = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      up()
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [enabled, down, up])

  useEffect(
    () => () => {
      clearTimeout(timer.current)
      sidetoneOff()
    },
    [],
  )

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (pointerId.current !== null) return // ignore multi-touch
      pointerId.current = e.pointerId
      e.currentTarget.setPointerCapture(e.pointerId)
      down()
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerId !== pointerId.current) return
      pointerId.current = null
      up()
    },
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerId !== pointerId.current) return
      pointerId.current = null
      up()
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }

  /** Unit the next press will be judged against, in ms. */
  const unit = state.current.unit

  return { handlers, buffer, matched, pressed, unit }
}
