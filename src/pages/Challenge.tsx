import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, RotateCcw, Timer } from 'lucide-react'
import { AppShell, Sticker } from '@/components/AppShell'
import { Feedback } from '@/components/Feedback'
import { LetterKeypad } from '@/components/LetterKeypad'
import { ScoreChip } from '@/components/ScoreChip'
import { SignalLamp } from '@/components/SignalLamp'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useT } from '@/i18n'
import { blip, vibrate } from '@/lib/audio/engine'
import { awardBadge } from '@/lib/celebrate'
import { multiplier, scoreWord, SPEED_BONUS_WINDOW_S, type WordResult } from '@/lib/morse/scoring'
import { DIGITS, LETTERS, levelChars, pickWords } from '@/lib/morse/levels'
import { cn } from '@/lib/utils'
import { usePlayMorse } from '@/hooks/usePlayMorse'
import { useSession } from '@/store/session'

const QUICK_EARS_S = 8

export default function Challenge() {
  const t = useT()
  const navigate = useNavigate()
  const { challenge, score, streak, startChallenge, recordWord } = useSession()
  const level = useSession((s) => s.level) ?? 'easy'
  const stage = useSession((s) => s.stage)
  const player = usePlayMorse('', 'challenge')

  // Start a fresh round unless one is already in progress.
  useEffect(() => {
    const s = useSession.getState()
    if (!s.challenge.words.length || s.challenge.results.length >= s.challenge.words.length) {
      startChallenge(pickWords(level, stage))
    }
  }, [startChallenge, level, stage])

  const idx = challenge.results.length
  const word = challenge.words[idx]
  const total = challenge.words.length
  // Stage 1 keeps its seven keys in teaching order; bigger sets are easier to scan A to Z.
  const keys = level !== 'easy' ? LETTERS : stage === 1 ? levelChars('easy', 1) : [...levelChars('easy', stage)].sort()
  const [answer, setAnswer] = useState('')
  const [replays, setReplays] = useState(0)
  const [result, setResult] = useState<WordResult | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<number | null>(null)

  // Play each new word; the clock starts when the sound ends.
  useEffect(() => {
    if (!word || result) return
    setAnswer('')
    setReplays(0)
    setElapsed(0)
    startedAt.current = null
    const id = setTimeout(() => {
      void player.play(word).then(() => {
        startedAt.current ??= performance.now()
      })
    }, 500)
    return () => clearTimeout(id)
  }, [word, result])

  useEffect(() => {
    if (result) return
    const id = setInterval(() => {
      if (startedAt.current !== null) setElapsed((performance.now() - startedAt.current) / 1000)
    }, 100)
    return () => clearInterval(id)
  }, [result])

  const submit = (final: string) => {
    if (!word) return
    const seconds = startedAt.current === null ? 0 : (performance.now() - startedAt.current) / 1000
    const r = scoreWord(word, final, replays, seconds, streak)
    const perfect = r.correctLetters === word.length
    setResult(r)
    recordWord(r)
    player.stop()
    if (perfect) {
      blip('good')
      vibrate([30, 30, 30])
      if (word === 'SOS') awardBadge('sos_master')
      if (seconds < QUICK_EARS_S) awardBadge('quick_ears')
    } else {
      blip('bad')
    }
  }

  const type = (c: string) => {
    if (!word || result || answer.length >= word.length) return
    const next = answer + c
    setAnswer(next)
    if (next.length === word.length) setTimeout(() => submit(next), 250)
  }

  // Physical keyboard: the level's characters type, Backspace undoes.
  const typeRef = useRef(type)
  typeRef.current = type
  useEffect(() => {
    const allowed = levelChars(level, stage)
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Backspace') setAnswer((a) => a.slice(0, -1))
      else if (allowed.includes(e.key.toUpperCase())) typeRef.current(e.key.toUpperCase())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [level, stage])

  const replay = () => {
    if (!word) return
    setReplays((n) => n + 1)
    void player.play(word)
  }

  const next = () => {
    setResult(null)
    if (idx >= total) {
      const { results } = useSession.getState().challenge
      if (results.every((r) => r.correctLetters === r.word.length && r.replays === 0)) awardBadge('perfect_round')
      navigate('/finish')
    }
  }

  if (!word && !result) return null
  const shown = result ? result.word : word!
  const perfect = result && result.correctLetters === result.word.length
  const combo = multiplier(streak)

  return (
    <AppShell
      kicker={`${level === 'easy' ? t('stage.n', { n: stage }) : t(`level.${level}`)} · ${t('challenge.word', { n: Math.min(idx + (result ? 0 : 1), total), total })}`}
      right={<ScoreChip score={score} streak={streak} scoreLabel={t('challenge.score')} streakLabel={t('challenge.streak')} />}
    >
      <Progress value={(idx / total) * 100} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t('challenge.title')}</h1>
        {combo > 1 && <Sticker key={combo} className="animate-pop rotate-3 bg-pink">{t('challenge.combo', { m: combo })}</Sticker>}
      </div>

      <div className="brutal flex flex-col items-center gap-5 bg-ink px-4 py-6">
        <SignalLamp on={player.lampOn} active={player.isPlaying} />
        <div className="flex max-w-full gap-2" aria-label={t('challenge.type')}>
          {[...shown].map((ch, i) => {
            const typed = result ? result.answer[i] : answer[i]
            const right = result && typed === ch
            return (
              <span
                key={i}
                className={cn(
                  'flex h-16 w-12 min-w-0 shrink flex-col items-center justify-center border-[3px] border-on-ink font-mono text-3xl font-bold',
                  !result && (typed ? 'animate-pop bg-accent text-ink' : 'text-on-ink/50'),
                  result && (right ? 'bg-secondary text-ink' : 'bg-card text-foreground'),
                )}
              >
                {result ? ch : typed ?? '_'}
                {result && !right && <span className="text-xs text-destructive line-through">{typed ?? '·'}</span>}
              </span>
            )
          })}
        </div>
        {!result && (
          <div className="flex w-full items-center gap-2 text-on-ink">
            <Timer className="size-4 shrink-0" aria-hidden />
            <div className="h-2 flex-1 border border-on-ink">
              <div
                className="h-full bg-lamp transition-[width] duration-100"
                style={{ width: `${Math.max(0, 1 - elapsed / SPEED_BONUS_WINDOW_S) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Feedback kind={result ? (perfect ? 'good' : 'bad') : null}>
        {result && (perfect ? t('challenge.correct', { p: result.points }) : t('challenge.partial', { w: result.word, p: result.points }))}
      </Feedback>

      <div className="mt-auto flex flex-col gap-3">
        {result ? (
          <Button size="xl" onClick={next}>
            {idx >= total ? t('challenge.finish') : t('challenge.next')} <ArrowRight className="size-6" />
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={replay} disabled={player.isPlaying}>
              <RotateCcw /> {player.isPlaying ? t('challenge.listen') : t('challenge.replay')}
            </Button>
            <LetterKeypad
              chars={keys}
              digits={level === 'hard' ? DIGITS : undefined}
              onKey={type}
              onBackspace={() => setAnswer((a) => a.slice(0, -1))}
              backspaceLabel={t('challenge.clear')}
              lettersLabel={t('challenge.keys.letters')}
              digitsLabel={t('challenge.keys.digits')}
            />
          </>
        )}
      </div>
    </AppShell>
  )
}
