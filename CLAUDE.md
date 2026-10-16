# cw-jota

Morse mini-game for a JOTA station. `SPEC.md` is the spec; `README.md` covers develop, configure, and deploy.

- Copy lives in `src/i18n/en.ts` and `src/i18n/id.ts`. Both must keep the same keys and placeholders; `src/i18n/i18n.test.ts` checks it.
- Event settings come from `.env` through `src/config.ts`. Add a key to `src/vite-env.d.ts`, `.env`, and the README table together.
- Run `npm run lint` and `npm test` before committing.
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
<!-- antislop:end -->
