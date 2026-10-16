import { forwardRef } from 'react'
import { MORSE_TABLE } from '@/lib/morse/table'
import { PatternGlyph } from './PatternGlyph'

interface Props {
  name: string
  eventLabel: string
  activeIndex?: number
  activeEl?: number
}

export const NameCard = forwardRef<HTMLDivElement, Props>(function NameCard(
  { name, eventLabel, activeIndex = -1, activeEl = -1 },
  ref,
) {
  return (
    <div ref={ref} className="brutal relative overflow-hidden bg-accent p-5">
      <div className="label-mono mb-3 flex justify-between text-ink">
        <span>{eventLabel}</span>
        <span>· – · – ·</span>
      </div>
      <div className="flex flex-col gap-2">
        {[...name].map((ch, i) => {
          const p = MORSE_TABLE[ch]
          if (!p) return null
          return (
            <div
              key={i}
              className={`flex items-center gap-4 border-2 border-border px-3 py-1.5 ${i === activeIndex ? 'bg-lamp' : 'bg-card'}`}
            >
              <span className="w-8 font-mono text-3xl font-bold text-ink">{ch}</span>
              <PatternGlyph pattern={p} size="sm" activeEl={i === activeIndex ? activeEl : -1} />
            </div>
          )
        })}
      </div>
    </div>
  )
})
