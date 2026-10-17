import { Trophy } from 'lucide-react'
import { useFlowNavigate } from '@/hooks/useFlow'
import { AppShell } from '@/components/AppShell'
import { useT } from '@/i18n'
import { EASY_STAGES, LEVELS, type Level } from '@/lib/morse/levels'
import { bestKey } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { usePersisted, useSession } from '@/store/session'

// Same colors and tilt as the Meet cards: three peer choices, told apart by color.
const CARD_COLORS = ['bg-accent', 'bg-info', 'bg-pink']
const SET: Record<Exclude<Level, 'easy'>, string> = { medium: 'A–Z', hard: 'A–Z · 0–9' }

export default function LevelPicker() {
  const t = useT()
  const navigate = useFlowNavigate()
  const bests = usePersisted((s) => s.bests)
  const { setLevel, resetRun } = useSession()

  const pick = (level: Level) => {
    setLevel(level)
    resetRun()
    // Easy picks a stage first; its lessons start from there.
    navigate(level === 'easy' ? '/stage' : '/challenge')
  }

  // Easy shows its top stage score, named so it is not read as one overall best.
  const easyTop = Array.from({ length: EASY_STAGES }, (_, i) => ({ s: i + 1, n: bests[bestKey('easy', i + 1)] })).reduce(
    (top, b) => (b.n > top.n ? b : top),
    { s: 1, n: 0 },
  )
  const bestLine = (level: Level) => {
    if (level === 'easy') return easyTop.n > 0 ? t('level.bestStage', easyTop) : t('level.noBest')
    return bests[level] > 0 ? t('level.best', { n: bests[level] }) : t('level.noBest')
  }

  return (
    <AppShell kicker={t('level.kicker')}>
      <div>
        <h1 className="text-3xl font-bold">{t('level.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('level.sub')}</p>
      </div>
      <div className="flex flex-col gap-4">
        {LEVELS.map((level, i) => (
          <button
            key={level}
            type="button"
            onClick={() => pick(level)}
            className={cn(
              'brutal press flex flex-col items-start gap-2 p-4 text-left text-ink',
              CARD_COLORS[i],
              i % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]',
            )}
          >
            <span className="flex w-full items-baseline justify-between gap-3">
              <span className="text-2xl font-bold">{t(`level.${level}`)}</span>
              <span className="font-mono text-base font-bold">{level === 'easy' ? t('level.easy.set') : SET[level]}</span>
            </span>
            <span>{t(`level.${level}.desc`)}</span>
            <span className="flex items-center gap-1.5 font-mono text-sm font-bold">
              <Trophy className="size-4" aria-hidden />
              {bestLine(level)}
            </span>
          </button>
        ))}
      </div>
    </AppShell>
  )
}
