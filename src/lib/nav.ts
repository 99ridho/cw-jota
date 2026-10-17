import type { Level } from '@/lib/morse/levels'

/** Where Back goes from a screen: one level up the flow, not one step back in history. */
export function parentPath(pathname: string, level: Level | null, stage: number): string {
  const learn = /^\/learn\/(\d+)\//.exec(pathname)
  if (learn) return `/stage/${learn[1]}`
  if (/^\/stage\/\d+$/.test(pathname)) return '/stage'
  if (pathname === '/stage') return '/level'
  if (pathname === '/challenge' || pathname === '/finish') return level === 'easy' ? `/stage/${stage}` : '/level'
  return '/'
}
