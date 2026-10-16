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
