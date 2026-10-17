# Architecture Decision Records

Every decision the project owner approves gets an entry here, in the same commit as the change. Numbers only go up. To change a decision, add a new entry that supersedes the old one; do not edit history.

Template:

```
## ADR-NNN: Title
Date: YYYY-MM-DD · Status: Accepted | Superseded by ADR-NNN

Context: why this came up.
Decision: what we do now.
Consequences: what changes, what it costs.
```

## ADR-001: Record approved decisions in ADR.md
Date: 2026-10-16 · Status: Accepted

Context: Decisions came out of chat and play-testing and left no trace in the repo except the code.
Decision: Each approved decision is written here as a numbered entry. `SPEC.md` is updated when the decision changes specified behavior. `CLAUDE.md` makes this a standing rule.
Consequences: A change that carries a decision is not done until its ADR is in the same commit.

## ADR-002: antislop always runs in DURING mode
Date: 2026-10-16 · Status: Accepted

Context: antislop asks each session whether to apply its rules during the work or audit afterwards.
Decision: This project always uses DURING mode. The rules apply while planning and building, and every delivery ends with the Delivery Gate report. Agents do not ask which mode.
Consequences: Audits in `anti-slop/` are still possible on request, but they no longer replace in-flight checks.

## ADR-003: Decode drill retries in place and moves on slower
Date: 2026-10-16 · Status: Accepted

Context: In play-testing the next question came too fast (850 ms), and a wrong pick jumped ahead without letting the player find the answer.
Decision: A wrong pick strikes that option out, replays the sound, and keeps the player on the same question. Only a first-try answer counts toward the 5 of 6 pass mark and the streak. A correct pick after a miss gets no mark. The next question comes about 1.8 s after a correct pick, and its sound starts 600 ms after it appears. Re-queueing missed questions is gone, so a round is always 6 questions.
Consequences: Players always end a question on the right answer. A round with misses is shorter than before, because missed letters are no longer asked again later.

## ADR-004: Forgiving Send drill with a fill cue
Date: 2026-10-16 · Status: Accepted

Context: Exact dit/dah classification rejected beginners whose dahs were a little short or whose dits were a little long.
Decision: With the target known, a press counts as a dit up to 2.6 units and as a dah from 1.4 units. Presses in between match either and do not move the adaptive unit. The character commits as soon as it has the target's number of elements, and otherwise waits `max(800 ms, 5u)`. While the key is held, the target's next element fills with the lamp color (a dit in 1 unit, a dah in 1.4 units), so "hold until it fills" is the cue.
Consequences: Sends are judged on order and rough length rather than precise timing. The live buffer still shows the raw classification, so a wrong send names what was heard.

## ADR-005: Challenge plays at 18/8 Farnsworth
Date: 2026-10-16 · Status: Accepted

Context: Challenge letters at 18 WPM felt right, but the 18/12 letter gaps (about 0.46 s) left no time to think between letters.
Decision: The challenge preset is 18/8: letters stay at 18 WPM and letter gaps grow to about 0.86 s, the same timing as the learn preset.
Consequences: Words take longer to play. `VITE_SPEED_CHALLENGE` can still override it per event.

## ADR-006: Commit directly to main
Date: 2026-10-16 · Status: Accepted

Context: Iteration 2 went on a branch that the owner then merged by hand.
Decision: Work is committed straight to `main` once lint and tests pass. No feature branches.
Consequences: Every commit on `main` must be complete and verified, since there is no review branch in between.

## ADR-007: Three difficulty levels, picked after the Hook
Date: 2026-10-16 · Status: Accepted

Context: The challenge only used the 7 taught letters, so visitors who already know Morse had nothing to play.
Decision: A level picker (`/level`) follows the Hook. Easy keeps today's flow (Learn packs, then 7-letter words). Medium skips Learn and uses A to Z words. Hard skips Learn and mixes 2 ham codes with 3 generated callsigns (Indonesian `YB`..`YH` and world prefixes). All levels share the 18/8 challenge speed and the same scoring. The homepage no longer promises "learn 7 letters" and previews the three levels instead.
Consequences: Medium and Hard play characters the app never teaches, which is intended for experienced visitors. The keypad grows to 26 keys (plus a digits page on Hard), so patterns are shown on Easy only.

## ADR-008: Personal best per level, storage v2
Date: 2026-10-16 · Status: Accepted

