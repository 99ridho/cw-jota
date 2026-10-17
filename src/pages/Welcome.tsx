import { useState } from 'react'
import { ArrowRight, Headphones, Volume2 } from 'lucide-react'
import { useFlowNavigate } from '@/hooks/useFlow'
import { AppShell, Sticker } from '@/components/AppShell'
import { PatternGlyph } from '@/components/PatternGlyph'
import { SignalLamp } from '@/components/SignalLamp'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { EVENT_LABEL } from '@/config'
import { useT } from '@/i18n'
import { unlockAudio } from '@/lib/audio/unlock'
import { usePlayMorse } from '@/hooks/usePlayMorse'
import { usePersisted } from '@/store/session'

export default function Welcome() {
  const t = useT()
  const navigate = useFlowNavigate()
  const { lang, setLang, reduceMotion, setReduceMotion } = usePersisted()
  const tone = usePlayMorse('TEST')
  const [starting, setStarting] = useState(false)

  const testTone = async () => {
    await unlockAudio()
    void tone.play()
  }

  const start = async () => {
    setStarting(true)
    tone.stop()
    await unlockAudio()
    try {
      sessionStorage.removeItem('jota-chunk-reload')
    } catch {
      // Storage blocked: nothing to clear.
    }
    navigate('/hook')
  }

  return (
    <AppShell
      back={false}
      kicker={<Sticker className="rotate-2 bg-info">{EVENT_LABEL}</Sticker>}
      right={
        <ToggleGroup
          type="single"
          variant="outline"
          value={lang}
          onValueChange={(v) => v && setLang(v as 'en' | 'id')}
          aria-label={t('welcome.lang')}
        >
          <ToggleGroupItem value="id" className="h-11 min-w-12">ID</ToggleGroupItem>
          <ToggleGroupItem value="en" className="h-11 min-w-12">EN</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      <section className="relative mt-2 flex flex-col gap-4">
        <p className="label-mono">{t('welcome.kicker')}</p>
        <h1 className="text-[3.25rem] leading-[0.95] font-bold tracking-tight text-balance">
          {t('welcome.title')}
        </h1>
        <p className="text-lg text-pretty">{t('welcome.sub')}</p>
      </section>

      <section className="brutal flex items-center gap-4 bg-card p-4 min-[400px]:gap-5">
        <SignalLamp on={tone.lampOn} active={tone.isPlaying} />
        <div className="flex min-w-0 flex-col gap-3">
          <PatternGlyph pattern="-.-.-" size="sm" />
          {/* One tile per level, previewing what the level picker offers. */}
          <div className="flex flex-wrap gap-1.5">
            {['ETANSOM', 'A–Z', '0–9'].map((c, i) => (
              <span
                key={c}
                className="flex h-8 items-center justify-center border-2 border-border bg-accent px-2 font-mono text-lg font-bold text-ink"
                style={{ rotate: `${(i % 2 ? 1 : -1) * (2 + i)}deg` }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-start gap-3 border-[3px] border-dashed border-border bg-card/70 p-3">
          <Headphones className="mt-0.5 size-6 shrink-0" aria-hidden />
          <p>{t('welcome.sound')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={testTone} disabled={tone.isPlaying}>
            <Volume2 /> {t('welcome.testTone')}
          </Button>
          <label className="flex min-h-12 cursor-pointer items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={!!reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
              className="size-6 accent-[var(--ink)]"
            />
            {t('welcome.reduceMotion')}
          </label>
        </div>
      </section>

      <div className="mt-auto pt-2">
        <Button size="xl" className="w-full" onClick={start} disabled={starting}>
          {t('welcome.start')} <ArrowRight className="size-6" />
        </Button>
      </div>
    </AppShell>
  )
}
