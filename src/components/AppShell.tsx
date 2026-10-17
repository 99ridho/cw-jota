import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'

interface Props {
  kicker?: ReactNode
  right?: ReactNode
  /** Show the back button. Off on Welcome, the first screen. */
  back?: boolean
  children: ReactNode
  className?: string
}

export function AppShell({ kicker, right, back = true, children, className }: Props) {
  const t = useT()
  const navigate = useNavigate()
  // react-router stores the history index; 0 means this tab opened on this page.
  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="mb-4 flex min-h-11 items-center gap-2">
        {back && (
          <Button size="icon" variant="ghost" className="-ml-2 size-11" aria-label={t('nav.back')} onClick={goBack}>
            <ArrowLeft className="size-6" />
          </Button>
        )}
        <div className="label-mono min-w-0 flex-1">{kicker}</div>
        {right}
        <ThemeToggle />
      </header>
      <main className={cn('flex flex-1 flex-col gap-5', className)}>{children}</main>
      <footer className="mt-6 text-center text-xs text-muted-foreground">Crafted by YC3BBD (also K1DHO &amp; @99ridho)</footer>
    </div>
  )
}

export function Sticker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('brutal inline-block -rotate-3 bg-accent px-2.5 py-1 font-mono text-sm font-bold uppercase text-ink', className)}>
      {children}
    </span>
  )
}
