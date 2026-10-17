import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { ArrowRight, Download, Lock, Play, RotateCcw, Share, Share2, Smartphone, SquarePlus, Trophy } from 'lucide-react'
import { AppShell, Sticker } from '@/components/AppShell'
import { NameCard } from '@/components/NameCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EVENT_LABEL, PRACTICE_URL, STATION_CALLSIGN, STATION_CTA } from '@/config'
import { useT } from '@/i18n'
import { BADGES } from '@/lib/badges'
import { renderNameCard, shareOrDownload } from '@/lib/cardImage'
import { awardBadge } from '@/lib/celebrate'
import { EASY_STAGES, stageStart } from '@/lib/morse/levels'
import { bestKey } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { usePlayMorse } from '@/hooks/usePlayMorse'
import { usePersisted, useSession } from '@/store/session'

const cleanName = (s: string) => s.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 12)

export default function Finish() {
  const t = useT()
  const navigate = useNavigate()
  const { score, newBadges, resetRun, stage, setStage, packsDone } = useSession()
  const level = useSession((s) => s.level) ?? 'easy'
  const key = bestKey(level, stage)
  const { bests, badges, lang, nickname, setNickname, submitScore } = usePersisted()
  const [prevBest] = useState(bests[key])
  const [isNewBest, setIsNewBest] = useState(false)
  const submitted = useRef(false)

  useEffect(() => {
    if (submitted.current) return
    submitted.current = true
    setIsNewBest(submitScore(key, score))
  }, [key, score, submitScore])

  const [draft, setDraft] = useState(nickname ?? '')
  const [cardName, setCardName] = useState<string | null>(null)
  const player = usePlayMorse('', 'learn')
  const { mode: installMode, install } = useInstallPrompt()
  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator

  const makeCard = () => {
    const n = cleanName(draft).trim()
    if (!n) return
    setNickname(n)
    setCardName(n)
    awardBadge('name_in_morse')
    void player.play(n)
  }

  const exportCard = async () => {
    if (!cardName) return
    const blob = await renderNameCard(cardName, EVENT_LABEL)
    if (!blob) {
      toast.error(t('finish.name.failed'))
      return
    }
    const how = await shareOrDownload(blob, `morse-${cardName.toLowerCase().replace(/\s+/g, '-')}.png`, `${cardName} · ${EVENT_LABEL}`)
    if (how === 'downloaded') toast.success(t('finish.name.saved'))
  }

  return (
    <AppShell kicker={t('finish.title')}>
      <section className="brutal relative flex flex-col items-center gap-1 bg-primary px-4 py-6 text-ink">
        {isNewBest && <Sticker className="absolute -top-4 -left-2 -rotate-6 bg-accent animate-pop">{t('finish.newBest')}</Sticker>}
        <Trophy className="size-10" aria-hidden />
        <p className="label-mono">{t('finish.score')}</p>
        <p className="font-mono text-6xl font-bold">{score}</p>
        <p className="font-mono text-sm font-bold">
          {t('finish.best', { level: level === 'easy' ? `${t('level.easy')} · ${t('stage.n', { n: stage })}` : t(`level.${level}`) })}: {Math.max(prevBest, score)}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t('finish.badges')}</h2>
        <ul className="grid grid-cols-2 gap-3">
          {BADGES.map(({ id, icon: Icon, color }, i) => {
            const earned = badges.includes(id)
            const fresh = newBadges.includes(id)
            return (
              <li
                key={id}
                className={cn(
                  'relative flex flex-col gap-1 border-[3px] border-border p-3',
                  earned ? `${color} shadow` : 'border-dashed bg-muted text-muted-foreground',
                  earned && (i % 2 ? 'rotate-1' : '-rotate-1'),
                )}
              >
                {fresh && <span className="label-mono absolute -top-3 right-2 border-2 border-border bg-card px-1 text-[10px]">new</span>}
                <span className="flex items-center gap-2 font-bold">
                  {earned ? <Icon className="size-5" aria-hidden /> : <Lock className="size-5" aria-hidden />}
                  {t(`badge.${id}.name`)}
                </span>
                <span className="text-sm">{earned ? t(`badge.${id}.desc`) : `${t('common.locked')} · ${t(`badge.${id}.desc`)}`}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {level === 'easy' && stage < EASY_STAGES && (
        <Button
          size="lg"
          onClick={() => {
            resetRun()
            setStage(stage + 1)
            navigate(stageStart(stage + 1, packsDone))
          }}
        >
          {t('finish.nextStage', { n: stage + 1 })} <ArrowRight />
        </Button>
      )}
      <Button
        variant="accent"
        onClick={() => {
          resetRun()
          navigate('/level')
        }}
      >
        <RotateCcw /> {t('finish.retry')}
      </Button>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t('finish.name.title')}</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            makeCard()
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(cleanName(e.target.value))}
            placeholder={t('finish.name.placeholder')}
            aria-label={t('finish.name.placeholder')}
            autoComplete="off"
            autoCapitalize="characters"
            className="font-mono uppercase"
          />
          <Button type="submit" disabled={!cleanName(draft).trim()}>
            {t('finish.name.make')}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">{t('finish.name.note')}</p>
        {cardName && (
          <div className="flex animate-pop flex-col gap-3">
            <NameCard name={cardName} eventLabel={EVENT_LABEL} activeIndex={player.activeIndex} activeEl={player.activeEl} />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => void player.play(cardName)} disabled={player.isPlaying}>
                <Play /> {t('finish.name.play')}
              </Button>
              <Button variant="secondary" onClick={() => void exportCard()}>
                {canShare ? <Share2 /> : <Download />} {canShare ? t('finish.name.share') : t('finish.name.download')}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="brutal flex flex-col gap-4 bg-info p-4 text-ink">
        <h2 className="text-2xl font-bold">{t('finish.station.title')}</h2>
        <p className="text-lg">{STATION_CTA[lang]}</p>
        <p className="label-mono">
          {t('finish.station.callsign')}: <span className="text-base">{STATION_CALLSIGN}</span>
        </p>
        <div className="flex items-center gap-4 border-[3px] border-border bg-card p-3 text-card-foreground">
          {/* Paper behind the code in both themes: scanners need dark on light. */}
          <QRCodeSVG value={PRACTICE_URL} size={112} bgColor="#f8eace" fgColor="#1a150f" marginSize={2} level="M" className="shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="font-bold">{t('finish.practice')}</span>
            <a href={PRACTICE_URL} target="_blank" rel="noreferrer" className="font-mono text-sm break-all underline underline-offset-4">
              {PRACTICE_URL.replace(/^https?:\/\//, '')}
            </a>
          </div>
        </div>
      </section>

      {installMode && (
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">{t('finish.install.title')}</h2>
          <p>{t('finish.install.body')}</p>
          {installMode === 'prompt' ? (
            <Button
              variant="outline"
              onClick={async () => {
                if (await install()) toast.success(t('finish.install.done'))
              }}
            >
              <Smartphone /> {t('finish.install.button')}
            </Button>
          ) : (
            // Icons match the glyphs Safari shows, so players can spot them.
            <ol className="flex flex-col gap-2 border-[3px] border-border bg-card p-3">
              <li className="flex items-center gap-3">
                <span className="label-mono">1</span> <Share className="size-5 shrink-0" aria-hidden /> {t('finish.install.ios1')}
              </li>
              <li className="flex items-center gap-3">
                <span className="label-mono">2</span> <SquarePlus className="size-5 shrink-0" aria-hidden /> {t('finish.install.ios2')}
              </li>
            </ol>
          )}
        </section>
      )}
    </AppShell>
  )
}
