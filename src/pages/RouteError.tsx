import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { RotateCcw } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'

const RELOAD_FLAG = 'jota-chunk-reload'

// After a deploy, an open tab still asks for the old build's chunk names.
const isStaleChunk = (e: unknown) =>
  e instanceof Error && /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(e.message)

export default function RouteError() {
  const t = useT()
  const error = useRouteError()
  const stale = isStaleChunk(error)

  useEffect(() => {
    if (!stale) return
    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) return
      sessionStorage.setItem(RELOAD_FLAG, '1')
    } catch {
      return
    }
    // Audio has to be unlocked again anyway, so start over on the new build.
    location.replace('/')
  }, [stale])

  return (
    <AppShell>
      <div className="brutal mt-8 flex flex-col gap-3 bg-card p-5" role="alert">
        <h1 className="text-3xl font-bold">{t('error.title')}</h1>
        <p className="text-lg">{stale ? t('error.update') : t('error.body')}</p>
      </div>
      <Button
        size="lg"
        onClick={() => {
          try {
            sessionStorage.removeItem(RELOAD_FLAG)
          } catch {
            // Storage blocked: the reload still works.
          }
          location.replace('/')
        }}
      >
        <RotateCcw /> {t('error.restart')}
      </Button>
    </AppShell>
  )
}
