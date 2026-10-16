import { en, type Dict } from './en'
import { id } from './id'
import { usePersisted } from '@/store/session'

export type Lang = 'en' | 'id'
export type TKey = keyof Dict

export const DICTS: Record<Lang, Dict> = { en, id }

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key]
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}

export function useT() {
  const lang = usePersisted((s) => s.lang)
  return (key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars)
}

