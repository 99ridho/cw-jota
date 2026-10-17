# Morse Mini-Game: Technical Spec (JOTA Edition)

Status: Draft v1
Owner: Ridho
Scope: one-off event web app for the Jamboree On The Air (JOTA) station. A visitor picks a level: a first-timer learns 7 Morse characters and sends and decodes them, while someone who knows Morse goes straight to A to Z or letters plus digits. Everyone leaves with a shareable card and a pointer to the live station.

---

## 1. Goals and non-goals

### Goals
- A first-timer hears, decodes and sends Morse within 5 minutes with no outside instructions.
- A full session takes 10 to 15 minutes and ends with a clear payoff (badges, personal best, name-in-Morse card).
- Works on the player's own phone, scanned from a QR code, with no account. Installing to the home screen is offered on Finish but never required.
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
/level       Pick Easy, Medium or Hard (ADR-007)
/stage       Easy only: pick stage 1 to 4 (ADR-009)
/stage/:s    Easy only: pick the warm-up, a pack, or the challenge of stage s (ADR-018)
/learn/:s/recap   Warm-up with every letter from earlier stages (stage 2 to 4)
/learn/:s/:p      Stage s, pack p (see STAGES below)
/challenge   Mystery Word challenge (5 words)
/finish      Score, badges, name card, station and practice links
```

Easy opens the stage picker, and a stage opens its pack picker (`/stage/:s`). From there the player can open any pack, the warm-up, or the challenge. A pack's Done screen leads to the next pack, and the last pack leads to the challenge. The pack picker marks one card "Up next" (`stageStart` in `levels.ts`): the warm-up on stages 2 to 4 unless every earlier stage was learned this visit, else the first pack not done this visit, else the challenge. Medium and Hard go straight to `/challenge`. Each pack page has three internal steps: **Meet** → **Decode drill** → **Send drill**. With `VITE_SEND_DRILL=false` the Send drill is skipped and a pack ends after Decode (ADR-019). Splitting practice across packs keeps every minute interactive and gives a first "I sent it" win within the first few minutes.

Time budget for a first-timer on stage 1: Hook 1 min, three packs about 3 min each, Challenge 3 min, Finish 1 min. Later stages are for repeat visits or visitors who want more.

**Route guard:** every route except `/` has a loader that redirects to `/` if the audio context has not been unlocked in this page load. A reload on a deep route therefore returns to the Start screen, which is the only place a user gesture can unlock audio.

---

## 4. Domain model

```ts
export type MorseChar = 'A' | 'B' | ... | 'Z'; // every letter can be taught
export type Element = '.' | '-';

export const MORSE_TABLE: Record<string, string>; // A-Z and 0-9, e.g. A: '.-'

// Easy stages, each split into packs (ADR-009).
export const STAGES: MorseChar[][][] = [
  [['E','T'], ['A','N'], ['S','O','M']],
  [['I','R'], ['D','U'], ['K','G','W']],
  [['H','V'], ['F','L'], ['P','B','C']],
  [['J','Q'], ['X','Y','Z']],
];

export type BadgeId =
  | 'first_signal'    // first correct Send
  | 'sos_master'      // SOS solved in the challenge
  | 'all_seven'       // stage 1 packs completed
  | 'a_to_z'          // stage 4 packs completed
  | 'perfect_round'   // challenge with 0 misses and 0 replays
  | 'quick_ears'      // any word solved under 8 s
  | 'name_in_morse';  // name card generated

// Persisted (localStorage, versioned)
export interface Persisted {
  v: 3;
  lang: 'en' | 'id';
  nickname?: string;
  bests: Record<'easy1' | 'easy2' | 'easy3' | 'easy4' | 'medium' | 'hard', number>; // per Easy stage, Medium, Hard (ADR-010)
  badges: BadgeId[];
  reduceMotion?: boolean;
  theme?: 'light' | 'dark';         // missing means light (ADR-011)
}

