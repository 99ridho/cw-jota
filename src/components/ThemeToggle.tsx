import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { usePersisted } from '@/store/session'

export function ThemeToggle() {
  const t = useT()
  const theme = usePersisted((s) => s.theme)
  const setTheme = usePersisted((s) => s.setTheme)
  const dark = theme === 'dark'
  return (
    <Button
      size="icon"
      variant="outline"
      className="size-11"
      aria-label={t('nav.dark')}
      aria-pressed={dark}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
