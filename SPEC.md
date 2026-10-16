# Morse Mini-Game: Technical Spec (JOTA Edition)

Status: Draft v1
Owner: Ridho
Scope: one-off event web app for the Jamboree On The Air (JOTA) station. A first-timer learns 7 Morse characters, sends and decodes them, and leaves with a shareable card and a pointer to the live station.

---

## 1. Goals and non-goals

### Goals
- A first-timer hears, decodes and sends Morse within 5 minutes with no outside instructions.
- A full session takes 10 to 15 minutes and ends with a clear payoff (badges, personal best, name-in-Morse card).
- Works on the player's own phone, scanned from a QR code, with no install and no account.
- Bilingual: Indonesian and English.
- Fully static: no backend, no accounts, no data leaves the device.

### Non-goals (v1)
- Leaderboard, multiplayer, relay or team modes
- Hardware key (USB or paddle) or rig integration
- Full alphabet or numbers curriculum
- Speeds above about 20 WPM
- User accounts, server-side analytics

---

## 2. Stack

| Concern | Choice |
|---|---|
| Build | Vite + TypeScript (strict) |
| UI | React 18+ |
| Routing | React Router (library mode, `createBrowserRouter`) |
| Styling | Tailwind CSS |
| Components | shadcn/ui (Radix primitives) |
| State | Zustand with a safe persist wrapper (small, no provider boilerplate) |
| Audio | Web Audio API (synthesized tone, no audio files) |
| PWA | `vite-plugin-pwa` (Workbox `generateSW`, precache everything) |
| QR code | `qrcode.react` |
| Image export | Canvas API (hand-drawn card) or `html-to-image` |
| Tests | Vitest for pure logic; manual device matrix for audio and touch |
| Hosting | Any static host with SPA fallback (Cloudflare Pages, Netlify). If the host has no fallback, switch to `createHashRouter` |

shadcn components used: `Button`, `Card`, `Progress`, `Dialog`, `ToggleGroup`, `Input`, `Badge`, `Sonner` (toasts).
Custom components: `TapPad`, `SignalLamp`, `PatternGlyph`, `LetterKeypad`, `NameCard`.

---

## 3. Player flow and routes

```
/            Welcome: language, sound check, Start
/hook        Mystery message plays, then reveal
/learn/1     Group 1: E, T
/learn/2     Group 2: A, N
/learn/3     Group 3: S, O, M
/challenge   Mystery Word challenge (5 words)
/finish      Score, badges, name card, station and practice links
```

Each `/learn/:group` page has three internal steps: **Meet** → **Decode drill** → **Send drill**. Splitting practice across groups keeps every minute interactive and gives a first "I sent it" win within the first few minutes.

Time budget: Hook 1 min, three learn groups about 3 min each, Challenge 3 min, Finish 1 min.

**Route guard:** every route except `/` has a loader that redirects to `/` if the audio context has not been unlocked in this page load. A reload on a deep route therefore returns to the Start screen, which is the only place a user gesture can unlock audio.

---

## 4. Domain model

```ts
export type MorseChar = 'E' | 'T' | 'A' | 'N' | 'S' | 'O' | 'M';
export type Element = '.' | '-';

// Full A-Z and 0-9 table exists only to render the name-in-Morse card.
// Only the 7 MorseChars above are ever played, taught, or scored.
export const MORSE_TABLE: Record<string, string>; // e.g. A: '.-'

export const GROUPS: MorseChar[][] = [['E','T'], ['A','N'], ['S','O','M']];

export type BadgeId =
  | 'first_signal'    // first correct Send
  | 'sos_master'      // SOS solved in the challenge
  | 'all_seven'       // all 3 groups completed
  | 'perfect_round'   // challenge with 0 misses and 0 replays
  | 'quick_ears'      // any word solved under 8 s
  | 'name_in_morse';  // name card generated

// Persisted (localStorage, versioned)
export interface Persisted {
  v: 1;
  lang: 'en' | 'id';
  nickname?: string;
  bestScore: number;
  badges: BadgeId[];
}

// In-memory only, reset on reload
export interface Session {
  audioUnlocked: boolean;
  groupIndex: number;
  score: number;
  streak: number;
  challenge: { words: string[]; results: WordResult[] };
}
```

