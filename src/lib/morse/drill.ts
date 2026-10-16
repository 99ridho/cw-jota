import { GROUPS, type MorseChar } from './table'

export const DRILL_LENGTH = 6
export const PASS_MARK = 5
export const SENDS_PER_CHAR = 2

export interface DrillQuestion {
  target: MorseChar
  options: MorseChar[]
  requeued?: boolean
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Characters known once `group` (1-based) is reached. */
export function learnedThrough(group: number): MorseChar[] {
  return GROUPS.slice(0, group).flat()
}

export function optionCount(group: number): number {
  return [2, 3, 4][group - 1] ?? 4
}

export function makeOptions(target: MorseChar, group: number, rand: () => number = Math.random): MorseChar[] {
  const fresh = GROUPS[group - 1] ?? []
  const pool = learnedThrough(group).filter((c) => c !== target)
  // Prefer this pack's characters as distractors: they are the ones to tell apart.
  const ordered = [...shuffle(pool.filter((c) => fresh.includes(c)), rand), ...shuffle(pool.filter((c) => !fresh.includes(c)), rand)]
  return shuffle([target, ...ordered.slice(0, optionCount(group) - 1)], rand)
}

export function makeDrill(group: number, rand: () => number = Math.random): DrillQuestion[] {
  const fresh = GROUPS[group - 1] ?? []
  const targets: MorseChar[] = []
  while (targets.length < DRILL_LENGTH) targets.push(...fresh)
  const qs = shuffle(targets.slice(0, DRILL_LENGTH), rand)
  // Avoid three of the same in a row.
  for (let i = 2; i < qs.length; i++) {
    if (qs[i] === qs[i - 1] && qs[i] === qs[i - 2]) {
      const j = qs.findIndex((c, k) => k > i && c !== qs[i])
      if (j > 0) [qs[i], qs[j]] = [qs[j]!, qs[i]!]
    }
  }
  return qs.map((target) => ({ target, options: makeOptions(target, group, rand) }))
}

export function sendTargets(group: number): MorseChar[] {
  const fresh = GROUPS[group - 1] ?? []
  return Array.from({ length: SENDS_PER_CHAR }, () => fresh).flat()
}
