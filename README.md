# Morse Mini-Game (JOTA)

A phone web app for the Jamboree On The Air station. A visitor hears the Morse mystery message and picks a level. Easy teaches the alphabet in four stages, starting with E, T, A, N, S, O, M, Medium uses A to Z, and Hard adds digits with callsigns and ham codes. Then they decode five mystery words, and leave with a name-in-Morse card and a link to keep practicing. It runs offline after the first load, needs no account, and keeps nothing off the device. Players can add it to their home screen from the Finish screen (installing needs HTTPS outside localhost). See `SPEC.md` for the full spec.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # vitest
npm run lint       # type check + copy check
npm run build      # outputs dist/
npm run preview    # serves dist/ with deep links
npm run gen:words  # rebuilds src/lib/morse/wordPools.ts from Faker + seeds
```

## Configure

Event settings live in `.env` and are baked in at build time. None of them are secret, so `.env` is committed. Put local overrides in `.env.local` (gitignored). A blank value uses the default in `src/config.ts`.

| Key | Default | Used for |
|---|---|---|
| `VITE_HOOK_MESSAGE` | `JOTA` | Message played on the Hook screen |
| `VITE_STATION_CALLSIGN` | `[CALLSIGN]` | Station shown on the Finish screen |
| `VITE_STATION_CTA_EN`, `VITE_STATION_CTA_ID` | see `.env` | Invitation to visit the station |
| `VITE_PRACTICE_URL` | `https://lcwo.net` | Target of the QR code |
| `VITE_EVENT_LABEL` | `JOTA 2026` | Printed on the name card |
| `VITE_TONE_HZ` | `650` | Tone pitch |
| `VITE_SPEED_LEARN`, `VITE_SPEED_CHALLENGE` | `18/8`, `18/8` | Character/overall WPM |
| `VITE_SEND_DRILL` | `true` | `false` drops the Send step from Learn packs |
| `VITE_ANALYTICS_URL` | blank (off) | GoatCounter endpoint |

The callsign stays `[CALLSIGN]` until the station's real one goes into `.env`. The app icon in `public/` is a placeholder too.

## Deploy

```sh
docker build -t cw-jota .
docker run -p 8080:80 cw-jota
```

Pushes to `main` run lint, tests, and the build, then publish `ghcr.io/<owner>/cw-jota` through GitHub Actions. nginx serves every route from `index.html` and tells browsers to revalidate the service worker, so a phone picks up a new build on its next visit.