Persisted data is only language, optional nickname, best score and badges. Nothing is transmitted.

---

## 5. Audio engine (`lib/audio`)

### 5.1 Unlock and iOS quirks
- One shared `AudioContext`, created and `resume()`d inside the Welcome "Tap to start" handler.
- iOS Safari mutes Web Audio when the ringer switch is off. Mitigations:
  - Set `navigator.audioSession.type = 'playback'` where supported.
  - Fallback: play a looping silent `<audio>` element on the same gesture.
  - Always show a "Turn on sound / use earbuds" notice and a **Test tone** button on Welcome.
- The game must remain playable muted (see 7.4).

### 5.2 Tone synthesis
- One `OscillatorNode` (sine, default 650 Hz) into a `GainNode` into the destination.
- Each element is an envelope on the gain node: 5 ms linear attack and release to avoid clicks.
- **Scheduling uses `audioCtx.currentTime`, never `setTimeout`.** Whole characters or words are scheduled ahead in one call, so timing stays accurate under main-thread load on low-end phones.

### 5.3 Timing (PARIS standard with Farnsworth)
- Character speed `c` = 18 WPM (configurable). Dit = `1.2 / c` seconds. Dah = 3 dits. Intra-character gap = 1 dit.
- Overall speed `s` = 8 WPM for learning (configurable). Farnsworth delay unit:

```
ta = (60*c - 37.2*s) / (19 * c * s)   // seconds
char_gap = 3 * ta
word_gap = 7 * ta
```

  When `s == c`, `ta` equals one dit (sanity check, included as a unit test).
- Presets in `config.ts`: `learn` (c=18, s=8), `challenge` (c=18, s=8). Challenge words keep 18 WPM letters with wide letter gaps (ADR-005).

### 5.4 Visual sync
- The visual timeline is derived from the same schedule as the audio. A `requestAnimationFrame` loop compares `audioCtx.currentTime` against the scheduled events to drive `SignalLamp` and `PatternGlyph`, so the two cannot drift apart.
- `usePlayMorse(text, preset)` returns `{ play, stop, isPlaying, activeIndex }`.

---

## 6. Send input (`hooks/useSendInput`)

### 6.1 Inputs
- `TapPad`: large pad filling the lower half of the screen. Pointer events, `touch-action: none`, `setPointerCapture`, ignores multi-touch and context menu.
- Keyboard fallback for desktop testing: Space (`keydown` with `repeat` ignored, and `keyup`).
- Sidetone starts on `pointerdown` and stops on `pointerup`, with the same 5 ms envelope.

### 6.2 Dit and dah classification (adaptive)
```
unit u        initial 150 ms (about 8 WPM), clamped 80..300 ms
press d < 2u  -> dit, else dah (shown in the live buffer)
after a clear dit   u = 0.7*u + 0.3*d
after a clear dah   u = 0.7*u + 0.3*(d/3)
```
- **Forgiving match (ADR-004):** when the target is known (Send drill), a press counts as a dit if `d <= 2.6u` and as a dah if `d >= 1.4u`. Presses between `1.4u` and `2.6u` match either, and they do not adapt the unit.
- A character commits after an idle gap of `max(800 ms, 5u)`, after 5 elements, or as soon as it has as many elements as the target.
- **Fill cue:** while the key is held, the target's next element fills with the lamp color: a dit in `u`, a dah in `1.4u` (the point where it counts as a dah).
- The live buffer is shown as it is typed (for example `· – ·`) so the player always sees what the app heard.

