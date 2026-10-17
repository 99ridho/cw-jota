export type InstallMode = 'prompt' | 'ios' | null

export interface InstallEnv {
  standalone: boolean
  hasPrompt: boolean
  userAgent: string
  platform: string
  maxTouchPoints: number
}

/** How this browser can add the app to the home screen, or null if it can't (or already did). */
export function detectInstallMode(env: InstallEnv): InstallMode {
  if (env.standalone) return null
  if (env.hasPrompt) return 'prompt'
  // iPadOS reports itself as a Mac; touch points give it away.
  const ios = /iPhone|iPad|iPod/.test(env.userAgent) || (env.platform === 'MacIntel' && env.maxTouchPoints > 1)
  // Only Safari offers Add to Home Screen on older iOS, so skip Chrome, Firefox, Edge, and in-app browsers.
  const safari = /Safari/.test(env.userAgent) && !/CriOS|FxiOS|EdgiOS|FBAN|FBAV|Instagram|Line\//.test(env.userAgent)
  return ios && safari ? 'ios' : null
}
