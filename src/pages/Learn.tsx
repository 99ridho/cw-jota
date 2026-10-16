import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowRight, Check, Ear, Flame, RotateCcw, Volume2 } from 'lucide-react'
import { AppShell, Sticker } from '@/components/AppShell'
import { Feedback } from '@/components/Feedback'
import { PatternGlyph } from '@/components/PatternGlyph'
import { SignalLamp } from '@/components/SignalLamp'
import { StepBar } from '@/components/StepBar'
import { TapPad } from '@/components/TapPad'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useT } from '@/i18n'
import { blip, vibrate } from '@/lib/audio/engine'
import { awardBadge } from '@/lib/celebrate'
import { DRILL_LENGTH, learnedThrough, makeDrill, packChars, PASS_MARK, sendTargets, type DrillQuestion } from '@/lib/morse/drill'
import { LETTERS } from '@/lib/morse/levels'
import { MORSE_TABLE, prettyPattern, rhythm, STAGES, type MorseChar } from '@/lib/morse/table'
import { cn } from '@/lib/utils'
import { usePlayMorse } from '@/hooks/usePlayMorse'
import { useSendInput, type SendResult } from '@/hooks/useSendInput'
import { DIT_MAX_U } from '@/lib/morse/classifier'
import { useSession } from '@/store/session'

type Step = 'meet' | 'decode' | 'send' | 'done'
const STEP_INDEX: Record<Step, number> = { meet: 0, decode: 1, send: 2, done: 3 }
const CARD_COLORS = ['bg-accent', 'bg-info', 'bg-pink']

export default function Learn() {
  const params = useParams()
  const stage = Number(params.stage)
  const pack = Number(params.pack)
  return <LearnPack key={`${stage}-${pack}`} stage={stage} pack={pack} />
}

function LearnPack({ stage, pack }: { stage: number; pack: number }) {
  const t = useT()
  const [step, setStep] = useState<Step>('meet')
  const [streak, setStreak] = useState(0)
  const chars = packChars(stage, pack)

  return (
    <AppShell
      kicker={t('learn.group', { s: stage, n: pack, total: STAGES[stage - 1]!.length })}
      right={
        streak > 1 && (
          <span key={streak} className="brutal flex animate-pop items-center gap-1 bg-pink px-2 py-1 font-mono text-sm font-bold">
            <Flame className="size-4" /> {streak}
          </span>
        )
      }
    >
      <StepBar steps={[t('learn.step.meet'), t('learn.step.decode'), t('learn.step.send')]} current={STEP_INDEX[step]} />
      {step === 'meet' && <Meet chars={chars} onDone={() => setStep('decode')} />}
      {step === 'decode' && <Decode stage={stage} pack={pack} setStreak={setStreak} onDone={() => setStep('send')} />}
      {step === 'send' && <Send stage={stage} pack={pack} setStreak={setStreak} onDone={() => setStep('done')} />}
      {step === 'done' && <Done stage={stage} pack={pack} chars={chars} />}
    </AppShell>
  )
}

function Meet({ chars, onDone }: { chars: MorseChar[]; onDone: () => void }) {
  const t = useT()
  const player = usePlayMorse()
  const [heard, setHeard] = useState<Set<MorseChar>>(new Set())
  const [playing, setPlaying] = useState<MorseChar | null>(null)

  const hear = (c: MorseChar) => {
    setPlaying(c)
    setHeard((h) => new Set(h).add(c))
    void player.play(c).then(() => setPlaying(null))
  }

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold">{t('learn.meet.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('learn.meet.tap')}</p>
      </div>
      <div className="flex flex-col gap-4">
        {chars.map((c, i) => {
          const p = MORSE_TABLE[c]!
          const active = playing === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => hear(c)}
              className={cn(
                'brutal press relative flex items-center gap-4 p-4 text-left',
                CARD_COLORS[i % CARD_COLORS.length],
                i % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]',
              )}
            >
              <span className="flex size-20 shrink-0 items-center justify-center border-[3px] border-border bg-card font-mono text-5xl font-bold">
                {c}
              </span>
              <span className="flex flex-col gap-2">
                <PatternGlyph pattern={p} activeEl={active ? player.activeEl : -1} />
                <span className="font-mono text-xl font-bold tracking-wide">{rhythm(p)}</span>
              </span>
              <span className="absolute top-2 right-2">
                {heard.has(c) ? <Check className="size-6" aria-label="✓" /> : <Volume2 className="size-6" aria-hidden />}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-auto flex items-center gap-4">
        <SignalLamp on={player.lampOn} active={player.isPlaying} size="sm" />
        <Button size="lg" className="flex-1" onClick={onDone} disabled={heard.size < chars.length}>
          {t('learn.meet.go')} <ArrowRight />
        </Button>
      </div>
    </>
  )
}