### 6.3 Feedback
- Correct: green lamp, a short positive sound, a points toast.
- Wrong: show what was sent next to the target, replay the target at learn speed, and let the player retry. There is no fail state and no lives.

---

## 7. Screens

### 7.1 Welcome (`/`)
- Language `ToggleGroup` (ID / EN), default from `navigator.language` (starts with `id` means Indonesian).
- Sound notice, **Test tone** button, and the primary **Tap to start** button.

### 7.2 Hook (`/hook`)
- Copy: "Something is calling you…". The mystery message plays with the `SignalLamp` blinking and the pattern shown as dits and dahs.
- Tap to reveal the decoded text. The message comes from `config.HOOK_MESSAGE` (for example `JOTA`), since the hook comes before any learning.
- Replay button, then Next.

### 7.3 Learn group (`/learn/:group`)
1. **Meet:** a card per character with the glyph, the pattern, and tap-to-hear. The pattern is explained by rhythm ("di-dah"), not by chart.
2. **Decode drill:** 6 questions per group. Options: 2 (group 1), 3 (group 2), 4 (group 3, including previously learned characters). A wrong pick strikes that option out and replays the sound, and the player keeps picking on the same question. Only a first-try answer scores; a correct pick after a miss moves on with no mark. After a correct pick the next question comes about 1.8 s later (ADR-003).
3. **Send drill:** the target character is shown with its pattern (guided). The player taps it out. Two correct sends per character complete the step.
- **Unlock rule:** 5 of 6 correct in the drill, or 2 drill attempts. After two attempts the pattern is shown as a hint, so nobody gets stuck at an event. There are no dead ends.

### 7.4 Challenge (`/challenge`)
- 5 mystery words from the learned set. Each is played, and the player enters it on `LetterKeypad` (7 keys only). Replay is unlimited at a small score cost.
- Words are drawn from `words.ts`, a curated list validated by a unit test so every word uses only the 7 characters. Examples: `SOS, SEA, NOTE, STONE, MEAT, TEAM, NAME, MOON, ONSET, MEAN`. One word is always `SOS` (earns `sos_master`).
- Score, per word: 100 per correct letter, plus up to 50 speed bonus, minus 10 per replay. Streak multiplier up to 2x. Personal best is saved to local storage.

### 7.5 Finish (`/finish`)
- Final score vs personal best, earned badges, and a retry button.
- **Name in Morse:** optional nickname input (local only), rendered as a card (letters, dits and dahs) with a play button. Export as PNG via the Web Share API with files, falling back to download.
- Station block: callsign and "come try it live" text from config, plus a QR code to the practice app (LCWO or similar).

---

## 8. Cross-cutting requirements

### 8.1 i18n
- Typed dictionaries `i18n/en.ts` and `i18n/id.ts`, a `useT()` hook, and a compile-time check that both have identical keys. No i18n library (around 60 strings).
- All copy is short and encouraging. The tone is playful, not instructional.

### 8.2 Accessibility and safety
- Tap targets at least 48 px, and contrast at least WCAG AA.
- Every sound cue has a visual equivalent. Feedback uses `aria-live` regions.
- `navigator.vibrate` as an Android-only bonus. It is not available on iOS Safari, so it is never the primary cue.
- **Flash safety:** at 18 WPM a dit is about 67 ms on and 67 ms off, which is faster than 3 flashes per second. The signal lamp is therefore a bounded element (capped around 200x200 CSS px, well under the WCAG 2.3.1 general-flash area limit), never a full-screen flash. A "reduce motion" setting, honoring `prefers-reduced-motion`, replaces blinking with a steady indicator.
- Colorblind-safe palette: correct and wrong states also differ by icon and text, not only color.

### 8.3 Storage
- `lib/storage.ts` wraps every `localStorage` read and write in `try/catch`. If storage is blocked, the game works with in-memory state.
- Versioned key (`v: 1`) so a future change can migrate or discard old data.

