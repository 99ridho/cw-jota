import { useSyncExternalStore } from 'react'
import { detectInstallMode } from '@/lib/install'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

/**
 * Chrome fires beforeinstallprompt soon after load, long before the Finish screen mounts,
 * so main.tsx calls this once at startup to hold on to the event.
 */
export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    notify()
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

const getMode = () =>
  detectInstallMode({
    standalone:
      installed ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    hasPrompt: deferred !== null,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  })

export function useInstallPrompt() {
  const mode = useSyncExternalStore(subscribe, getMode)
  /** Resolves true when the player accepts the browser's install dialog. */
  const install = async () => {
    const e = deferred
    if (!e) return false
    // A prompt event can only be used once.
    deferred = null
    await e.prompt()
    const { outcome } = await e.userChoice
    notify()
    return outcome === 'accepted'
  }
  return { mode, install }
}
