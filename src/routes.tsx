import { createBrowserRouter, Outlet, redirect, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { isUnlocked } from '@/lib/audio/unlock'
import { STAGES } from '@/lib/morse/table'
import Welcome from '@/pages/Welcome'
import RouteError from '@/pages/RouteError'

// Later screens load as separate chunks to keep first paint light.
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
})

// Audio can only be unlocked by a gesture on Welcome, so deep links and
// reloads bounce back there.
const requireAudio = () => (isUnlocked() ? null : redirect('/'))

function Root() {
  return (
    <>
      <Outlet />
      <Toaster />
      <ScrollRestoration />
    </>
  )
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Welcome /> },
      { path: '/hook', lazy: page(() => import('@/pages/Hook')), loader: requireAudio },
      { path: '/level', lazy: page(() => import('@/pages/Level')), loader: requireAudio },
      { path: '/stage', lazy: page(() => import('@/pages/Stage')), loader: requireAudio },
      {
        path: '/stage/:stage',
        lazy: page(() => import('@/pages/Packs')),
        loader: ({ params }) => {
          const s = Number(params.stage)
          if (!Number.isInteger(s) || s < 1 || s > STAGES.length) return redirect('/stage')
          return requireAudio()
        },
      },
      {
        path: '/learn/:stage/recap',
        lazy: page(() => import('@/pages/Recap')),
        loader: ({ params }) => {
          const s = Number(params.stage)
          if (!Number.isInteger(s) || s < 2 || s > STAGES.length) return redirect('/stage')
          return requireAudio()
        },
      },
      {
        path: '/learn/:stage/:pack',
        lazy: page(() => import('@/pages/Learn')),
        loader: ({ params }) => {
          const s = Number(params.stage)
          const p = Number(params.pack)
          if (!Number.isInteger(s) || !Number.isInteger(p) || !STAGES[s - 1]?.[p - 1]) return redirect('/stage')
          return requireAudio()
        },
      },
      { path: '/challenge', lazy: page(() => import('@/pages/Challenge')), loader: requireAudio },
      { path: '/finish', lazy: page(() => import('@/pages/Finish')), loader: requireAudio },
      { path: '*', loader: () => redirect('/') },
    ],
  },
])
