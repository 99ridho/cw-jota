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
  /** Per element: already sent and accepted (send drill guide). Overrides `matched`. */
  accepted?: boolean[]
  /** Element being held down right now; it fills over `fillMs`. */
  filling?: number
  fillMs?: number
}

const DIT = { sm: 'h-3 w-3', md: 'h-5 w-5', lg: 'h-7 w-7' }
const DAH = { sm: 'h-3 w-9', md: 'h-5 w-14', lg: 'h-7 w-20' }
const GAP = { sm: 'gap-1.5', md: 'gap-2.5', lg: 'gap-3' }

export function PatternGlyph({
  pattern,
  activeEl = -1,
  matched = 0,
  size = 'md',
  className,
  hidden,
  inverse,
  accepted,
  filling = -1,
  fillMs = 0,
}: Props) {
  const label = [...pattern].map((e) => (e === '.' ? 'dit' : 'dah')).join(' ')
  return (
    <div className={cn('inline-flex items-center', GAP[size], className)} role="img" aria-label={hidden ? '?' : label}>
      {[...pattern].map((el, i) => {
        const done = accepted ? !!accepted[i] : i < matched
        return (
          <span
            key={i}
            className={cn(
              'relative overflow-hidden border-[3px] transition-colors',
              inverse ? 'border-background' : 'border-border',
              el === '.' ? DIT[size] : DAH[size],
              el === '.' && 'rounded-full',
              hidden ? 'border-dashed bg-transparent' : i === activeEl ? 'bg-lamp' : done ? 'bg-secondary' : inverse ? 'bg-background' : 'bg-ink',
            )}
          >
            {i === filling && (
              <span
                aria-hidden
                className="absolute inset-0 origin-left animate-fill bg-lamp"
                style={{ animationDuration: `${fillMs}ms` }}
              />
            )}
          </span>
        )
      })}
    </div>
  )
}