Context: One best score cannot compare an Easy round with a Hard one.
Decision: localStorage keeps `bests: { easy, medium, hard }` under `v: 2`. A `v: 1` record is migrated, with its `bestScore` becoming the Easy best, instead of being discarded.
Consequences: Players on a shared station phone keep their earlier Easy record. The picker and Finish show the best for each level.

## ADR-009: Easy split into four stages with a stage picker
Date: 2026-10-16 · Status: Accepted

Context: Easy only taught E T A N S O M, so a visitor who finished it had nowhere further to go inside Easy.
Decision: Easy has four stages, each in packs: 1 `E T · A N · S O M` (unchanged), 2 `I R · D U · K G W`, 3 `H V · F L · P B C`, 4 `J Q · X Y Z`. Picking Easy opens `/stage`, where every stage is open. Stages 2 to 4 start with a warm-up grid of earlier letters (tap to hear, no drill) unless those stages were learned this visit. Decode distractors include letters from earlier stages. Each stage's challenge plays 5 words built from every letter through that stage, with at least one of its new letters; stage 1 keeps its SOS word. The challenge keypad shows patterns on stage 1 only, and lists larger sets A to Z. Finish offers "On to stage n". A new `a_to_z` badge marks finishing the stage 4 packs.
Consequences: Learn routes become `/learn/:stage/:pack`. A visitor can jump to stage 3 without stages 1 and 2; the warm-up is their only exposure to those letters, which suits people who already know some Morse.

## ADR-010: Personal best per Easy stage, storage v3
Date: 2026-10-16 · Status: Accepted · Supersedes the Easy part of ADR-008

Context: A stage 1 score and a stage 4 score are not comparable, the same reason ADR-008 split bests by level.
Decision: localStorage keeps `bests: { easy1, easy2, easy3, easy4, medium, hard }` under `v: 3`. A `v: 1` best and a `v: 2` Easy best both migrate to `easy1`. The level picker shows Easy's top stage score with its stage number.
Consequences: Existing Easy records keep their meaning, since they all came from what is now stage 1.

## ADR-011: Light/dark switch, light by default
Date: 2026-10-17 · Status: Accepted

Context: Stations run into the evening, and a bright paper screen is harsh in a dark tent. The app was light-only.
Decision: A sun/moon switch sits in the header on every screen. First start is always light, regardless of `prefers-color-scheme`. The choice is stored as optional `theme` in the v3 record. Dark mode swaps the neutral tokens (page, card, text, borders, muted); candy fills and `--ink` keep their values, so text on candy is always `text-ink` and text on neutral fills is `text-foreground`. The always-dark panels (Hook, Challenge) use a new `--on-ink` token for their text and marks.
Consequences: New UI must pair candy fills with `text-ink`; `text-ink` on `bg-card` is now a bug in dark mode. The exported name card image stays light.

## ADR-012: Back button in the header
Date: 2026-10-17 · Status: Accepted

Context: Players had no way back to the previous screen except the browser's own gesture, which is hidden in standalone mode.
Decision: A soft (ghost) back arrow sits left of the header kicker on every screen except Welcome and the error screen. It goes back one history entry, or to `/` when the tab has no in-app history.
Consequences: Back from mid-Challenge abandons the round with no confirm. Back from Finish lands on Challenge, which starts a fresh round.

## ADR-013: Send row wraps on narrow phones
Date: 2026-10-17 · Status: Accepted

Context: On a 360px phone a four-mark letter (Q, J, Y) at the large glyph size overflowed the Send card and clipped the sound button.
Decision: The Send card wraps: the pattern drops below the letter and the sound button to its own row, right-aligned. The large glyph and the medium signal lamp shrink below 400px so the pattern and the Welcome card fit a 320px screen.
Consequences: On small phones the Send card is taller, by one or two rows.

## ADR-014: Challenge keypad without patterns, like Decode
Date: 2026-10-17 · Status: Accepted · Supersedes the keypad part of ADR-009

Context: Easy stage 1's Challenge keypad printed each letter's pattern on its key, while Learn's Decode keypad shows letters only. The patterns let players read instead of listen.
Decision: The Challenge keypad shows letters only at every level. `LetterKeypad` no longer has a `showPatterns` option.
Consequences: Stage 1 Challenge is a little harder, and matches the skill Decode trains.

