import { useCallback, useEffect, useRef, useState } from 'react'
import { sidetoneOff, sidetoneOn } from '@/lib/audio/engine'
import {
  commitDelay,
  createClassifier,
  pattern,
  pushPress,
  shouldCommitNow,
  type ClassifierState,
} from '@/lib/morse/classifier'

interface Options {
  onCommit: (pattern: string) => void
  enabled?: boolean
}

/** Turns presses into dits and dahs. Space works anywhere on the page while enabled. */
export function useSendInput({ onCommit, enabled = true }: Options) {
  const state = useRef<ClassifierState>(createClassifier())
  const downAt = useRef<number | null>(null)
  const pointerId = useRef<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const commitRef = useRef(onCommit)
  commitRef.current = onCommit
  const [buffer, setBuffer] = useState('')
  const [pressed, setPressed] = useState(false)

  const commit = useCallback(() => {
    clearTimeout(timer.current)
    const p = pattern(state.current)
    state.current = { ...state.current, buffer: [] }
    setBuffer('')
    if (p) commitRef.current(p)
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
    if (shouldCommitNow(state.current)) commit()
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

  return { handlers, buffer, pressed }
}