function Decode({
  stage,
  pack,
  setStreak,
  onDone,
}: {
  stage: number
  pack: number
  setStreak: React.Dispatch<React.SetStateAction<number>>
  onDone: () => void
}) {
  const t = useT()
  const player = usePlayMorse()
  const [attempt, setAttempt] = useState(1)
  const [queue, setQueue] = useState<DrillQuestion[]>(() => makeDrill(stage, pack))
  const [pos, setPos] = useState(0)
  const [firstTry, setFirstTry] = useState(0)
  const [wrong, setWrong] = useState<MorseChar[]>([])
  const [lastWrong, setLastWrong] = useState(false)
  const [solved, setSolved] = useState(false)
  const [finished, setFinished] = useState(false)
  const hints = attempt >= 2
  const q = queue[pos]

  useEffect(() => {
    if (!q || finished) return
    const id = setTimeout(() => void player.play(q.target), 600)
    return () => clearTimeout(id)
  }, [pos, attempt, finished])

  const advance = () => {
    setWrong([])
    setLastWrong(false)
    setSolved(false)
    if (pos + 1 >= queue.length) setFinished(true)
    else setPos((p) => p + 1)
  }

  const pick = (c: MorseChar) => {
    if (!q || solved || wrong.includes(c)) return
    if (c === q.target) {
      setSolved(true)
      setLastWrong(false)
      blip('good')
      vibrate(30)
      // Only a first-try answer scores; after a miss the right pick just moves on.
      if (wrong.length === 0) {
        setStreak((s) => s + 1)
        setFirstTry((n) => n + 1)
      }
      setTimeout(advance, 1800)
    } else {
      blip('bad')
      setStreak(0)
      setWrong((w) => [...w, c])
      setLastWrong(true)
      setTimeout(() => void player.play(q.target), 450)
    }
  }

  if (finished) {
    const passed = firstTry >= PASS_MARK || attempt >= 2
    return (
      <div className="flex flex-1 flex-col gap-5">
        <div className={cn('brutal flex animate-pop flex-col items-center gap-3 p-6 text-center', passed ? 'bg-secondary' : 'bg-accent')}>
          <Ear className="size-12" aria-hidden />
          <p className="font-mono text-5xl font-bold">
            {firstTry}/{DRILL_LENGTH}
          </p>
          <p className="text-xl font-bold" aria-live="polite">
            {passed ? t('learn.decode.pass', { n: firstTry, total: DRILL_LENGTH }) : t('learn.decode.retry', { n: firstTry, total: DRILL_LENGTH })}
          </p>
          {!passed && <p>{t('learn.decode.hintRound')}</p>}
        </div>
        <div className="mt-auto">
          {passed ? (
            <Button size="xl" className="w-full" onClick={onDone}>
              {t('learn.decode.next')} <ArrowRight className="size-6" />
            </Button>
          ) : (
            <Button
              size="xl"
              variant="accent"
              className="w-full"
              onClick={() => {
                setAttempt(2)
                setQueue(makeDrill(stage, pack))
                setPos(0)
                setFirstTry(0)
                setFinished(false)
              }}
            >
              <RotateCcw /> {t('learn.decode.again')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!q) return null
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="label-mono">{t('learn.decode.q', { n: pos + 1, total: queue.length })}</span>
          {hints && <Sticker className="rotate-2 bg-info text-xs">hint</Sticker>}
        </div>
        <Progress value={(pos / queue.length) * 100} />
      </div>
      <h1 className="text-3xl font-bold">{t('learn.decode.title')}</h1>
      <div className="flex items-center justify-center gap-5 py-2">
        <SignalLamp on={player.lampOn} active={player.isPlaying} />
        <Button variant="outline" onClick={() => void player.play(q.target)} disabled={player.isPlaying || solved}>
          <RotateCcw /> {t('learn.decode.replay')}
        </Button>
      </div>
      <div className={'grid grid-cols-2 gap-3'}>
        {q.options.map((c) => {
          const missed = wrong.includes(c)
          const isTarget = solved && c === q.target
          return (
            <button
              key={c}
              type="button"
              onClick={() => pick(c)}
              disabled={solved || missed}
              className={cn(
                'brutal press flex min-h-28 flex-col items-center justify-center gap-2 font-mono text-5xl font-bold disabled:cursor-default',
                !solved && !missed && 'bg-card hover:bg-accent',
                isTarget && 'bg-secondary',
                missed && 'animate-shake bg-card line-through decoration-destructive decoration-4 opacity-60',
                solved && !isTarget && !missed && 'bg-card opacity-50',
              )}
            >
              {c}
              {(hints || isTarget) && <PatternGlyph pattern={MORSE_TABLE[c]!} size="sm" />}
            </button>
          )
        })}
      </div>
      <Feedback kind={solved ? 'good' : lastWrong ? 'bad' : null}>
        {solved
          ? wrong.length === 0
            ? t('learn.decode.correct', { c: q.target })
            : t('learn.decode.gotIt', { c: q.target })
          : lastWrong && t('learn.decode.wrong')}
      </Feedback>
    </>
  )
}

function Send({
  stage,
  pack,
  setStreak,
  onDone,
}: {
  stage: number
  pack: number
  setStreak: React.Dispatch<React.SetStateAction<number>>
  onDone: () => void
}) {
  const t = useT()
  const player = usePlayMorse()
  const targets = useRef(sendTargets(stage, pack)).current
  const [idx, setIdx] = useState(0)
  const [result, setResult] = useState<{ ok: boolean; got: string } | null>(null)
  const target = targets[idx]!
  const p = MORSE_TABLE[target]!

  const onCommit = async ({ pattern: sent, ok }: SendResult) => {
    if (result) return
    setResult({ ok, got: sent })
    if (ok) {
      blip('good')
      vibrate(30)
      setStreak((s) => s + 1)
      awardBadge('first_signal')
      setTimeout(() => {
        setResult(null)
        if (idx + 1 >= targets.length) onDone()
        else setIdx((i) => i + 1)
      }, 900)
    } else {
      blip('bad')
      setStreak(0)
      await new Promise((r) => setTimeout(r, 400))
      await player.play(target)
      setResult(null)
    }
  }

  const { handlers, buffer, matched, pressed, unit } = useSendInput({ onCommit, enabled: !player.isPlaying && !result, target: p })
  const holding = pressed && buffer.length < p.length ? buffer.length : -1
  // A dit fills in one unit; a dah fills when the press is long enough to count as one.
  const fillMs = p[holding] === '-' ? DIT_MAX_U * unit : unit

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="label-mono">{t('learn.send.progress', { n: idx, total: targets.length })}</span>
        <Progress value={(idx / targets.length) * 100} />
      </div>
      <div className="brutal flex items-center gap-4 bg-card p-4">
        <div className="flex flex-col items-center">
          <span className="label-mono">{t('learn.send.target')}</span>
          <span key={idx} className="animate-pop font-mono text-7xl font-bold">
            {target}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-start gap-3">
          <PatternGlyph
            pattern={p}
            accepted={result?.ok ? [...p].map(() => true) : matched}
            filling={holding}
            fillMs={fillMs}
            activeEl={player.isPlaying ? player.activeEl : -1}
            size="lg"
          />
          <span className="font-mono text-lg font-bold">{rhythm(p)}</span>
        </div>
        <Button size="icon" variant="outline" aria-label={t('learn.decode.replay')} onClick={() => void player.play(target)} disabled={player.isPlaying}>
          <Volume2 />
        </Button>
      </div>
      <Feedback kind={result ? (result.ok ? 'good' : 'bad') : null}>
        {result && (result.ok ? t('learn.send.correct') : t('learn.send.wrong', { got: prettyPattern(result.got) }))}
      </Feedback>
      <p className="text-center text-sm font-bold text-muted-foreground">{t('learn.send.tapHint')}</p>
      <TapPad
        handlers={handlers}
        pressed={pressed}
        buffer={buffer}
        label={t('learn.send.pad')}
        heardLabel={t('learn.send.heard')}
        className="mt-auto"
      />
    </>
  )
}

function Done({ stage, pack, chars }: { stage: number; pack: number; chars: MorseChar[] }) {
  const t = useT()
  const navigate = useNavigate()
  const completePack = useSession((s) => s.completePack)
  const setStage = useSession((s) => s.setStage)
  const last = pack >= STAGES[stage - 1]!.length
  const known = learnedThrough(stage, pack)

  useEffect(() => {
    completePack(stage, pack)
    setStage(stage)
    blip('fanfare')
    if (last && stage === 1) awardBadge('all_seven')
    if (last && stage === STAGES.length) awardBadge('a_to_z')
  }, [stage, pack, last, completePack, setStage])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="brutal relative flex animate-pop flex-col items-center gap-4 bg-secondary px-4 py-8 text-center">
        <Sticker className="absolute -top-4 -right-2 rotate-6 bg-pink">+{chars.length}</Sticker>
        <p className="text-4xl font-bold">{t('learn.send.done')}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {known.map((c, i) => (
            <span
              key={c}
              className={cn(
                'flex size-12 items-center justify-center border-[3px] border-border font-mono text-2xl font-bold',
                chars.includes(c) ? 'bg-accent' : 'bg-card',
              )}
              style={{ rotate: `${(i % 2 ? 1 : -1) * 3}deg` }}
            >
              {c}
            </span>
          ))}
        </div>
        <p className="font-mono font-bold">
          {known.length} / {LETTERS.length}
        </p>
      </div>
      <div className="mt-auto">
        <Button size="xl" className="w-full" onClick={() => navigate(last ? '/challenge' : `/learn/${stage}/${pack + 1}`)}>
          {last ? t('learn.toChallenge') : t('learn.next')} <ArrowRight className="size-6" />
        </Button>
      </div>
    </div>
  )
}
