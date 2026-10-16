# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# cw-jota

Morse mini-game for a JOTA station: a phone web app where a first-timer learns E, T, A, N, S, O, M in three packs, decodes mystery words, and leaves with a name-in-Morse card. `SPEC.md` is the spec; `README.md` covers develop, configure, and deploy. `ADR.md` records approved decisions.

## Commands

```sh
npm run dev                                  # http://localhost:5173
npm test                                     # vitest, all tests
npx vitest run src/lib/morse/classifier.test.ts   # one file
npx vitest run -t "adapts to a slow sender"  # one test by name
npm run lint                                 # tsc -b + scripts/check-copy.mjs (em dash / "--" check)
npm run build
```

Run `npm run lint` and `npm test` before committing.

## Architecture

- **Flow:** `src/routes.tsx` maps Welcome `/` → Hook → `/learn/1..3` → Challenge → Finish. Audio can only be unlocked by a gesture on Welcome, so every later route's loader redirects to `/` until `isUnlocked()`.
- **Timing is pure:** `src/lib/morse/timing.ts` turns text + a Farnsworth `SpeedPreset` into a tone schedule. `src/lib/audio/engine.ts` plays it on `audioCtx.currentTime` (never `setTimeout`), and `src/hooks/usePlayMorse.ts` drives the lamp and glyph visuals from the same schedule with rAF, so sound and visuals cannot drift.
- **Send input:** `src/hooks/useSendInput.ts` (pointer + Space key, sidetone) feeds presses to the pure adaptive classifier in `src/lib/morse/classifier.ts`.
- **Drills and scoring** are pure modules in `src/lib/morse/` (`drill.ts`, `scoring.ts`, `words.ts`) with unit tests; pages in `src/pages/` hold the UI state.
- **State:** `src/store/session.ts` (zustand). Persisted bits (lang, nickname, badges, best score) go through `src/lib/storage.ts`.

## Rules

- Copy lives in `src/i18n/en.ts` and `src/i18n/id.ts`. Both must keep the same keys and placeholders; `src/i18n/i18n.test.ts` checks it.
- Event settings come from `.env` through `src/config.ts`. Add a key to `src/vite-env.d.ts`, `.env`, and the README table together.
- Every decision the user approves goes in `ADR.md` as a new numbered entry (date, context, decision, consequences), in the same commit as the change. Update `SPEC.md` when the decision changes specified behavior.
- Past antislop audits live in `anti-slop/audit-NNN-YYYY-MM-DD.md`. A new audit gets the next number.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop core and then the skill for the task with the Skill tool (they ship as the `antislop` plugin, not as files in this repo):
- Core (always first): `antislop:antislop`
- UI / visual: `antislop:antislop-ui`
- Copy & text: `antislop:antislop-copywriting`
- People: `antislop:antislop-human`
- Mobile / responsive: `antislop:antislop-layoutmobile`
- Code comments: `antislop:antislop-code`

antislop always runs in DURING mode on this project (rules applied while planning and building, Delivery Gate at the end). Do not ask which mode.
<!-- antislop:end -->
