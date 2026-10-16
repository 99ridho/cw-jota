import { num, speed, str } from './lib/env'

const env = import.meta.env

export const HOOK_MESSAGE = str(env.VITE_HOOK_MESSAGE, 'JOTA').toUpperCase()
export const STATION_CALLSIGN = str(env.VITE_STATION_CALLSIGN, '[CALLSIGN]')
export const STATION_CTA = {
  en: str(env.VITE_STATION_CTA_EN, 'Come and try a real radio at the station.'),
  id: str(env.VITE_STATION_CTA_ID, 'Ayo coba radio sungguhan di stasiun.'),
}
export const PRACTICE_URL = str(env.VITE_PRACTICE_URL, 'https://lcwo.net')
export const TONE_HZ = num(env.VITE_TONE_HZ, 650)
export const EVENT_LABEL = str(env.VITE_EVENT_LABEL, 'JOTA 2026')
export const ANALYTICS_URL = str(env.VITE_ANALYTICS_URL, '') || undefined

export const SPEED_PRESETS = {
  learn: speed(env.VITE_SPEED_LEARN, { c: 18, s: 8 }),
  challenge: speed(env.VITE_SPEED_CHALLENGE, { c: 18, s: 12 }),
}

export type PresetName = keyof typeof SPEED_PRESETS
