import type { SpeedPreset } from './morse/timing'

/** Vite reads `VITE_X=` as '', so blank values fall back like missing ones. */
export function str(v: string | undefined, fallback: string): string {
  const s = v?.trim()
  return s ? s : fallback
}

export function num(v: string | undefined, fallback: number): number {
  const n = Number(str(v, ''))
  return str(v, '') && Number.isFinite(n) && n > 0 ? n : fallback
}

/** Parses "c/s" WPM, e.g. "18/8". Overall speed is capped at character speed. */
export function speed(v: string | undefined, fallback: SpeedPreset): SpeedPreset {
  const m = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(str(v, ''))
  if (!m) return fallback
  const c = Number(m[1])
  const s = Number(m[2])
  if (!(c > 0 && s > 0)) return fallback
  return { c, s: Math.min(s, c) }
}
