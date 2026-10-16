import { priorChars, STAGES, type MorseChar } from './table'

export const DRILL_LENGTH = 6
export const PASS_MARK = 5
export const SENDS_PER_CHAR = 2

export interface DrillQuestion {
  target: MorseChar
  options: MorseChar[]
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Letters of one pack (both 1-based). */
export function packChars(stage: number, pack: number): MorseChar[] {
  return STAGES[stage - 1]?.[pack - 1] ?? []
}

/** Characters known once `pack` of `stage` is reached: earlier stages plus this stage's packs so far. */
export function learnedThrough(stage: number, pack: number): MorseChar[] {
  return [...priorChars(stage), ...(STAGES[stage - 1] ?? []).slice(0, pack).flat()]
}

export function optionCount(pack: number): number {
  return [2, 3, 4][pack - 1] ?? 4
}

export function makeOptions(target: MorseChar, stage: number, pack: number, rand: () => number = Math.random): MorseChar[] {
  const fresh = packChars(stage, pack)
  const pool = learnedThrough(stage, pack).filter((c) => c !== target)
  // Prefer this pack's characters as distractors: they are the ones to tell apart.
  const ordered = [...shuffle(pool.filter((c) => fresh.includes(c)), rand), ...shuffle(pool.filter((c) => !fresh.includes(c)), rand)]
  return shuffle([target, ...ordered.slice(0, optionCount(pack) - 1)], rand)
}

export function makeDrill(stage: number, pack: number, rand: () => number = Math.random): DrillQuestion[] {
  const fresh = packChars(stage, pack)
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
  return qs.map((target) => ({ target, options: makeOptions(target, stage, pack, rand) }))
}

export function sendTargets(stage: number, pack: number): MorseChar[] {
  const fresh = packChars(stage, pack)
  return Array.from({ length: SENDS_PER_CHAR }, () => fresh).flat()
}
