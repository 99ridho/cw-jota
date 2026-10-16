import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  kicker?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
}

export function AppShell({ kicker, right, children, className }: Props) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {(kicker || right) && (
        <header className="mb-4 flex min-h-10 items-center justify-between gap-3">
          <div className="label-mono">{kicker}</div>
          <div>{right}</div>
        </header>
      )}
      <main className={cn('flex flex-1 flex-col gap-5', className)}>{children}</main>
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
