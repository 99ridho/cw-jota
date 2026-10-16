import type { Element } from './table'

export const UNIT_INITIAL_MS = 150
export const UNIT_MIN_MS = 80
export const UNIT_MAX_MS = 300
export const MAX_ELEMENTS = 5
/** Presses between these multiples of the unit count as either a dit or a dah. */
export const DIT_MAX_U = 1.4
export const DAH_MIN_U = 2.6

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export interface ClassifierState {
  unit: number
  buffer: Element[]
  /** One per buffered element: press length and the unit it was judged against, in ms. */
  presses: { d: number; u: number }[]
}

export function createClassifier(unit = UNIT_INITIAL_MS): ClassifierState {
  return { unit, buffer: [], presses: [] }
}

/** Classify one key press of `d` ms and adapt the unit. */
export function pushPress(state: ClassifierState, d: number): ClassifierState {
  const el: Element = d < 2 * state.unit ? '.' : '-'
  const clear = d < DIT_MAX_U * state.unit || d > DAH_MIN_U * state.unit
  // Only clear presses teach the unit, so one borderline press cannot drag it around.
  const unit = clear ? clamp(0.7 * state.unit + 0.3 * (el === '.' ? d : d / 3), UNIT_MIN_MS, UNIT_MAX_MS) : state.unit
  return { unit, buffer: [...state.buffer, el], presses: [...state.presses, { d, u: state.unit }] }
}

/** Per element: does the press fit the target, allowing the borderline band? */
export function elementMatches(state: ClassifierState, target: string): boolean[] {
  return state.presses.map(({ d, u }, i) => {
    const want = target[i]
    if (want === '.') return d <= DAH_MIN_U * u
    if (want === '-') return d >= DIT_MAX_U * u
    return false
  })
}

export function matchesTarget(state: ClassifierState, target: string): boolean {
  return state.presses.length === target.length && elementMatches(state, target).every(Boolean)
}

/** Idle time after the last release before the character commits. */
export function commitDelay(state: ClassifierState): number {
  return Math.max(800, 5 * state.unit)
}

export function shouldCommitNow(state: ClassifierState, target?: string): boolean {
  return state.buffer.length >= (target?.length ?? MAX_ELEMENTS)
}

export function pattern(state: ClassifierState): string {
  return state.buffer.join('')
}
