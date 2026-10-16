import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="grid grid-flow-col gap-2">
      {steps.map((s, i) => (
        <li
          key={s}
          aria-current={i === current ? 'step' : undefined}
          className={cn(
            'flex h-9 items-center justify-center gap-1 border-[3px] border-border font-mono text-xs font-bold uppercase',
            i < current && 'bg-secondary',
            i === current && 'bg-ink text-background',
            i > current && 'bg-card text-muted-foreground',
          )}
        >
          {i < current && <Check className="size-4" />}
          {s}
        </li>
      ))}
    </ol>
  )
}
