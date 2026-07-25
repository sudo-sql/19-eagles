# DECISIONS.md — running log of autonomous decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Git repo maintained in build sandbox; exported as `fairway-repo.bundle` in project root | The synced project folder's filesystem rejects git lock-file semantics; `git clone fairway-repo.bundle` restores full history. |
| 2 | Fonts: Fraunces (display serif) + Instrument Sans (UI) | Open-license (OFL) via Google Fonts; leaderboard-feel numerals; no font purchase needed. |
| 3 | Spectator round access via edge function + share_token, not anonymous RLS | Keeps RLS strictly participant-scoped; token access is auditable and rate-limited. |
| 4 | Guests in group rounds stored as `round_players.guest_name` (nullable profile) | Guest rounds claimable later per §4 auth requirement. |
| 5 | WHS 9-hole handling: 9-hole differential + expected-score for second nine (2020+ WHS rev.) | Current published WHS method; unit-tested with worked examples. Directly fixes 18Birdies' "doubled 9-hole" bug (Fix #6). |
| 6 | Strokes gained baselines: Broadie-derived scratch expected-strokes tables embedded as data | Sensor-free SG from tap-to-track shot locations, per §3 #8. |
| 7 | Offline sync: per-hole last-write-wins on `updated_at` with `client_updated_at` tiebreak; group rounds merge per player+hole | Matches §3 #16 conflict rules; simple, deterministic. |
| 8 | Maps: MapLibre (RN + web) with prefetched raster satellite tiles; tile URL behind env var | No Google Maps SDK cost/keys; tiles cached per-course for offline + battery (Fix #11, #16). |
| 9 | Course provider abstraction `CourseProvider` with `seed`, `osm`, `golfcourseapi` implementations; `none` default | §7.4; commercial licensing left for handoff. |
| 10 | Voice score entry ships behind off-by-default feature flag using on-device speech APIs | Experimental per Fix #12; core scoring path stays gimmick-free. |
| 11 | Currency: badges/streaks/club-crests only, no points economy | Fix #14 — nothing to devalue. |
| 12 | Engine tests run on `node --test` with native type-stripping (Node ≥22.6), zero deps | Build sandbox blocks the npm registry; tests stay runnable anywhere. `test/helpers/vitest-compat.ts` keeps suites vitest-compatible — swap the import to migrate. |
| 13 | Expected 9-hole score differential = HI/2 + 1.5 (injectable) | USGA does not publish the exact table; this reproduces USGA's own worked example (HI 14.0 → 18-hole SD 15.7). Swap in the licensed table via `scoreDifferential`'s `expectedFn` param when an official feed is signed. |
| 14 | Web live scoring is spectator-only via share link | Matches §4; keeps write path mobile-only where offline queue guarantees consistency. |
| 15 | Wolf scoring: lone = 2×/opponent, blind lone = 3×, partner win = 1 each | Most common house rules; configurable at game setup later without engine changes. |
| 16 | `pnpm` remains the repo's package manager; npm `workspaces` field added for compatibility | Sandbox couldn't fetch pnpm itself; on a normal machine `corepack enable && pnpm install` works as specced. |
