import { useNavigate } from 'react-router'
import { Trophy } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { useT } from '@/i18n'
import { LEVELS, type Level } from '@/lib/morse/levels'
import { GROUPS } from '@/lib/morse/table'
import { cn } from '@/lib/utils'
import { usePersisted, useSession } from '@/store/session'

// Same colors and tilt as the Meet cards: three peer choices, told apart by color.
const CARD_COLORS = ['bg-accent', 'bg-info', 'bg-pink']
const SET: Record<Level, string> = { easy: 'E T A N S O M', medium: 'A–Z', hard: 'A–Z · 0–9' }

export default function LevelPicker() {
  const t = useT()
  const navigate = useNavigate()
  const bests = usePersisted((s) => s.bests)
  const { setLevel, resetRun, groupsDone } = useSession()

  const pick = (level: Level) => {
    setLevel(level)
    resetRun()
    // Easy teaches the letters first, unless this visit already did.
    navigate(level === 'easy' && groupsDone < GROUPS.length ? '/learn/1' : '/challenge')
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
              <span className="font-mono text-base font-bold">{SET[level]}</span>
            </span>
            <span>{t(`level.${level}.desc`)}</span>
            <span className="flex items-center gap-1.5 font-mono text-sm font-bold">
              <Trophy className="size-4" aria-hidden />
              {bests[level] > 0 ? t('level.best', { n: bests[level] }) : t('level.noBest')}
            </span>
          </button>
        ))}
      </div>
    </AppShell>
  )
}
