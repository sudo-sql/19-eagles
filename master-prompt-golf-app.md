# MASTER PROMPT — Build "Fairway" (working title): A Golf GPS, Scoring & Improvement Platform

> Hand this entire document to Claude (Fable 5) in Claude Cowork as a single instruction. Execute it end-to-end.

---

## 1. Your Role and Operating Rules

You are the sole product engineer, designer, and architect for this project. Your mission is to design and fully implement a cross-platform golf application — **native-quality iOS app, Android app, and responsive website** — that captures everything users love about 18Birdies while systematically fixing everything they complain about.

**Autonomy rules — follow these strictly:**

1. **Do not stop to ask questions.** Where a decision is needed, make the best industry-standard choice, implement it, and log it in `DECISIONS.md` with a one-line rationale. Only stop if a step is literally impossible without a human credential (see §10 for the short list of those).
2. **Build everything runnable.** Every phase must end with code that compiles, runs, and passes its tests. Never leave stubs marked "TODO" in shipped paths — implement, or implement a graceful degradation with a feature flag.
3. **Work in phases (§9), committing to git at each milestone** with descriptive messages.
4. **Self-review.** After each phase, run the test suite, lint, and a critical design pass against §6 (design system) and §3 (the fix list). Fix regressions before moving on.
5. **Document as you go**: `README.md` (setup/run instructions), `ARCHITECTURE.md`, `DECISIONS.md`, and `HANDOFF.md` (the exact remaining human steps, per §10).
6. **Use placeholder environment variables** (`.env.example`) for any secret you cannot generate yourself, with clear instructions in `HANDOFF.md` for obtaining each.

---

## 2. Product Thesis — What We Keep (the 18Birdies positives)

Preserve and improve upon these strengths. Each must exist in the MVP unless marked Phase 2:

