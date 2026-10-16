import type { Element } from './table'

export const UNIT_INITIAL_MS = 150
export const UNIT_MIN_MS = 80
export const UNIT_MAX_MS = 300
export const MAX_ELEMENTS = 5

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export interface ClassifierState {
  unit: number
  buffer: Element[]
}

export function createClassifier(unit = UNIT_INITIAL_MS): ClassifierState {
  return { unit, buffer: [] }
}

/** Classify one key press of `d` ms and adapt the unit. */
export function pushPress(state: ClassifierState, d: number): ClassifierState {
  const el: Element = d < 2 * state.unit ? '.' : '-'
  const sample = el === '.' ? d : d / 3
  const unit = clamp(0.7 * state.unit + 0.3 * sample, UNIT_MIN_MS, UNIT_MAX_MS)
  return { unit, buffer: [...state.buffer, el] }
}

/** Idle time after the last release before the character commits. */
export function commitDelay(state: ClassifierState): number {
  return Math.max(500, 4 * state.unit)
}

export function shouldCommitNow(state: ClassifierState): boolean {
  return state.buffer.length >= MAX_ELEMENTS
}

export function pattern(state: ClassifierState): string {
  return state.buffer.join('')
}
