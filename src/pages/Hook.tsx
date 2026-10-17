import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, Eye, RotateCcw, SkipForward } from 'lucide-react'
import { AppShell, Sticker } from '@/components/AppShell'
import { PatternGlyph } from '@/components/PatternGlyph'
import { SignalLamp } from '@/components/SignalLamp'
import { Button } from '@/components/ui/button'
import { HOOK_MESSAGE } from '@/config'
import { useT } from '@/i18n'
import { blip } from '@/lib/audio/engine'
import { MORSE_TABLE } from '@/lib/morse/table'
import { cn } from '@/lib/utils'
import { usePlayMorse } from '@/hooks/usePlayMorse'

export default function Hook() {
  const t = useT()
  const navigate = useNavigate()
  const msg = HOOK_MESSAGE.toUpperCase()
  const player = usePlayMorse(msg)
  const [played, setPlayed] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => void player.play().then(() => setPlayed(true)), 600)
    return () => clearTimeout(id)
  }, [])

  const reveal = () => {
    player.stop()
    setPlayed(true)
    setRevealed(true)
    blip('good')
  }

  const skip = () => {
    player.stop()
    navigate('/level')
  }

  return (
    <AppShell kicker={t('hook.kicker')}>
      <h1 className="text-4xl leading-tight font-bold text-balance">{t('hook.title')}</h1>

      <div className="brutal flex flex-col items-center gap-6 bg-ink px-4 py-8 text-on-ink">
        <SignalLamp on={player.lampOn} active={player.isPlaying} size="lg" />
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3">
          {[...msg].map((ch, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'border-[3px] border-on-ink p-2 transition-colors',
                  player.activeIndex === i && 'bg-on-ink/15',
                )}
              >
                <PatternGlyph
                  pattern={MORSE_TABLE[ch] ?? ''}
                  size="sm"
                  activeEl={player.activeIndex === i ? player.activeEl : -1}
                  inverse
                />
              </div>
              <span
                className={cn(
                  'flex size-12 items-center justify-center border-[3px] border-on-ink font-mono text-3xl font-bold',
                  revealed ? 'animate-pop bg-accent text-ink' : 'text-on-ink/40',
                )}
                style={revealed ? { animationDelay: `${i * 120}ms`, animationFillMode: 'both' } : undefined}
              >
                {revealed ? ch : '?'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-muted-foreground">{t('hook.hint')}</p>

      <div aria-live="polite" className="text-center">
        {revealed && (
          <p className="text-xl font-bold">
            {t('hook.revealed')} <Sticker className="ml-1 bg-secondary">{msg}</Sticker>
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {!revealed ? (
          <Button size="xl" variant="accent" onClick={reveal} disabled={!played}>
            <Eye /> {t('hook.reveal')}
          </Button>
        ) : (
          <Button size="xl" onClick={() => navigate('/level')}>
            {t('hook.next')} <ArrowRight className="size-6" />
          </Button>
        )}
        <div className={cn('grid gap-3', !played && 'grid-cols-2')}>
          <Button variant="outline" onClick={() => void player.play()} disabled={player.isPlaying}>
            <RotateCcw /> {t('hook.replay')}
          </Button>
          {!played && (
            <Button variant="outline" onClick={skip}>
              <SkipForward /> {t('hook.skip')}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
