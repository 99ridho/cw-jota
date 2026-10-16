import { Flame, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Props {
  score: number
  streak?: number
  scoreLabel: string
  streakLabel: string
}

export function ScoreChip({ score, streak = 0, scoreLabel, streakLabel }: Props) {
  const prev = useRef(score)
  const [delta, setDelta] = useState<{ v: number; k: number } | null>(null)
  useEffect(() => {
    if (score > prev.current) setDelta({ v: score - prev.current, k: Date.now() })
    prev.current = score
  }, [score])

  return (
    <div className="flex items-center gap-2">
      {streak > 1 && (
        <span key={streak} className="brutal flex animate-pop items-center gap-1 bg-pink px-2 py-1 font-mono text-sm font-bold text-ink" aria-label={`${streakLabel} ${streak}`}>
          <Flame className="size-4" /> {streak}
        </span>
      )}
      <span className="brutal relative flex items-center gap-1 bg-card px-2 py-1 font-mono text-sm font-bold" aria-label={`${scoreLabel} ${score}`}>
        <Trophy className="size-4" aria-hidden /> {score}
        {delta && (
          <span key={delta.k} className="pointer-events-none absolute -top-2 right-0 animate-float-up font-mono text-base font-bold text-ink" aria-hidden>
            +{delta.v}
          </span>
        )}
      </span>
    </div>
  )
}
