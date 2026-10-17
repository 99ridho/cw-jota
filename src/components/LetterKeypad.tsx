import { useState } from 'react'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  /** Keys on the letter page. */
  chars: string[]
  /** Optional second page, reached with the toggle (Hard level). */
  digits?: string[]
  onKey: (c: string) => void
  onBackspace: () => void
  disabled?: boolean
  backspaceLabel: string
  lettersLabel?: string
  digitsLabel?: string
}

const COLORS = ['bg-accent', 'bg-info', 'bg-pink', 'bg-secondary']

export function LetterKeypad({
  chars,
  digits,
  onKey,
  onBackspace,
  disabled,
  backspaceLabel,
  lettersLabel,
  digitsLabel,
}: Props) {
  const [page, setPage] = useState<'letters' | 'digits'>('letters')
  // Seven keys fit big; the full alphabet needs a denser grid.
  const big = chars.length <= 8
  const keys = page === 'digits' && digits ? digits : chars

  return (
    <div className="flex flex-col gap-2.5">
      {digits && (
        <div className="grid grid-cols-2 gap-2.5" role="group">
          {(['letters', 'digits'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={page === p}
              onClick={() => setPage(p)}
              className={cn(
                'brutal press h-11 font-mono text-base font-bold',
                page === p ? 'bg-foreground text-background' : 'bg-card',
              )}
            >
              {p === 'letters' ? lettersLabel : digitsLabel}
            </button>
          ))}
        </div>
      )}
      {/* With a digits page, hold the letter page's 5-row height so the screen does not jump. */}
      <div className={cn('grid content-start gap-2', big ? 'grid-cols-4 gap-2.5' : 'grid-cols-6', digits && 'min-h-[17rem]')}>
        {keys.map((c, i) => (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onKey(c)}
            className={cn(
              'brutal press flex items-center justify-center font-mono font-bold text-ink disabled:opacity-50',
              big ? 'h-16 text-2xl' : 'h-12 text-xl',
              COLORS[(big ? i : i + Math.floor(i / 6)) % COLORS.length],
            )}
          >
            {c}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={onBackspace}
          aria-label={backspaceLabel}
          className={cn(
            'brutal press flex items-center justify-center bg-card disabled:opacity-50',
            big ? 'h-16' : 'h-12',
          )}
        >
          <Delete className={big ? 'size-7' : 'size-6'} />
        </button>
      </div>
    </div>
  )
}
