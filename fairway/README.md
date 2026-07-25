# Fairway — golf GPS, scoring & improvement

Everything 18Birdies gets right, with everything golfers complain about fixed:
no ads ever, two taps to the first tee, a WHS handicap that handles 9-hole
rounds correctly (and shows its work), real strokes-gained analytics, a
first-class practice mode, and a $39.99/yr premium tier that never cannibalizes
the free product.

## Layout (Turborepo + pnpm)

```
apps/mobile        Expo SDK 52 + Expo Router (iOS & Android)
apps/web           Next.js 15 App Router (marketing + dashboard + spectator)
packages/engine    Pure-TS rules engine: scoring, WHS, side games, strokes
                   gained (Broadie baselines), 27 scored practice drills, geo
packages/ui-tokens Design system tokens (RN + Tailwind preset)
packages/api-client Typed Supabase layer + Realtime leaderboards
supabase/          SQL migrations (PostGIS + RLS), edge functions, seed
e2e/               Playwright (web) + Maestro (mobile) critical-path suites
```

## Quick start

```bash
corepack enable && pnpm install

# Engine tests — zero dependencies, run anywhere with Node ≥ 22.6:
node --test packages/engine/test/*.test.ts

# Web:
cp .env.example apps/web/.env.local   # fill Supabase keys (see HANDOFF.md)
pnpm --filter @fairway/web dev        # http://localhost:3000

# Mobile:
cp .env.example apps/mobile/.env      # EXPO_PUBLIC_* keys
pnpm --filter @fairway/mobile dev     # Expo dev server

# Database (after creating a Supabase project, see HANDOFF.md):
supabase db push                      # applies migrations 0001–0003
node supabase/seed/generate-seed.ts > supabase/seed/seed.sql
psql "$DATABASE_URL" -f supabase/seed/seed.sql   # 25 demo courses, drills, badges
```

Every integration is feature-flagged: with no keys configured the apps run in
full offline/guest mode (GPS, scoring, stats, practice all work).

## Git history

The synced folder's filesystem can't host a live `.git`, so the repository
ships as `fairway-repo.bundle` (full history):

```bash
git clone fairway-repo.bundle fairway && cd fairway
```

## The Fix List

All sixteen documented 18Birdies complaints are hard requirements; see
`ARCHITECTURE.md` §"Fix List coverage" for where each is implemented and how
to verify it.
