import { createBrowserRouter, Outlet, redirect, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { isUnlocked } from '@/lib/audio/unlock'
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
      {
        path: '/learn/:group',
        lazy: page(() => import('@/pages/Learn')),
        loader: ({ params }) => {
          const n = Number(params.group)
          if (!Number.isInteger(n) || n < 1 || n > 3) return redirect('/learn/1')
          return requireAudio()
        },
      },
      { path: '/challenge', lazy: page(() => import('@/pages/Challenge')), loader: requireAudio },
      { path: '/finish', lazy: page(() => import('@/pages/Finish')), loader: requireAudio },
      { path: '*', loader: () => redirect('/') },
    ],
  },
])
