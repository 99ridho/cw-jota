import { useNavigate } from 'react-router'
import { Trophy } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { useT } from '@/i18n'
import { stageChars, stageNew, STAGES } from '@/lib/morse/table'
import { bestKey } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { usePersisted, useSession } from '@/store/session'

// Same card language as the level picker; the fourth color comes from the keypad set.
const CARD_COLORS = ['bg-accent', 'bg-info', 'bg-pink', 'bg-secondary']

export default function StagePicker() {
  const t = useT()
  const navigate = useNavigate()
  const bests = usePersisted((s) => s.bests)
  const { setLevel, setStage, resetRun } = useSession()

  const pick = (stage: number) => {
    setLevel('easy')
    setStage(stage)
    resetRun()
    navigate(`/stage/${stage}`)
  }

  return (
    <AppShell kicker={t('stage.kicker')}>
      <div>
        <h1 className="text-3xl font-bold">{t('stage.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('stage.sub')}</p>
      </div>
      <div className="flex flex-col gap-4">
        {STAGES.map((_, i) => {
          const stage = i + 1
          const best = bests[bestKey('easy', stage)]
          return (
            <button
              key={stage}
              type="button"
              onClick={() => pick(stage)}
              className={cn(
                'brutal press flex flex-col items-start gap-2 p-4 text-left text-ink',
                CARD_COLORS[i % CARD_COLORS.length],
                i % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]',
              )}
            >
              <span className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-2xl font-bold">{t('stage.n', { n: stage })}</span>
                <span className="font-mono text-xl font-bold tracking-wide">{stageNew(stage).join(' ')}</span>
              </span>
              <span>{t('stage.inPlay', { n: stageChars(stage).length })}</span>
              <span className="flex items-center gap-1.5 font-mono text-sm font-bold">
                <Trophy className="size-4" aria-hidden />
                {best > 0 ? t('level.best', { n: best }) : t('level.noBest')}
              </span>
            </button>
          )
        })}
      </div>
    </AppShell>
  )
}
