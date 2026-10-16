import { MORSE_TABLE } from '@/lib/morse/table'

const INK = '#1a150f'
const PAPER = '#fdf6e9'
const SUN = '#ffc94d'
const ORANGE = '#ee6a33'

/** Draws the name card straight onto a canvas, no DOM screenshotting. */
export async function renderNameCard(name: string, eventLabel: string): Promise<Blob | null> {
  try {
    await Promise.all([document.fonts.load('700 48px "PT Mono"'), document.fonts.load('700 32px "PT Sans"')])
  } catch {
    // Falls back to the system font.
  }
  const letters = [...name].filter((c) => MORSE_TABLE[c])
  const W = 1080
  const rowH = 120
  const H = Math.max(1080, 360 + letters.length * rowH + 120)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(31,26,20,0.12)'
  for (let y = 18; y < H; y += 36) for (let x = 18; x < W; x += 36) ctx.fillRect(x, y, 3, 3)

  const pad = 60
  ctx.fillStyle = INK
  ctx.fillRect(pad + 16, pad + 16, W - pad * 2, H - pad * 2)
  ctx.fillStyle = SUN
  ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2)
  ctx.lineWidth = 8
  ctx.strokeStyle = INK
  ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2)

  ctx.fillStyle = INK
  ctx.font = '700 34px "PT Mono", monospace'
  ctx.fillText(eventLabel.toUpperCase(), pad + 48, pad + 80)
  ctx.font = '700 72px "PT Sans", sans-serif'
  ctx.fillText(name, pad + 48, pad + 180)

  let y = pad + 240
  for (const ch of letters) {
    const p = MORSE_TABLE[ch]!
    ctx.fillStyle = PAPER
    ctx.fillRect(pad + 48, y, W - pad * 2 - 96, rowH - 20)
    ctx.strokeRect(pad + 48, y, W - pad * 2 - 96, rowH - 20)
    ctx.fillStyle = INK
    ctx.font = '700 60px "PT Mono", monospace'
    ctx.fillText(ch, pad + 80, y + 72)
    let x = pad + 200
    for (const el of p) {
      const w = el === '.' ? 40 : 120
      ctx.fillStyle = el === '.' ? ORANGE : INK
      if (el === '.') {
        ctx.beginPath()
        ctx.arc(x + 20, y + 50, 20, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      } else {
        ctx.fillRect(x, y + 30, w, 40)
      }
      x += w + 28
    }
    y += rowH
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

export async function shareOrDownload(blob: Blob, filename: string, title: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title })
      return 'shared'
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'shared'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}