### 8.4 PWA and offline
- Precache all assets, `display: standalone`, `orientation: portrait`, themed icons. Updates apply with `autoUpdate`.
- After first load the app works without network. Audio is synthesized, so there are no media files to cache.

### 8.5 Performance budget
- Initial JS at most 150 KB gzipped. Interactive in under 3 s on a mid-range phone over 4G.
- System font stack or one self-hosted variable font. No third-party scripts.

### 8.6 Privacy
- No accounts, no cookies, no remote requests at runtime. The nickname never leaves the device.
- Optional page-view counter (a no-cookie service such as GoatCounter or Umami) behind `VITE_ANALYTICS_URL`, off by default.

---

## 9. Config (`src/config.ts`, with env overrides)

| Key | Example | Purpose |
|---|---|---|
| `HOOK_MESSAGE` | `JOTA` | Mystery message in the hook |
| `STATION_CALLSIGN` | (to be provided) | Shown on Finish |
| `STATION_CTA` | "Come try it live at the station" | Finish copy (ID and EN) |
| `PRACTICE_URL` | `https://lcwo.net` | Target of the QR code |
| `TONE_HZ` | `650` | Sidetone pitch |
| `SPEED_PRESETS` | learn 18/8, challenge 18/8 | Character and overall WPM |
| `EVENT_LABEL` | `JOTA 2026` | Printed on the share card |

---

## 10. Project structure

```
src/
  main.tsx
  routes.tsx                 router, loaders, audio guard
  config.ts
  i18n/{en.ts,id.ts,index.ts}
  lib/
    morse/{table.ts,timing.ts,classifier.ts,words.ts,scoring.ts}
    audio/{engine.ts,unlock.ts}
    storage.ts
  store/session.ts           Zustand store (session + persisted slice)
  hooks/{usePlayMorse.ts,useSendInput.ts}
  components/
    ui/                      shadcn generated
    TapPad.tsx  SignalLamp.tsx  PatternGlyph.tsx  LetterKeypad.tsx  NameCard.tsx
  pages/{Welcome,Hook,Learn,Challenge,Finish}.tsx
```

---

## 11. Testing

### Unit (Vitest)
- Timing: dit and dah durations, Farnsworth `ta` (including the `s == c` identity), gap lengths.
- Classifier: sloppy and slow input still classifies correctly, unit adaptation clamps, commit timeout.
- Words: every word in `words.ts` uses only the 7 characters; the list contains `SOS`.
- Scoring: streak multiplier, replay penalty, speed bonus bounds.
- i18n: `en` and `id` key parity.
- Storage: survives blocked `localStorage`.

### Manual device matrix
- iPhone Safari (older and current), with the ringer switch off and on.
- Low-end Android Chrome, plus Samsung Internet.
- In-app browsers reached by scanning the QR code (camera app, WhatsApp and Instagram webviews).
- Check audio timing jitter, tap latency, safe-area insets, and the offline reload.

---

## 12. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Scaffold | Vite, Tailwind, shadcn, router, i18n, and PWA shell deploy to a static host |
| M1 | Audio engine | Tone, scheduler, timing and Farnsworth tests pass; Welcome and Test tone work on iOS and Android |
| M2 | Learn and decode | Meet and Decode drill for all 3 groups, with the unlock rule |
| M3 | Send | TapPad, classifier, sidetone, guided Send drill |
| M4 | Challenge, scoring, badges | Full loop playable start to finish, personal best persisted |
| M5 | Finish and share | Name card export and share, station block, practice QR |
| M6 | Device testing and polish | Matrix passed, copy reviewed in both languages, performance budget met |

---

## 13. Open items

1. Station callsign and the "come try it live" wording (Indonesian and English).
2. Practice-app URL for the QR code (LCWO or another).
3. Hook message text and event label.
4. Hosting target and final domain (needed for the printed QR code that opens the app).