import { TONE_HZ } from '@/config'
import type { Schedule } from '@/lib/morse/timing'
import { getContext } from './unlock'

const RAMP = 0.005
const LEVEL = 0.35

interface Voice {
  osc: OscillatorNode
  gain: GainNode
}

let playback: Voice | null = null
let sidetone: Voice | null = null

function makeVoice(ctx: AudioContext, hz = TONE_HZ, type: OscillatorType = 'sine'): Voice {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = hz
  gain.gain.value = 0
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  return { osc, gain }
}

function killVoice(v: Voice | null, ctx: AudioContext) {
  if (!v) return
  const now = ctx.currentTime
  v.gain.gain.cancelScheduledValues(now)
  v.gain.gain.setValueAtTime(v.gain.gain.value, now)
  v.gain.gain.linearRampToValueAtTime(0, now + RAMP)
  v.osc.stop(now + RAMP + 0.01)
}

/** Queues every element on the audio clock at once; returns the start time, or null without audio. */
export function playSchedule(schedule: Schedule, lead = 0.08): number | null {
  const ctx = getContext()
  if (!ctx) return null
  stopPlayback()
  const v = makeVoice(ctx)
  playback = v
  const start = ctx.currentTime + lead
  const g = v.gain.gain
  g.setValueAtTime(0, ctx.currentTime)
  for (const e of schedule.events) {
    const on = start + e.t
    const off = on + e.dur
    g.setValueAtTime(0, on)
    g.linearRampToValueAtTime(LEVEL, on + RAMP)
    g.setValueAtTime(LEVEL, off - RAMP)
    g.linearRampToValueAtTime(0, off)
  }
  v.osc.stop(start + schedule.duration + 0.05)
  return start
}

export function stopPlayback() {
  const ctx = getContext()
  if (ctx && playback) killVoice(playback, ctx)
  playback = null
}

export function sidetoneOn() {
  const ctx = getContext()
  if (!ctx) return
  if (!sidetone) sidetone = makeVoice(ctx)
  const g = sidetone.gain.gain
  const now = ctx.currentTime
  g.cancelScheduledValues(now)
  g.setValueAtTime(g.value, now)
  g.linearRampToValueAtTime(LEVEL, now + RAMP)
}

export function sidetoneOff() {
  const ctx = getContext()
  if (!ctx || !sidetone) return
  const g = sidetone.gain.gain
  const now = ctx.currentTime
  g.cancelScheduledValues(now)
  g.setValueAtTime(g.value, now)
  g.linearRampToValueAtTime(0, now + RAMP)
}

/** Short reward or nudge sound, distinct from the Morse tone. */
export function blip(kind: 'good' | 'bad' | 'fanfare') {
  const ctx = getContext()
  if (!ctx) return
  const notes =
    kind === 'good' ? [880, 1320] : kind === 'bad' ? [300, 220] : [660, 880, 1100, 1320]
  const step = kind === 'fanfare' ? 0.09 : 0.07
  const v = makeVoice(ctx, notes[0], kind === 'bad' ? 'triangle' : 'square')
  const t0 = ctx.currentTime + 0.01
  const g = v.gain.gain
  notes.forEach((hz, i) => {
    const t = t0 + i * step
    v.osc.frequency.setValueAtTime(hz, t)
    g.setValueAtTime(0, t)
    g.linearRampToValueAtTime(0.12, t + RAMP)
    g.setValueAtTime(0.12, t + step - RAMP * 2)
    g.linearRampToValueAtTime(0, t + step - RAMP)
  })
  v.osc.stop(t0 + notes.length * step + 0.05)
}

export function now(): number | null {
  return getContext()?.currentTime ?? null
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not available (iOS).
  }
}
