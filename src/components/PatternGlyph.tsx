import { cn } from '@/lib/utils'

interface Props {
  pattern: string
  /** Element currently sounding. */
  activeEl?: number
  /** Number of leading elements already matched (send drill guide). */
  matched?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  hidden?: boolean
  /** Light marks for dark backgrounds. */
  inverse?: boolean
}

const DIT = { sm: 'h-3 w-3', md: 'h-5 w-5', lg: 'h-7 w-7' }
const DAH = { sm: 'h-3 w-9', md: 'h-5 w-14', lg: 'h-7 w-20' }
const GAP = { sm: 'gap-1.5', md: 'gap-2.5', lg: 'gap-3' }

export function PatternGlyph({ pattern, activeEl = -1, matched = 0, size = 'md', className, hidden, inverse }: Props) {
  const label = [...pattern].map((e) => (e === '.' ? 'dit' : 'dah')).join(' ')
  return (
    <div className={cn('inline-flex items-center', GAP[size], className)} role="img" aria-label={hidden ? '?' : label}>
      {[...pattern].map((el, i) => (
        <span
          key={i}
          className={cn(
            'border-[3px] transition-colors',
            inverse ? 'border-background' : 'border-border',
            el === '.' ? DIT[size] : DAH[size],
            el === '.' && 'rounded-full',
            hidden ? 'border-dashed bg-transparent' : i === activeEl ? 'bg-lamp' : i < matched ? 'bg-secondary' : inverse ? 'bg-background' : 'bg-ink',
          )}
        />
      ))}
    </div>
  )
}
