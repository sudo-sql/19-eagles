# HANDOFF — the only steps that need a human

Work through these in order. Everything else is done or documented.

## 0. One-time local setup

```bash
corepack enable && pnpm install        # installs all workspaces
node --test packages/engine/test/*.test.ts   # should print 72 passing
```
(The build sandbox that produced this repo could not reach the npm registry,
so `pnpm install`, `next build`, and `expo start` were not executed here —
run them locally as your first verification step. Engine tests were run and
pass with zero dependencies.)

## 1. Supabase (~15 min, free tier fine)

1. https://supabase.com/dashboard → **New project** → name `fairway`.
2. Project Settings → API: copy **URL**, **anon key**, **service_role key**
   into `.env` files per `.env.example` (root, `apps/web/.env.local`, `apps/mobile/.env`).
3. Install CLI (`brew install supabase/tap/supabase`), then:
   ```bash
   supabase link --project-ref <ref>
   supabase db push                              # migrations 0001–0003
   psql "$DATABASE_URL" -f supabase/seed/seed.sql  # 25 demo courses
   supabase functions deploy ai-caddie spectate
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # optional (AI caddie)
   ```
4. Auth → Providers: enable **Apple**, **Google**, **Email** (magic link ON).
   Apple: needs your Apple Developer team id + Services ID (Auth docs walk through it).

## 2. Anthropic (optional — app fully functional without)

console.anthropic.com → API Keys → set as Supabase secret (step 1.3). Never in client env.

## 3. RevenueCat + store products (~30 min)

1. app.revenuecat.com → new project `Fairway` → add iOS + Android apps
   (bundle id `com.fairway.golf`).
2. Create entitlement `premium`; products `fairway_annual` ($39.99/yr),
   `fairway_monthly` ($4.99/mo) in App Store Connect & Play Console; attach both.
3. Copy the public SDK keys into `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY`.

## 4. Stripe (web billing, ~15 min)

1. dashboard.stripe.com → Products → create the two prices above; copy price ids
   into `STRIPE_PRICE_ANNUAL` / `STRIPE_PRICE_MONTHLY`.
2. Developers → API keys → `STRIPE_SECRET_KEY` + publishable key.
3. Webhooks → add endpoint `https://<your-domain>/api/stripe/webhook`
   (subscription events) → copy signing secret to `STRIPE_WEBHOOK_SECRET`.

## 5. Sentry (~10 min)

sentry.io → two projects (react-native, nextjs) → DSNs into the three SENTRY env vars.

## 6. Apple Developer + Google Play

1. developer.apple.com ($99/yr) and play.google.com/console ($25 one-time).
2. `npm i -g eas-cli && eas login`, then:
   ```bash
   cd apps/mobile
   eas build --platform ios --profile production
   eas build --platform android --profile production
   eas submit -p ios && eas submit -p android
   ```
3. App Store requires the privacy labels: location (app functionality only),
   no tracking, no third-party ads — all true by design.

## 7. Domain + Vercel

1. Buy domain (e.g. fairway.golf). 2. vercel.com → import repo → root
   `apps/web`, framework Next.js → add env vars → deploy → attach domain.

## 8. Course data licensing (optional; seed + OSM work without it)

If licensing a commercial provider (e.g. GolfCourseAPI), sign their agreement,
set `COURSE_API_PROVIDER=golfcourseapi` + `COURSE_API_KEY`, and implement the
provider adapter behind the `CourseProvider` interface (`apps/mobile/src/lib/courses.ts`)
— the seam is already there. Satellite tiles: sign up for a MapLibre-compatible
tile provider (MapTiler/Stadia) and set `*_TILE_URL_TEMPLATE`.

## 9. Legal review

`apps/web/app/privacy/page.tsx` and `terms/page.tsx` are drafts — have counsel
review before store submission (subscriptions + location data both get scrutiny).

## Known remaining engineering (honest list)

- Map rendering: MapLibre satellite view + tap-anywhere coordinate mapping is
  stubbed as a placeholder pressable in `round/[id].tsx`; wire
  `maplibre-react-native` with the tile template + offline tile packs.
- Auth screens (Apple/Google/magic-link buttons) are not yet built; Supabase
  Auth is configured and `supabase.ts` is ready.
- Round completion flow → engine handicap posting → `handicap_history` write
  exists in api-client; call it from the mobile round-finish screen.
- Watch companions (Phase 2 by design) — engine is platform-agnostic, ready.
- Store screenshots/listing copy (templates in HANDOFF once branding final).
