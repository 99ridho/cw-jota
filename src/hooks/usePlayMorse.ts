import { useCallback, useEffect, useRef, useState } from 'react'
import { SPEED_PRESETS, type PresetName } from '@/config'
import { now, playSchedule, stopPlayback } from '@/lib/audio/engine'
import { buildSchedule, type Schedule } from '@/lib/morse/timing'

export interface PlayState {
  isPlaying: boolean
  lampOn: boolean
  /** Index of the character currently sounding (or last sounded), -1 when idle. */
  activeIndex: number
  /** Element index inside the active character, -1 between elements. */
  activeEl: number
}

const IDLE: PlayState = { isPlaying: false, lampOn: false, activeIndex: -1, activeEl: -1 }

// Without an AudioContext the visuals still run on the page clock.
const clock = () => now() ?? performance.now() / 1000

export function usePlayMorse(text = '', preset: PresetName = 'learn') {
  const [state, setState] = useState<PlayState>(IDLE)
  const raf = useRef(0)
  const done = useRef<(() => void) | null>(null)

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current)
    stopPlayback()
    setState(IDLE)
    done.current?.()
    done.current = null
  }, [])

  const play = useCallback(
    (override?: string, presetOverride?: PresetName): Promise<void> => {
      stop()
      const schedule: Schedule = buildSchedule(override ?? text, SPEED_PRESETS[presetOverride ?? preset])
      const start = playSchedule(schedule) ?? clock() + 0.08
      return new Promise<void>((resolve) => {
        done.current = resolve
        const tick = () => {
          const t = clock() - start
          if (t > schedule.duration + 0.05) {
            setState(IDLE)
            done.current?.()
            done.current = null
            return
          }
          let lampOn = false
          let activeIndex = -1
          let activeEl = -1
          for (const e of schedule.events) {
            if (e.t > t) break
            activeIndex = e.charIndex
            if (t < e.t + e.dur) {
              lampOn = true
              activeEl = e.elIndex
            }
          }
          setState((prev) =>
            prev.lampOn === lampOn && prev.activeIndex === activeIndex && prev.activeEl === activeEl && prev.isPlaying
              ? prev
              : { isPlaying: true, lampOn, activeIndex, activeEl },
          )
          raf.current = requestAnimationFrame(tick)
        }
        raf.current = requestAnimationFrame(tick)
      })
    },
    [preset, stop, text],
  )

  useEffect(() => () => {
    cancelAnimationFrame(raf.current)
    stopPlayback()
  }, [])

  return { play, stop, ...state }
}
