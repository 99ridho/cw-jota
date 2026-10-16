import { toast } from 'sonner'
import { translate } from '@/i18n'
import { blip, vibrate } from '@/lib/audio/engine'
import type { BadgeId } from '@/lib/badges'
import { usePersisted, useSession } from '@/store/session'

/** Awards a badge; on first unlock plays a fanfare and shows a toast. */
export function awardBadge(id: BadgeId) {
  useSession.getState().noteBadge(id)
  const fresh = usePersisted.getState().awardBadge(id)
  if (!fresh) return
  const lang = usePersisted.getState().lang
  const name = translate(lang, `badge.${id}.name`)
  blip('fanfare')
  vibrate([40, 40, 80])
  toast.success(translate(lang, 'common.badgeEarned', { b: name }))
}