## ADR-015: Light offset shadows in dark mode
Date: 2026-10-17 · Status: Accepted · Amends ADR-011

Context: In dark mode the hard offset shadows were near-black on a charcoal page, so cards and buttons lost their lifted, pressable look.
Decision: In dark mode `--shadow-color` matches the paper-colored border, so every brutal shadow (cards, buttons, tap pad, lit lamp) shows as a light offset.
Consequences: The press effect (shadow collapsing on tap) stays visible in dark mode. Light mode is unchanged.

## ADR-016: Install offer on the Finish screen
Date: 2026-10-17 · Status: Accepted

Context: The app already had a manifest and an offline service worker, but players could only install it from the browser menu, which first-timers at the station don't find.
Decision: Finish shows a "Keep it on your phone" section after the station card. Browsers with an install prompt get an Add to home screen button; iOS Safari gets the Share, Add to Home Screen steps. Nothing shows when already installed or when the browser can't install. The manifest gains `id`, `start_url`, `scope`, `lang`, and a padded maskable icon; `index.html` gains the iOS web-app meta tags.
Consequences: Players can keep practicing offline after the event from a home-screen icon. The offer stays off Welcome so it does not compete with starting the game. Install needs HTTPS outside localhost.

## ADR-017: Mystery words from Faker, generated at build time
Date: 2026-10-17 · Status: Accepted

Context: Each Challenge level picked from a hand-picked list of 25 to 30 words, so players who came back saw the same mystery words again.
Decision: `scripts/gen-words.mjs` takes Faker's English word lists plus the old curated lists as seeds, keeps words of 3 to 6 letters, drops a blocklist (words unsuitable for kids, archaic words, jargon, brands, sounds with no settled spelling), and writes `src/lib/morse/wordPools.ts`. Each Easy stage keeps only words spelled with letters taught so far, and from stage 2 on each word has at least one letter the stage introduces. Faker is a dev dependency, so it never reaches the app. Hard keeps its 3 random callsigns. One of its 2 ham codes becomes a pool word.
Consequences: The pools hold 54 words for stage 1, 288 to 862 for later stages, and 1504 for Medium. Stage 1 still always includes SOS. The bundle grows by about 6 kB gzipped. Some Faker words are uncommon (SONATA, OCELOT). Words a leader objects to go in the blocklist, then `npm run gen:words` rebuilds the pools.

## ADR-018: Pack picker after the stage picker
Date: 2026-10-17 · Status: Accepted

Context: Picking an Easy stage jumped straight to the warm-up, the next pack, or the challenge, so a player could not replay a pack, skip one they already know, or go straight to the stage's words.
Decision: Picking a stage opens `/stage/:s`, a list of the warm-up (stages 2 to 4), each pack with its letters, and Mystery words. Every card is open. A check marks packs done this visit, and an "Up next" sticker marks the card `stageStart` would have opened. Finish's "Next stage" opens the next stage's pack picker too.
Consequences: One more tap before learning starts. Players can play Mystery words without learning the stage's letters first.

## ADR-019: Send drill behind `VITE_SEND_DRILL`
Date: 2026-10-17 · Status: Accepted

Context: Some stations may not want the tap-pad Send step, for example when time per visitor is short.
Decision: `VITE_SEND_DRILL` (default `true`) switches the Send drill. With `false`, Learn packs show Meet and Hear only, and Decode's pass button ("Finish the pack") goes to the pack's Done screen.
Consequences: With Send off, the First Signal badge cannot be earned. Finish lists only earned badges, so nothing shows it missing.

## ADR-020: Back goes up the flow, not back in history
Date: 2026-10-17 · Status: Accepted · Supersedes the history behavior of ADR-012

Context: Back stepped through browser history, so after Next pack or Finish's Next stage it landed on an earlier pack or a finished round instead of the screen above. From a stage's pack picker it could even land on Welcome.
Decision: Each screen has a fixed parent (`parentPath` in `src/lib/nav.ts`): Learn pack and warm-up go to `/stage/:s`, `/stage/:s` to `/stage`, `/stage` to `/level`, `/level` and `/hook` to `/`. Challenge and Finish go to `/stage/:s` on Easy and `/level` on Medium and Hard.
Consequences: Back always lands on the same screen, however the player got there. Back pushes a new history entry, so the browser's own back gesture can return to the screen just left. Back from mid-Challenge still abandons the round with no confirm.
