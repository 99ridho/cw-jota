import { cn } from '@/lib/utils'
import { prettyPattern } from '@/lib/morse/table'

interface Props {
  handlers: React.HTMLAttributes<HTMLElement>
  pressed: boolean
  buffer: string
  label: string
  heardLabel: string
  className?: string
}

export function TapPad({ handlers, pressed, buffer, label, heardLabel, className }: Props) {
  return (
    <button
      type="button"
      {...handlers}
      className={cn(
        'relative flex min-h-[38dvh] w-full touch-none select-none flex-col items-center justify-center gap-3 border-[3px] border-border transition-[transform,box-shadow,background-color] duration-75 [-webkit-touch-callout:none]',
        pressed ? 'translate-x-[4px] translate-y-[4px] bg-lamp shadow-none' : 'bg-primary shadow-lg',
        className,
      )}
      aria-label={label}
    >
      <span className="label-mono text-ink/80">{heardLabel}</span>
      <span className="min-h-12 font-mono text-5xl font-bold text-ink" aria-live="polite">
        {buffer ? prettyPattern(buffer) : '·'}
      </span>
      <span className="font-bold text-ink text-xl uppercase tracking-wider">{label}</span>
      <span aria-hidden className="pointer-events-none absolute inset-3 border-2 border-dashed border-ink/30" />
    </button>
  )
}