// In-memory only, reset on reload
export interface Session {
  audioUnlocked: boolean;
  level: Level | null;
  stage: number;                     // Easy stage
  packsDone: Record<number, number>; // packs finished this visit, per stage
  score: number;
  streak: number;
  challenge: { words: string[]; results: WordResult[] };
}
```

Persisted data is only language, optional nickname, best score per level, badges, the steady-lamp setting, and the theme. Nothing is transmitted.

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

### 7.0 Header (every screen)
- Back button on the left (not on Welcome): pops history, the same as the browser's back and the phone's back gesture (ADR-022). Forward moves keep history a stack of the flow, using each screen's parent in `src/lib/flow.ts`: one level deeper pushes, a sibling replaces the top, and a screen whose parent is further down pops back to it first. So Back always goes one level up: Learn pack and warm-up go to their pack picker, pack picker to the stage picker, stage picker to the level picker, level picker and Hook to Welcome. Challenge and Finish go to the stage's pack picker on Easy and to the level picker on Medium and Hard. Learn's Meet, Hear and Send are steps inside one screen, so Back leaves the pack.
- Light/dark switch on the right, after any screen-specific chip. First start is always light, whatever the OS setting; the choice is saved. A script in `index.html` applies a saved dark theme before first paint (ADR-011).

### 7.1 Welcome (`/`)
- Language `ToggleGroup` (ID / EN), default from `navigator.language` (starts with `id` means Indonesian).
- Sound notice, **Test tone** button, and the primary **Tap to start** button.

### 7.2 Hook (`/hook`)
- Copy: "Something is calling you…". The mystery message plays with the `SignalLamp` blinking and the pattern shown as dits and dahs.
- Tap to reveal the decoded text. The message comes from `config.HOOK_MESSAGE` (for example `JOTA`), since the hook comes before any learning.
- Replay button, then Next to the level picker. While the message first plays, a Skip button beside Replay stops it and goes straight to the level picker. Once that first play ends, Skip goes away and Replay takes the full width (ADR-021).

### 7.2b Level picker (`/level`)
- Three stacked cards: **Easy** (4 stages, Learn packs first), **Medium** (A to Z), **Hard** (A to Z and 0 to 9). Medium and Hard show their personal best or "No score yet"; Easy shows its top stage score and which stage it was on.
- Finish's "Play again" returns here.

### 7.2c Stage picker (`/stage`)
- Four stacked cards, all open: stage number, the letters it introduces, how many letters its words use, and that stage's best.
- **Warm-up** (`/learn/:s/recap`): a grid of every letter from earlier stages, each tile showing its pattern and playing on tap. Continue is always enabled; nothing is drilled.

### 7.2d Pack picker (`/stage/:s`)
- Stacked cards, all open: **Warm-up** (stages 2 to 4), one card per pack with its letters and a check when done this visit, then **Mystery words** with that stage's best.
- An "Up next" sticker marks the card `stageStart` picks. Finish's "Next stage" opens the next stage's pack picker.

### 7.3 Learn pack (`/learn/:s/:p`)
1. **Meet:** a card per character with the glyph, the pattern, and tap-to-hear. The pattern is explained by rhythm ("di-dah"), not by chart.
2. **Decode drill:** 6 questions per pack. Options: 2 (pack 1), 3 (pack 2), 4 (pack 3). Distractors come from this pack first, then from every letter learned before it, earlier stages included. A wrong pick strikes that option out and replays the sound, and the player keeps picking on the same question. Only a first-try answer scores; a correct pick after a miss moves on with no mark. After a correct pick the next question comes about 1.8 s later (ADR-003).
3. **Send drill** (only when `VITE_SEND_DRILL` is on, the default): the target character is shown with its pattern (guided). The player taps it out. Two correct sends per character complete the step.
- **Unlock rule:** 5 of 6 correct in the drill, or 2 drill attempts. After two attempts the pattern is shown as a hint, so nobody gets stuck at an event. There are no dead ends.

### 7.4 Challenge (`/challenge`)
- 5 mystery words for the picked level. Each is played, and the player enters it on `LetterKeypad` or a physical keyboard. Replay is unlimited at a small score cost.
- **Word pools (ADR-017):** `scripts/gen-words.mjs` (`npm run gen:words`) builds `src/lib/morse/wordPools.ts` from Faker's English word lists plus a curated seed list, keeping words of 3 to 6 letters and dropping a blocklist (unsuitable for kids, archaic, jargon, brands). Faker is a dev dependency only; the app ships the generated lists. Each round picks at random from them.
- **Easy stage 1:** 5 from `EASY_POOLS[1]`, words spelled only with the 7 characters. Examples: `SOS, SEA, NOTE, STONE, MEAT, TEAM, NAME, MOON, ONSET, MEAN`. One word is always `SOS` (earns `sos_master`). Keypad: 7 keys, no patterns, in teaching order (ADR-014).
- **Easy stages 2 to 4:** 5 from `EASY_POOLS[stage]`, short first. A unit test checks every word uses only letters taught through that stage and at least one letter the stage introduces. Keypad: the stage's letters A to Z, no patterns (they do not fit at 14 keys and up).
- **Medium:** 5 from `MEDIUM_POOL` (every pool word, A to Z). Keypad: 26 letters, no patterns.
- **Hard:** 1 ham code from `HARD_CODES` (`73`, `599`, `5NN`, `CQ`, ...), 1 word from `MEDIUM_POOL`, then 3 generated callsigns: an Indonesian (`YB`..`YH`) or world prefix, one digit, 1 to 3 letters, at most 6 characters. Keypad: letters with an `ABC | 123` page toggle.
- Score, per word: 100 per correct letter, plus up to 50 speed bonus, minus 10 per replay. Streak multiplier up to 2x. Personal best is saved to local storage, one per Easy stage plus one each for Medium and Hard.

### 7.5 Finish (`/finish`)
- Final score vs the personal best for that level (and stage, on Easy), earned badges, and a Play again button back to the level picker. On Easy stages 1 to 3, an "On to stage n" button starts the next stage.
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
- Versioned key (`v: 3`). A `v: 1` record's `bestScore` and a `v: 2` record's Easy best both become the Easy stage 1 best. Unknown versions are discarded.

### 8.4 PWA and offline
- Precache all assets, `display: standalone`, `orientation: portrait`, themed icons. Updates apply with `autoUpdate`.
- After first load the app works without network. Audio is synthesized, so there are no media files to cache.
- Manifest has `id`, `start_url` and `scope` of `/`, and a separate maskable icon with the artwork inside the safe zone.
- Finish offers install once the game can be installed and is not already running standalone. Where the browser fires `beforeinstallprompt` (captured at startup in `main.tsx`), a button opens the browser's install dialog. On iOS Safari, which has no install API, the same spot shows two steps: Share, then Add to Home Screen. Other browsers see nothing.

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
    morse/{table.ts,timing.ts,classifier.ts,words.ts,wordPools.ts,scoring.ts}
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
- Words: every pool word is 3 to 6 letters A to Z with no duplicates; stage 1 uses only the 7 characters and contains `SOS`; each later stage uses only letters taught so far and at least one it introduces; pools stay large (stage 1 40+, later stages 200+, Medium 1000+).
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
| M2 | Learn and decode | Meet and Decode drill for every pack, with the unlock rule |
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