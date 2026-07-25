# 19 Eagles — Fairway

**Fairway** (working title) is a cross-platform golf GPS, scoring, and improvement app — iOS, Android, and web — built to keep everything golfers love about apps like 18Birdies while fixing the sixteen most common complaints about them: no ads ever, two taps to the first tee, a correctly-implemented WHS handicap, real strokes-gained analytics, a first-class practice mode, true offline play, and a transparent $39.99/yr premium tier that never cannibalizes the free product.

The app itself lives in [`fairway/`](fairway/). The original build specification that produced it is [`master-prompt-golf-app.md`](master-prompt-golf-app.md).

## What the app does

- **Play (core loop):** course search (GPS-nearby first) → tee selection → optional group setup → live hole view with front/center/back distances, tap-anywhere yardages, hazard carries, and shot tracking. Group score entry puts all players on one screen with par-prefilled steppers — a hole takes seconds, not minutes. A per-round **Zen mode** hides score-to-par until the round is over.
- **Stats & improvement:** sensor-free **strokes gained** (driving / approach / short game / putting) computed from tap-to-track shot locations against Broadie baseline tables, benchmarked against your handicap band ("your putting is 1.8 strokes worse than a typical 12-handicap"), plus an **Inside-100 dashboard** (up-and-down %, sand saves, proximity by distance band).
- **Handicap done right:** a full **World Handicap System** implementation — best 8 of last 20, correct 2024 9-hole treatment (never doubling), soft/hard caps, small-record adjustments — with an `explanation[]` audit trail so the app can show you exactly how your index was computed. Unit-tested against USGA worked examples.
- **Practice mode:** 27 scored drills (putting gates, ladders, wedge matrices) with scoring rubrics, handicap-benchmarked targets, and a Practice Plan generator driven by your worst strokes-gained category.
- **Social, opt-in:** group rounds, live leaderboards (Supabase Realtime), side games (Skins, Nassau, Match Play, Wolf, Stableford, Vegas), badges. Private by default; social never interrupts scoring.
- **Offline-first:** starting a round prefetches the full course payload into SQLite; GPS, scoring, and shot tracking work with zero connectivity and sync back with per-hole last-write-wins conflict resolution.
- **Battery-conscious:** GPS duty-cycling, AMOLED dark theme on-course, prefetched map tiles, and an automatic low-power mode — budgeted at ≤25% battery per 4.5-hour round.
- **AI Caddie (premium):** one-sentence club recommendations from your own tracked club distances, served by a Supabase Edge Function calling the Anthropic API (key stays server-side; the app is fully functional without it).

## How it's put together

Turborepo + pnpm monorepo:

```
fairway/
├── apps/mobile          Expo SDK 52 + Expo Router (iOS & Android)
├── apps/web             Next.js 15 App Router (marketing, dashboard, spectator view)
├── packages/engine      Pure-TS rules engine: scoring, WHS handicap, side games,
│                        strokes gained, drills, geo — no platform imports, 72 unit tests
├── packages/api-client  Typed Supabase layer + Realtime leaderboards
├── packages/ui-tokens   Design tokens shared by React Native and Tailwind
├── supabase/            Postgres + PostGIS migrations, RLS policies, edge functions
│                        (ai-caddie, spectate), seed data (25 demo courses)
└── e2e/                 Playwright (web) + Maestro (mobile) critical-path suites
```

**The engine is the product's brain.** All scoring, handicap, side-game, strokes-gained, and drill math lives in `@fairway/engine` as pure functions, so mobile, web, and edge functions compute identical results and everything is unit-testable with zero dependencies.

Backend is **Supabase**: Postgres with PostGIS for course geometry, Row Level Security on every table, Realtime for live leaderboards, and Edge Functions for AI and spectator access. Billing is RevenueCat (App Store / Play) on mobile and Stripe Checkout on web. See [`fairway/ARCHITECTURE.md`](fairway/ARCHITECTURE.md) for the full system diagram, offline sync design, and the complaint-by-complaint Fix List coverage table.

## How to run it

Prerequisites: **Node ≥ 22.6** and **pnpm** (via corepack). Every integration is feature-flagged — with no keys configured, the apps run in full offline/guest mode (GPS, scoring, stats, and practice all work).

```bash
cd fairway
corepack enable && pnpm install

# Engine tests — zero dependencies, run anywhere:
node --test packages/engine/test/*.test.ts     # 72 passing

# Web app:
cp .env.example apps/web/.env.local            # fill Supabase keys (see HANDOFF.md)
pnpm --filter @fairway/web dev                 # http://localhost:3000

# Mobile app:
cp .env.example apps/mobile/.env               # EXPO_PUBLIC_* keys
pnpm --filter @fairway/mobile dev              # Expo dev server (scan QR with Expo Go)
```

Monorepo-wide scripts from `fairway/`: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` (all via Turborepo).

### Database

After creating a Supabase project (step-by-step in [`fairway/HANDOFF.md`](fairway/HANDOFF.md)):

```bash
supabase link --project-ref <ref>
supabase db push                                 # migrations 0001–0003 (schema, RLS, functions)
psql "$DATABASE_URL" -f supabase/seed/seed.sql   # 25 demo courses, drills, badges
supabase functions deploy ai-caddie spectate
```

### Environment keys

`fairway/.env.example` documents every key: Supabase (required for sync/auth), and optional Anthropic (AI Caddie), RevenueCat, Stripe, Sentry, course-data provider, and map tiles. The app degrades gracefully when any of them are absent.

## Documentation map

| File | What's in it |
|---|---|
| [`fairway/README.md`](fairway/README.md) | App-level quick start |
| [`fairway/ARCHITECTURE.md`](fairway/ARCHITECTURE.md) | System design, offline sync, power management, Fix List coverage |
| [`fairway/DECISIONS.md`](fairway/DECISIONS.md) | Logged engineering decisions with rationale |
| [`fairway/HANDOFF.md`](fairway/HANDOFF.md) | The remaining human-only setup steps (accounts, keys, store submission) and an honest list of remaining engineering |
| [`master-prompt-golf-app.md`](master-prompt-golf-app.md) | The original end-to-end build specification |

## Status

The monorepo, rules engine (fully tested), offline sync design, Supabase schema/RLS/seed, and app scaffolding for both platforms are in place. The honest list of what still needs wiring — MapLibre satellite rendering, auth screens, the round-finish → handicap posting call — plus every account/key setup step lives in [`fairway/HANDOFF.md`](fairway/HANDOFF.md).
