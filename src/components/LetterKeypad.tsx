import { Delete } from 'lucide-react'
import { MORSE_CHARS, MORSE_TABLE, type MorseChar } from '@/lib/morse/table'
import { PatternGlyph } from './PatternGlyph'
import { cn } from '@/lib/utils'

interface Props {
  onKey: (c: MorseChar) => void
  onBackspace: () => void
  disabled?: boolean
  showPatterns?: boolean
  backspaceLabel: string
}

const COLORS = ['bg-accent', 'bg-info', 'bg-pink', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-pink']

export function LetterKeypad({ onKey, onBackspace, disabled, showPatterns = true, backspaceLabel }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {MORSE_CHARS.map((c, i) => (
        <button
          key={c}
          type="button"
          disabled={disabled}
          onClick={() => onKey(c)}
          className={cn(
            'brutal press flex h-16 flex-col items-center justify-center gap-1 font-mono text-2xl font-bold text-ink disabled:opacity-50',
            COLORS[i],
          )}
        >
          {c}
          {showPatterns && <PatternGlyph pattern={MORSE_TABLE[c]!} size="sm" className="scale-75" />}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        aria-label={backspaceLabel}
        className="brutal press flex h-16 items-center justify-center bg-card text-ink disabled:opacity-50"
      >
        <Delete className="size-7" />
      </button>
    </div>
  )
}
