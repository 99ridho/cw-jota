import { useState } from 'react'
import { useParams } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { useFlowNavigate } from '@/hooks/useFlow'
import { AppShell } from '@/components/AppShell'
import { PatternGlyph } from '@/components/PatternGlyph'
import { SignalLamp } from '@/components/SignalLamp'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { MORSE_TABLE, priorChars, type MorseChar } from '@/lib/morse/table'
import { cn } from '@/lib/utils'
import { usePlayMorse } from '@/hooks/usePlayMorse'

/** Warm-up before a later Easy stage: every earlier letter, one tap to hear it. */
export default function Recap() {
  const t = useT()
  const navigate = useFlowNavigate()
  const stage = Number(useParams().stage)
  const player = usePlayMorse()
  const [playing, setPlaying] = useState<MorseChar | null>(null)

  const hear = (c: MorseChar) => {
    setPlaying(c)
    void player.play(c).then(() => setPlaying(null))
  }

  return (
    <AppShell kicker={t('learn.recap.kicker', { s: stage })}>
      <div>
        <h1 className="text-3xl font-bold">{t('learn.recap.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('learn.recap.sub')}</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {priorChars(stage).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => hear(c)}
            className={cn(
              'brutal press flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 font-mono text-2xl font-bold',
              playing === c ? 'bg-accent text-ink' : 'bg-card',
            )}
          >
            {c}
            <PatternGlyph pattern={MORSE_TABLE[c]!} activeEl={playing === c ? player.activeEl : -1} size="sm" className="scale-75" />
          </button>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-4">
        <SignalLamp on={player.lampOn} active={player.isPlaying} size="sm" />
        <Button size="lg" className="flex-1" onClick={() => navigate(`/learn/${stage}/1`)}>
          {t('learn.recap.go')} <ArrowRight />
        </Button>
      </div>
    </AppShell>
  )
}
