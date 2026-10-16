let ctx: AudioContext | null = null
let unlocked = false
let silentEl: HTMLAudioElement | null = null

// A tiny silent WAV on loop puts iOS on the media channel, which ignores the ringer switch.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA'

export function getContext(): AudioContext | null {
  return ctx
}

export function isUnlocked(): boolean {
  return unlocked && ctx !== null
}

/** Must be called synchronously inside a user gesture handler. */
export async function unlockAudio(): Promise<AudioContext | null> {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'playback'
  } catch {
    // Not supported.
  }
  try {
    if (!silentEl) {
      silentEl = new Audio(SILENT_WAV)
      silentEl.loop = true
      silentEl.setAttribute('playsinline', '')
    }
    void silentEl.play().catch(() => {})
  } catch {
    // Fallback is best-effort only.
  }
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) {
        unlocked = true
        return null
      }
      ctx = new Ctor()
    }
    if (ctx.state !== 'running') await ctx.resume()
  } catch {
    // Audio unavailable: the game stays playable with visuals only.
  }
  unlocked = true
  return ctx
}
