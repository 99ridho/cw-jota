import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface Props {
  on: boolean
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 'size-16', md: 'size-28', lg: 'size-40' }

/** Capped at 200 CSS px for flash safety; reduced motion swaps blinking for a steady "on air" state. */
export function SignalLamp({ on, active = on, size = 'md', className }: Props) {
  const reduce = useReducedMotion()
  const lit = reduce ? active : on
  return (
    <div className={cn('relative inline-grid place-items-center', className)} aria-hidden>
      <div
        className={cn(
          'brutal max-h-[200px] max-w-[200px] rounded-full transition-colors duration-[40ms]',
          SIZES[size],
          lit ? 'bg-lamp shadow-[0_0_0_8px_color-mix(in_oklch,var(--lamp)_45%,transparent),4px_4px_0_0_var(--shadow-color)]' : 'bg-lamp-off',
        )}
      >
        <div className="absolute top-[18%] left-[22%] size-[22%] rounded-full bg-white/50" />
      </div>
      {reduce && active && (
        <span className="label-mono absolute -bottom-3 border-2 border-border bg-card px-1.5 py-0.5 text-[10px]">
          on air
        </span>
      )}
    </div>
  )
}
