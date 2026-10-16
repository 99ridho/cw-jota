import { CircleCheck, CircleX } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Result banner: icon + text + color, never color alone. */
export function Feedback({ kind, children }: { kind: 'good' | 'bad' | null; children?: ReactNode }) {
  return (
    <div aria-live="polite" className="min-h-14">
      {kind && (
        <div
          className={cn(
            'brutal flex animate-pop items-center gap-2 px-3 py-3 text-lg font-bold',
            kind === 'good' ? 'bg-secondary text-ink' : 'animate-shake bg-card text-ink',
          )}
        >
          {kind === 'good' ? <CircleCheck className="size-6 shrink-0" /> : <CircleX className="size-6 shrink-0 text-destructive" />}
          <span>{children}</span>
        </div>
      )}
    </div>
  )
}
