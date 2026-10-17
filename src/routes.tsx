import { Outlet, redirect, ScrollRestoration, type Params, type RouteObject } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { isUnlocked } from '@/lib/audio/unlock'
import { STAGES } from '@/lib/morse/table'
import { useSession } from '@/store/session'
import Welcome from '@/pages/Welcome'
import RouteError from '@/pages/RouteError'

// Later screens load as separate chunks to keep first paint light.
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
})

// Audio can only be unlocked by a gesture on Welcome, so deep links and
// reloads bounce back there.
const requireAudio = () => (isUnlocked() ? null : redirect('/'))

/** Where the header's Back goes: one level up the flow, not back in history (ADR-020). */
export type RouteHandle = { parent: (params: Params) => string }
const parent = (to: string | ((params: Params) => string)): RouteHandle => ({ parent: typeof to === 'string' ? () => to : to })
// Challenge and Finish belong to the Easy stage being played, or to the level picker.
const levelParent = parent(() => {
  const { level, stage } = useSession.getState()
  return level === 'easy' ? `/stage/${stage}` : '/level'
})

function Root() {
  return (
    <>
      <Outlet />
      <Toaster />
      <ScrollRestoration />
    </>
  )
}

export const routes: RouteObject[] = [
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Welcome /> },
      { path: '/hook', lazy: page(() => import('@/pages/Hook')), loader: requireAudio, handle: parent('/') },
      { path: '/level', lazy: page(() => import('@/pages/Level')), loader: requireAudio, handle: parent('/') },
      { path: '/stage', lazy: page(() => import('@/pages/Stage')), loader: requireAudio, handle: parent('/level') },
      {
        path: '/stage/:stage',
        lazy: page(() => import('@/pages/Packs')),
        handle: parent('/stage'),
        loader: ({ params }) => {
          const s = Number(params.stage)
          if (!Number.isInteger(s) || s < 1 || s > STAGES.length) return redirect('/stage')
          return requireAudio()
        },
      },
      {
        path: '/learn/:stage/recap',
        lazy: page(() => import('@/pages/Recap')),
        handle: parent(({ stage }) => `/stage/${stage}`),
        loader: ({ params }) => {
          const s = Number(params.stage)
          if (!Number.isInteger(s) || s < 2 || s > STAGES.length) return redirect('/stage')
          return requireAudio()
        },
      },
      {
        path: '/learn/:stage/:pack',
        lazy: page(() => import('@/pages/Learn')),
        handle: parent(({ stage }) => `/stage/${stage}`),
        loader: ({ params }) => {
          const s = Number(params.stage)
          const p = Number(params.pack)
          if (!Number.isInteger(s) || !Number.isInteger(p) || !STAGES[s - 1]?.[p - 1]) return redirect('/stage')
          return requireAudio()
        },
      },
      { path: '/challenge', lazy: page(() => import('@/pages/Challenge')), loader: requireAudio, handle: levelParent },
      { path: '/finish', lazy: page(() => import('@/pages/Finish')), loader: requireAudio, handle: levelParent },
      { path: '*', loader: () => redirect('/') },
    ],
  },
]
