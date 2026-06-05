# `AGENTS.md` — ngasih-tau-ada-bis-di-sarijadi-atau-nggak

Bot Telegram yang polling API BEMO (bis Bandung), ngecek point-in-polygon, notif pas ada bis masuk/keluar geofence.

## Runtime & Setup

- **Bun** 1.x (not Node). No `.nvmrc`, no `package-lock.json` — use `bun.lock`.
- `bun install` → deps (`@turf/boolean-point-in-polygon`, `prettier`)
- `.env` is gitignored; copy `.env.example`. **Required vars:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- **No build step.** TypeScript runs directly via Bun (noEmit).

## Commands

| Command | What it does |
|---------|-------------|
| `bun start` | Infinite loop (poll → geofence → state → notify), sleeps 19:00–05:00 WIB |
| `bun start -1` | Single-shot mode: one tick then exits (cron-friendly) |
| `bun start -bdg` | Load `test-polygons.json` instead of `polygons.json` |
| `bun test` | All `*.test.ts` files via Bun's test runner |
| `bun run format` | Prettier (no semis, single quotes, trailing commas, 80 width) |
| `bun run format:check` | Prettier check only |

## Architecture (`src/`)

- `index.ts` — infinite loop entrypoint: tick → fetch → geofence → state → notify. Handles sleep, midnight reset, `SIGTERM`, API-down flag.
- `fetcher.ts` — `Promise.all` to `/map/live` + `/map/tmb/`, normalizes to `BusData[]`, deduplicates by plate (prefer newer timestamp; tie → live source).
  - `/map/live` response path: `response.data.result.data[]`
  - `/map/tmb/` response path: `response.message.data[]`; `latitude`/`longitude` are **strings**
  - Dedup key: `PLATE:<plate>` > `VNO:<vehicle_no>` | `IMEI:<imei>`
  - Plate extracted via regex `[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}`
  - URLs are **hardcoded** (`bemo.uptangkutan-bandung.id`) — env var `BEMO_API_URL` not used
- `geofencing.ts` — turf.js `booleanPointInPolygon`. Polygon coords in JSON are `[lat, lng]`; module swaps to `[lng, lat]` for Turf and closes ring if unclosed.
- `state.ts` — in-memory `Map<busKey:polygonName, bool>`. Returns `enter`/`exit`/`stay`/`absent`. Reset daily (date-change detection in `index.ts`).
- `notifier.ts` — HTML-formatted Telegram via `api.telegram.org`. Consolidated per-polygon (all enter + exit events in one message).
- `routes.ts` — route label extraction from `vehicle_no`, plate→koridor lookup table, jurusan enrichment.
- `config.ts` — env var parsing, sleep-time calc (UTC+7), polygon file loader.
- `types.ts` — all shared types.

## Polygon file format

```json
{ "Sarijadi": [[lat, lng], [lat, lng], ...] }
```

Keyed by polygon name, values are arrays of `[lat, lng]` pairs (not `[lng, lat]`). Default: `polygons.json`. With `-bdg`: `test-polygons.json`.

## Sleep mode

Default 19:00–05:00 WIB. During sleep: runs one tick per `SLEEP_INTERVAL_SEC` (default 3600s). Bypass with `BYPASS_SLEEP_MODE=true`. Calculated from UTC+7 (`getUTCHours() + 7`).

## Env vars

```
TELEGRAM_BOT_TOKEN    # required
TELEGRAM_CHAT_ID      # required
POLL_INTERVAL_SEC     # default 60
SLEEP_START_HOUR      # default 19
SLEEP_END_HOUR        # default 5
SLEEP_INTERVAL_SEC    # default 3600
BYPASS_SLEEP_MODE     # default false
```

## What's NOT here

- No CI config, no deploy script, no `render.yaml`
- No typecheck step (tsconfig is strict but `bun test` is the only verify command)
