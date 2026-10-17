import { useNavigate, useParams } from 'react-router'
import { Check, Trophy } from 'lucide-react'
import { AppShell, Sticker } from '@/components/AppShell'
import { useT } from '@/i18n'
import { stageStart } from '@/lib/morse/levels'
import { priorChars, stageChars, STAGES } from '@/lib/morse/table'
import { bestKey } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { usePersisted, useSession } from '@/store/session'

// Packs take the stage card colors; the warm-up stays plain because it teaches nothing new.
const CARD_COLORS = ['bg-accent', 'bg-info', 'bg-pink']

type Card = { to: string; title: string; letters?: string; sub?: string; color: string; done?: boolean; best?: number }

/** Every way into an Easy stage: warm-up, any pack, or straight to the words. */
export default function Packs() {
  const t = useT()
  const navigate = useNavigate()
  const stage = Number(useParams().stage)
  const packsDone = useSession((s) => s.packsDone)
  const bests = usePersisted((s) => s.bests)
  const done = packsDone[stage] ?? 0
  const next = stageStart(stage, packsDone)

  const cards: Card[] = [
    ...(stage > 1
      ? [{ to: `/learn/${stage}/recap`, title: t('packs.warmup'), sub: t('packs.warmupSub', { n: priorChars(stage).length }), color: 'bg-card text-foreground' }]
      : []),
    ...STAGES[stage - 1]!.map((chars, i) => ({
      to: `/learn/${stage}/${i + 1}`,
      title: t('packs.n', { n: i + 1 }),
      letters: chars.join(' '),
      color: `${CARD_COLORS[i % CARD_COLORS.length]} text-ink`,
      done: i + 1 <= done,
    })),
    {
      to: '/challenge',
      title: t('packs.challenge'),
      sub: t('packs.challengeSub', { n: stageChars(stage).length }),
      color: 'bg-secondary text-ink',
      best: bests[bestKey('easy', stage)] ?? 0,
    },
  ]

  return (
    <AppShell kicker={t('packs.kicker', { s: stage })}>
      <div>
        <h1 className="text-3xl font-bold">{t('packs.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('packs.sub')}</p>
      </div>
      <div className="flex flex-col gap-4">
        {cards.map((c, i) => (
          <button
            key={c.to}
            type="button"
            onClick={() => navigate(c.to)}
            className={cn(
              'brutal press relative flex flex-col items-start gap-2 p-4 text-left',
              c.color,
              i % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]',
            )}
          >
            {c.to === next && <Sticker className={cn('absolute -top-3 -right-2 rotate-6', c.color.includes('bg-pink') ? 'bg-accent' : 'bg-pink')}>{t('packs.next')}</Sticker>}
            <span className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pr-8">
              <span className="text-2xl font-bold">{c.title}</span>
              {c.letters && <span className="font-mono text-xl font-bold tracking-wide">{c.letters}</span>}
            </span>
            {c.sub && <span>{c.sub}</span>}
            {c.best !== undefined && (
              <span className="flex items-center gap-1.5 font-mono text-sm font-bold">
                <Trophy className="size-4" aria-hidden />
                {c.best > 0 ? t('level.best', { n: c.best }) : t('level.noBest')}
              </span>
            )}
            {c.done && <Check className="absolute top-3 right-3 size-6" aria-label={t('packs.done')} />}
          </button>
        ))}
      </div>
    </AppShell>
  )
}
