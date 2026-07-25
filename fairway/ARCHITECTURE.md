# ARCHITECTURE

## System shape

```
 iOS / Android (Expo RN)          Web (Next.js 15)
 ┌──────────────────────┐        ┌────────────────────┐
 │ Expo Router UI       │        │ Marketing + Dash   │
 │ @fairway/ui-tokens   │        │ Tailwind preset ←──┼── @fairway/ui-tokens
 │ @fairway/engine ←────┼────────┼──→ @fairway/engine │   (single source of truth)
 │ SQLite (offline SoT) │        │ Spectator view     │
 │ sync queue (LWW)     │        └─────────┬──────────┘
 └──────────┬───────────┘                  │
            ▼                              ▼
 ┌─────────────────────────────────────────────────────┐
 │ Supabase: Postgres + PostGIS, RLS on every table,   │
 │ Realtime (leaderboards), Storage, Edge Functions     │
 │ (ai-caddie [Anthropic key server-side], spectate)    │
 └─────────────────────────────────────────────────────┘
 Billing: RevenueCat (StoreKit/Play) · Stripe Checkout (web) → webhooks → subscriptions table
```

**The engine is the product's brain.** All scoring, WHS handicap, side-game,
strokes-gained, and drill math lives in `@fairway/engine` as pure functions —
no platform imports, no I/O — so mobile, web, and edge functions compute
identical results, and everything is unit-testable (72 tests, zero deps).

## Offline-first (Fix #16)

Starting a round prefetches the full course payload (holes, geometry, tees)
into SQLite `course_cache` (plus map tiles into the file cache). During play,
SQLite is the source of truth: scores, shots, and players write locally and
append to `sync_queue`. A connectivity listener drains the queue:

- **hole_scores:** last-write-wins **per hole**, `client_updated_at` tiebreak —
  the server row is only overwritten by a strictly newer client edit.
- **Group rounds:** merge per player+hole — different players' entries never
  conflict; the same player edited on two phones resolves by LWW.

## Power management (Fix #11 — ≤25% battery per 4.5h round)

1. **GPS duty-cycling** (`src/lib/gps.ts`): `BestForNavigation` only while the
   GPS screen is foregrounded or a shot is actively tracked; `Balanced`
   (10 m/5 s) on other screens; `Low` when backgrounded between shots.
2. **Automatic low-power mode:** below 30% battery, precise requests are
   downgraded to Balanced.
3. **No live tile streaming:** tiles prefetch at round start; the map renders
   from cache.
4. **AMOLED dark theme** is the on-course default (`theme.amoledBg` = #000).
5. **Kalman smoothing** lets us use fewer fixes for stable yardages.
Budget verification: profile with Xcode Instruments / Android Battery
Historian over a simulated 4.5 h round script (see HANDOFF).

## Handicap correctness (Fix #6)

`packages/engine/src/whs.ts` implements Rules 5.1a/5.1b/5.2/5.8 including the
2024 9-hole treatment (9-hole differential + expected differential — never
doubling), small-record adjustments, soft/hard caps, and truncation. Every
computation returns an `explanation[]` audit trail that the app renders on the
handicap screen. Unit tests pin USGA worked examples.

## Strokes gained (Fix #8) — sensor-free

Tap-to-track shots store start/end location + lie. SG per shot =
E[start] − E[end] − 1 − penalties against embedded Broadie baseline tables
(`baselines.ts`), categorized driving/approach/short-game/putting, benchmarked
against handicap-band tables ("your putting is 1.8 strokes worse than a typical
12-handicap"), feeding the Inside-100 dashboard and Practice Plan generator.

## Security & privacy

- RLS on every table; spectator access only through the `spectate` edge
  function validating `share_token` (service role, rate-limit at the gateway).
- Anthropic + Stripe secrets exist only in edge/server environments.
- Location permission requested when-in-use; background is a separate opt-in.
- In-app data export (CSV/JSON) and account deletion (store compliance).

## Fix List coverage (verify each)

| # | Where | Verify |
|---|---|---|
| 1 | `apps/mobile/app/(tabs)/index.tsx` | Home CTA → tee confirm = 2 taps; premium card dismiss persists 60 days (MMKV) |
| 2 | Everywhere | No ad SDK exists in either package.json |
| 3 | `(tabs)/_layout.tsx` | 3 tabs + profile; one primary action per screen |
| 4 | `profile.tsx`, `account/page.tsx`, checkout route | Native billing / Stripe Checkout only; cancel deep-links; $39.99/47 comparison table pre-purchase |
| 5 | Landing + profile "covenant"; CI guard idea in HANDOFF | Covenant rendered in-app and on web |
| 6 | `engine/src/whs.ts` + tests | `node --test packages/engine/test/whs.test.ts` |
| 7 | `GroupScoreSheet.tsx` | All players one screen, par-prefilled steppers, swipe gestures, single confirm |
| 8 | `engine/src/strokesgained.ts`, `baselines.ts` | strokesgained tests; benchmark deltas |
| 9 | `engine/src/drills.ts` (27 drills) | drills tests: rubrics, banded targets, plan generator |
| 10 | `inside100Stats()` + Stats tab/dashboard | strokesgained tests (up/down %, sand saves, proximity bands) |
| 11 | `gps.ts` duty-cycling + AMOLED theme + tile prefetch | See power section above |
| 12 | Kalman filter + accuracy chip; flags off by default | `YardageDisplay` shows ±m; `featureFlags.voiceScoring=false` |
| 13 | Zen toggle in `round/new.tsx`, respected in `GroupScoreSheet` | Maestro `zen-mode.yaml` |
| 14 | Badges only — no currency table exists | Schema has no points/currency economy |
| 15 | Sentry wired in app config; engine >80% coverage; E2E suites | `e2e/` |
| 16 | `db.ts` + `sync.ts` + course prefetch | Maestro `offline-round.yaml` |