- **A genuinely generous free tier.** GPS distances (front/center/back of green + hazards), full digital scorecard, basic stats (score, FIR, GIR, putts), and unlimited round history — free, forever, with **zero ads**.
- **Accurate on-course GPS rangefinder** with a clean hole-view map: satellite imagery, distances to any tapped point, layup arcs, and hazard carries.
- **Broad course coverage** via a licensed course-data API plus OpenStreetMap golf geometry as fallback, with an in-app "map this course" contribution flow so coverage grows organically (see §7.4).
- **Social & gamification done right (opt-in):** group rounds, live leaderboards among friends, side games (Skins, Nassau, Match Play, Wolf, Stableford, Vegas), badges/achievements, and a friends feed. All social features are opt-in and never interrupt scoring.
- **Handicap tracking** that is WHS-aligned (see §3, fix #6).
- **AI Caddie** (premium): club recommendation from the user's own tracked club distances, wind, elevation, and lie — explained in one sentence, dismissible, never modal.
- **Wearable support:** architect the mobile apps so an Apple Watch (watchOS) and Wear OS companion can be added in Phase 2 without refactoring — shared scoring/GPS logic in a platform-agnostic core module.

## 3. The Fix List — What We Repair (the documented 18Birdies negatives)

These are the aggregated complaints from reviews. Each one is a **hard requirement**, not a suggestion. Every fix must be verifiable in the final product.

| # | 18Birdies complaint | Our requirement |
|---|---|---|
| 1 | Up to 10 upsell screens before starting a round; repeated premium prompts hole-to-hole | **"Two taps to first tee":** from app open, a returning user reaches live GPS/scoring in ≤2 taps. Zero interstitials, zero upsell prompts during a round. Premium is discoverable only in Settings and one quiet, dismissible card on the home screen (dismiss = never shown again for 60 days). |
| 2 | Intrusive ads in the free tier | **No ads anywhere, ever.** Monetization is a single transparent premium tier only. |
| 3 | Cluttered, overwhelming UI; too many bells and whistles | **Ruthless information hierarchy.** Three primary tabs max (Play, Stats, Community) plus profile. Progressive disclosure: advanced tools live behind a single "More" sheet. Every screen passes a "one primary action" test. |
| 4 | Surprise charges; hard-to-cancel subscription; $99/yr felt exorbitant | Subscriptions run **only** through Apple/Google native billing (web via Stripe Checkout) — never card-on-file dark patterns. In-app "Manage/Cancel Subscription" deep-links directly to the platform cancel screen. Price the premium tier at **$39.99/yr or $4.99/mo** (undercut competitors), with a real feature-comparison table shown before purchase and a reminder notification 7 days before renewal. |
| 5 | Features silently moved from free to premium (shot tracking) | **Free-tier covenant** published in-app: GPS, scorecard, basic stats, manual shot tracking, and handicap are contractually free. Never migrate a shipped free feature behind the paywall. |
| 6 | Handicap math wrong — 9-hole scores doubled, skewing the index | Implement the **World Handicap System correctly**: score differentials = (113 ÷ slope) × (adjusted gross − course rating − PCC), best 8 of last 20, proper 9-hole handling (combine two 9-hole differentials or use the current WHS 9-hole expected-score method — implement per the latest published WHS rules and unit-test against worked examples). Show the user *how* their index was computed. |
| 7 | Entering scores for a whole group is slow and painful | **Group score entry in ≤3 seconds per hole:** one screen shows all players with +/- steppers pre-filled to par; a single confirm advances the hole. Support quick-gestures (swipe up/down on a player) and optional voice entry ("Mike 5, Sarah 4, me 6"). |
| 8 | Stats are shallow — no strokes gained, proximity, miss patterns, or benchmarks | Implement **sensor-free strokes gained** (driving/approach/short game/putting) from tap-to-track shot locations using the Broadie baseline tables, plus miss-pattern heat maps, proximity by distance band, club-distance distributions, and **benchmarking against the user's handicap band** ("your putting is 1.8 strokes worse than a typical 12-handicap"). |
| 9 | Practice features feel bolted on: no scored drills, no session tracking, no benchmarks | Build a first-class **Practice mode**: a library of 25+ scored drills (putting gates, ladder drills, up-and-down tests, wedge distance-control matrices), each with scoring rubrics, handicap-benchmarked targets, session history, streaks, and a "Practice Plan" generated from the user's worst strokes-gained category. Practice results feed the same stats engine as rounds. |
| 10 | Short game invisible — can't see strokes lost inside 100 yards | A dedicated **Inside-100 dashboard**: strokes gained around-the-green and putting, up-and-down %, sand-save %, proximity from 25/50/75/100 yards, trend lines across rounds and practice sessions. |
| 11 | Battery drain over 18 holes | **Battery budget: ≤25% phone battery per 4.5-hour round.** Adaptive GPS duty-cycling (high accuracy only when the app is foregrounded on the GPS screen or a shot is being tracked; significant-location-change otherwise), dark AMOLED-friendly theme, prefetched course tiles (no live map streaming), and an automatic low-power mode below 30% battery. |
| 12 | GPS accuracy regressions; gimmicky features ("solid shot") pushed prominently | Kalman-filtered GPS smoothing, accuracy indicator shown to the user, and **no gimmick features on the core GPS/scoring path**. Anything experimental ships behind an off-by-default toggle. |
| 13 | Score-to-par always displayed, which some golfers hate mid-round | **"Zen mode" toggle:** hide running total/score-to-par during the round; full card revealed at the end. Per-round setting, remembered. |
| 14 | Rewards currency devalued, breaking trust | If gamification currency exists, keep it cosmetic (badges, streaks, club-crests) — **never a lottery/prize economy** that can be nerfed. |
| 15 | Occasional crashes and update regressions | Crash reporting (Sentry), >80% unit-test coverage on the scoring/handicap/strokes-gained engines, E2E tests (Detox/Maestro for mobile, Playwright for web) on the critical path: sign in → start round → score 18 holes offline → sync. |
| 16 | Poor offline behavior on rural courses | **Offline-first architecture:** starting a round downloads all course data; the entire round (GPS, scoring, shot tracking) works with zero connectivity and syncs when back online, with conflict resolution (last-write-wins per hole, merge for group rounds). |

## 4. Platforms, Stack, and Architecture

Use this stack unless a dependency is genuinely unavailable — then choose the closest equivalent and log it in `DECISIONS.md`.

- **Mobile (iOS + Android):** React Native via **Expo (SDK 52+ / Expo Router)** with EAS Build profiles configured for both stores. Native modules: `expo-location` (background-capable), `react-native-mmkv` for local cache, WatermelonDB or SQLite (via `expo-sqlite` + Drizzle) for offline-first round storage, `react-native-purchases` (RevenueCat) wrapping StoreKit/Play Billing.
- **Web:** **Next.js 15 (App Router, TypeScript)** deployed-ready for Vercel. The website is a full product (dashboard, stats, round review, course explorer, account/subscription management, marketing pages), not a brochure. Live scoring on web is view-only spectator mode for shared rounds.
- **Shared core:** a TypeScript monorepo (Turborepo + pnpm) with packages: `@fairway/engine` (scoring, WHS handicap, strokes gained, side-game math — pure functions, 100% platform-agnostic, heavily unit-tested), `@fairway/api-client`, `@fairway/ui-tokens` (design tokens consumed by both RN and web).
- **Backend:** **Supabase** — Postgres (with PostGIS for course geometry), Row Level Security on every table, Realtime channels for live group leaderboards, Storage for avatars/swing videos, Edge Functions for AI-caddie inference calls and webhook handling.
- **Auth (recommended and required):** Supabase Auth with **Sign in with Apple, Google Sign-In, and email magic link/password**. Apple sign-in is mandatory for iOS App Store compliance when third-party logins exist. Sessions persist via secure storage; support anonymous "guest round" that can be claimed into an account later.
- **Data persistence:** all user data (profile, rounds, shots, practice sessions, friends, handicap history) in Postgres, synced through an offline queue on mobile. Users can export their full data (CSV/JSON) and delete their account in-app (store-compliance requirement).
- **AI Caddie & swing feedback:** call the Anthropic API from a Supabase Edge Function (never from the client) with the user's club distances + hole context; return a one-sentence recommendation. Feature-flag it so the app functions fully if no API key is configured.

## 5. Data Model (implement, extend as needed)

`users`, `profiles`, `courses`, `course_holes` (PostGIS polygons: green, fairway, bunkers, water, tee boxes), `rounds`, `round_players`, `hole_scores`, `shots` (geotagged, club, lie, result), `clubs_bag` (per-user club distances, auto-learned), `handicap_history`, `practice_drills`, `practice_sessions`, `practice_results`, `friendships`, `groups`, `side_games`, `badges`, `user_badges`, `subscriptions`. Enforce RLS: users read/write only their own data plus rounds they're a participant in; course data is public-read.

## 6. Design System — "Sleek, Modern, Golf" (deliberately NOT 18Birdies)

18Birdies is a bright white/light-blue, dense, card-cluttered UI. We go the opposite direction while keeping the *feel* familiar (bottom tabs, hole-by-hole flow, friendly social touches):

- **Aesthetic direction:** premium, editorial, calm. Think modern clubhouse meets sports-performance app.
- **Palette:** deep "midnight fairway" green (`#0B2818`-family) and warm charcoal as the base; off-white cream (`#F5F1E8`) surfaces; a single accent — **augusta gold** (`#C9A227`) — for CTAs and highlights; semantic red/green only for over/under par. Full dark mode is the default on-course theme (AMOLED battery win, §3 #11); light "clubhouse" theme for browsing/stats.
- **Typography:** a confident display serif or high-contrast grotesque for numerals and headers (score numerals should feel like a leaderboard), a clean geometric sans for UI. Big, glanceable yardage numbers — readable in sunlight at arm's length (minimum 64pt for the primary distance).
- **Texture & motion:** subtle topographic contour-line motifs, restrained micro-animations (score tick, birdie celebration ≤800ms, skippable). No confetti storms, no modal celebrations.
- **Layout:** generous whitespace, max one primary action per screen, 8pt grid, large touch targets (≥48px — users wear golf gloves).
- **Iconography:** custom thin-line golf set (flag, tee, wedge, green contour). No stock emoji.
- Codify all of this in `@fairway/ui-tokens` and apply the frontend-design skill's principles: the result must not look like a template.

## 7. Feature Specification (MVP scope unless marked P2)

### 7.1 Play (core loop)
Course search (GPS-nearby first) → tee selection → optional group setup → live hole view: satellite map, F/C/B distances, tap-anywhere distance, hazard carries, shot tracking (tap "I'm hitting" → auto-detect distance walked), fast group scoring (§3 #7), side games running in background, Zen mode (§3 #13). Full offline (§3 #16).

### 7.2 Stats & Improvement
Post-round summary → strokes gained engine (§3 #8) → Inside-100 dashboard (§3 #10) → trends, club distances, handicap page with WHS math shown (§3 #6).

### 7.3 Practice
Scored drill library, benchmarked targets, generated practice plans, session logging (§3 #9).

### 7.4 Courses
Licensed course-data API integration (e.g., GolfCourseAPI or similar — abstract behind a `CourseProvider` interface); OSM golf-feature import as fallback; user "map this course" flow (draw tees/greens on satellite imagery, admin-moderated). Seed the database with at least 25 fully-mapped demo courses for testing, including realistic geometry.

### 7.5 Community (opt-in)
Friends, group rounds with live leaderboards (Supabase Realtime), badges, shared round recaps (a beautiful, share-to-social image card). Private by default (§3 #14; account privacy toggle).

### 7.6 Premium ($39.99/yr)
AI Caddie, green slope/contour view, advanced filters on stats, swing video storage + AI feedback (P2), plays-like distances (wind/elevation). Everything else stays free (§3 #5 covenant).

### 7.7 Website specifics
Marketing landing page (with the design system, App Store/Play badges), full authenticated dashboard mirroring Stats/Practice/Community, round spectator view via share link, account + subscription management, privacy policy & terms pages (draft reasonable boilerplate, flag for legal review in `HANDOFF.md`).

## 8. Non-Functional Requirements

- Cold start ≤2s on mid-range devices; GPS screen at 60fps.
- Battery budget per §3 #11 — include a written power-management strategy in `ARCHITECTURE.md`.
- Accessibility: WCAG AA contrast, dynamic type support, VoiceOver/TalkBack labels on the scoring flow.
- Privacy: location used only during active rounds (while-in-use + optional background with clear consent), no data sale, GDPR/CCPA export & delete in-app.
- Security: RLS everywhere, no secrets in clients, rate-limited edge functions.
- Store compliance: Apple sign-in offered, account deletion in-app, subscription disclosures, no misleading review prompts (ask only after a completed, crash-free round, max once per 90 days).

## 9. Execution Phases (complete in order; commit + test at each)

1. **Foundation:** monorepo, design tokens, Supabase schema + RLS + migrations, auth flows on all three platforms.
2. **Engine:** `@fairway/engine` — scoring, WHS handicap (with worked-example unit tests), side games, strokes gained (Broadie baselines), drill scoring. ≥80% coverage.
3. **Play loop (mobile):** course view, GPS, scorecard, group scoring, offline sync.
4. **Stats & Practice (mobile + web).**
5. **Community & Realtime.**
6. **Premium & billing (RevenueCat + Stripe on web), feature flags.**
7. **Website marketing + dashboard polish.**
8. **Hardening:** E2E suites, crash reporting, performance/battery audit, accessibility pass, seed data, screenshots for store listings.
9. **Handoff:** finalize `HANDOFF.md`, EAS build configs, store-listing copy and asset specs, `.env.example` with acquisition instructions for every key.

## 10. The Only Things You May Leave for the Human

Everything else you do yourself. Leave only these, precisely documented in `HANDOFF.md`:

1. Creating Apple Developer ($99/yr) and Google Play ($25) accounts and running the documented `eas build`/`eas submit` commands.
2. Creating the Supabase project, Stripe, RevenueCat, Sentry, and Anthropic API accounts and pasting keys into `.env` (provide exact click-paths).
3. Purchasing the domain and connecting the prepared Vercel deployment.
4. Signing course-data API licensing if a commercial provider is chosen.
5. Legal review of the drafted privacy policy/terms.

## 11. Definition of Done

The project is complete when: all phases are committed; `pnpm test` and E2E suites pass; the web app runs with `pnpm dev` and deploys cleanly; both mobile apps run in Expo (dev build) end-to-end — a new user can sign up with email, start a round on a seeded course fully offline, score a 4-player group round with side games, sync, view strokes-gained stats and the Inside-100 dashboard, complete a scored practice drill, and see a correct WHS handicap from mixed 9- and 18-hole rounds — and every row of the Fix List table in §3 can be demonstrated in the running product.
