import { describe, expect, it } from 'vitest'
import { detectInstallMode, type InstallEnv } from './install'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1'
const IPAD_DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'

const env = (o: Partial<InstallEnv>): InstallEnv => ({
  standalone: false,
  hasPrompt: false,
  userAgent: ANDROID_CHROME,
  platform: 'Linux armv8l',
  maxTouchPoints: 5,
  ...o,
})

describe('detectInstallMode', () => {
  it('offers the browser prompt when one is waiting', () => {
    expect(detectInstallMode(env({ hasPrompt: true }))).toBe('prompt')
  })

  it('offers nothing once installed', () => {
    expect(detectInstallMode(env({ hasPrompt: true, standalone: true }))).toBeNull()
    expect(detectInstallMode(env({ userAgent: IPHONE_SAFARI, platform: 'iPhone', standalone: true }))).toBeNull()
  })

  it('shows the Share hint on iPhone Safari', () => {
    expect(detectInstallMode(env({ userAgent: IPHONE_SAFARI, platform: 'iPhone' }))).toBe('ios')
  })

  it('shows the Share hint on an iPad that reports a Mac', () => {
    expect(detectInstallMode(env({ userAgent: IPAD_DESKTOP_UA, platform: 'MacIntel', maxTouchPoints: 5 }))).toBe('ios')
  })

  it('skips Chrome on iPhone', () => {
    expect(detectInstallMode(env({ userAgent: IPHONE_CHROME, platform: 'iPhone' }))).toBeNull()
  })

  it('skips desktop Safari and browsers without a prompt', () => {
    expect(detectInstallMode(env({ userAgent: IPAD_DESKTOP_UA, platform: 'MacIntel', maxTouchPoints: 0 }))).toBeNull()
    expect(detectInstallMode(env({}))).toBeNull()
  })
})
