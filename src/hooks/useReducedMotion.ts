import { usePersisted } from '@/store/session'

export const useReducedMotion = () => usePersisted((s) => !!s.reduceMotion)
