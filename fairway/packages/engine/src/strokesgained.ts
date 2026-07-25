/**
 * Sensor-free strokes gained from tap-to-track shot locations (Fix #8).
 * SG(shot) = E[strokes from start] − E[strokes from result] − 1 − penalties.
 * Categories follow Broadie: driving (par 4/5 tee shots), approach (non-tee
 * shots >30yd not on green... plus par-3 tee shots), short game (≤30yd around
 * green, not on green), putting (on green).
 */
import { expectedStrokes, benchmarkForIndex, type BaselineLie } from "./baselines.ts";
import type { SGCategory, Shot } from "./types.ts";

const SHORT_GAME_MAX_YARDS = 30;

export function categorizeShot(shot: Shot, holePar: number): SGCategory {
  if (shot.lie === "green") return "putting";
  if (shot.lie === "tee") return holePar >= 4 ? "driving" : "approach";
  if (shot.distanceToHole <= SHORT_GAME_MAX_YARDS) return "shortGame";
  return "approach";
}

function toBaselineLie(lie: Shot["lie"]): BaselineLie {
  if (lie === "penalty") return "rough"; // dropped ball approximation
  return lie;
}

export interface ShotSG {
  shot: Shot;
  category: SGCategory;
  strokesGained: number;
  expectedBefore: number;
  expectedAfter: number;
}

export function strokesGainedForShot(shot: Shot, holePar: number): ShotSG {
  const before = expectedStrokes(toBaselineLie(shot.lie), shot.distanceToHole);
  const after =
    shot.resultLie === "holed" || shot.resultDistanceToHole <= 0
      ? 0
      : expectedStrokes(toBaselineLie(shot.resultLie), shot.resultDistanceToHole);
  const penalties = shot.penaltyStrokes ?? 0;
  const sg = before - after - 1 - penalties;
  return {
    shot,
    category: categorizeShot(shot, holePar),
    strokesGained: Math.round(sg * 1000) / 1000,
    expectedBefore: before,
    expectedAfter: after,
  };
}

export interface RoundSG {
  total: number;
  byCategory: Record<SGCategory, number>;
  shots: ShotSG[];
}

export function strokesGainedForRound(
  shots: Shot[],
  parByHole: Record<number, number>,
): RoundSG {
  const byCategory: Record<SGCategory, number> = { driving: 0, approach: 0, shortGame: 0, putting: 0 };
  const detailed = shots.map((s) => strokesGainedForShot(s, parByHole[s.holeNumber] ?? 4));
  for (const d of detailed) byCategory[d.category] += d.strokesGained;
  for (const k of Object.keys(byCategory) as SGCategory[]) {
    byCategory[k] = Math.round(byCategory[k] * 100) / 100;
  }
  const total = Math.round(detailed.reduce((s, d) => s + d.strokesGained, 0) * 100) / 100;
  return { total, byCategory, shots: detailed };
}

/**
 * Benchmark a round vs the player's handicap band:
 * "your putting is 1.8 strokes worse than a typical 12-handicap".
 */
export function benchmarkRound(round: RoundSG, handicapIndex: number) {
  const bench = benchmarkForIndex(handicapIndex);
  const delta = (cat: SGCategory) => Math.round((round.byCategory[cat] - bench[cat]) * 10) / 10;
  return {
    driving: delta("driving"),
    approach: delta("approach"),
    shortGame: delta("shortGame"),
    putting: delta("putting"),
    /** Category costing the most strokes vs peers — feeds the Practice Plan. */
    worstCategory: (Object.keys(round.byCategory) as SGCategory[]).sort(
      (a, b) => (round.byCategory[a] - bench[a]) - (round.byCategory[b] - bench[b]),
    )[0],
  };
}

// ---------- Inside-100 dashboard (Fix #10) ----------

export interface Inside100Stats {
  sgShortGame: number;
  sgPutting: number;
  upAndDownPct: number | null;
  sandSavePct: number | null;
  proximityByBand: Record<"25" | "50" | "75" | "100", number | null>; // avg result distance, feet
}

export function inside100Stats(rounds: RoundSG[], holesWithShortShots?: Shot[][]): Inside100Stats {
  const sgShort = avg(rounds.map((r) => r.byCategory.shortGame));
  const sgPutt = avg(rounds.map((r) => r.byCategory.putting));

  let udAttempts = 0, udConversions = 0, sandAttempts = 0, sandSaves = 0;
  const bands: Record<"25" | "50" | "75" | "100", number[]> = { 25: [], 50: [], 75: [], 100: [] };

  for (const round of rounds) {
    // Group shots per hole to detect up-and-downs.
    const byHole = new Map<number, ShotSG[]>();
    for (const s of round.shots) {
      const arr = byHole.get(s.shot.holeNumber) ?? [];
      arr.push(s);
      byHole.set(s.shot.holeNumber, arr);
    }
    for (const holeShots of byHole.values()) {
      holeShots.sort((a, b) => a.shot.shotNumber - b.shot.shotNumber);
      for (let i = 0; i < holeShots.length; i++) {
        const s = holeShots[i].shot;
        if (s.lie !== "green" && s.lie !== "tee" && s.distanceToHole <= SHORT_GAME_MAX_YARDS) {
          // Up-and-down attempt: greenside shot; converted if total strokes from here ≤2.
          const remaining = holeShots.length - i;
          udAttempts++;
          if (remaining <= 2) udConversions++;
          if (s.lie === "sand") { sandAttempts++; if (remaining <= 2) sandSaves++; }
        }
        // Proximity bands (result distance in feet after wedge shots from 25-100yd)
        if (s.lie !== "green" && s.lie !== "tee") {
          const d = s.distanceToHole;
          const band = d <= 25 ? "25" : d <= 50 ? "50" : d <= 75 ? "75" : d <= 100 ? "100" : null;
          if (band && s.resultLie === "green") bands[band].push(s.resultDistanceToHole);
        }
      }
    }
  }
  const pct = (n: number, d: number) => (d === 0 ? null : Math.round((n / d) * 1000) / 10);
  return {
    sgShortGame: Math.round(sgShort * 100) / 100,
    sgPutting: Math.round(sgPutt * 100) / 100,
    upAndDownPct: pct(udConversions, udAttempts),
    sandSavePct: pct(sandSaves, sandAttempts),
    proximityByBand: {
      25: avgOrNull(bands[25]), 50: avgOrNull(bands[50]),
      75: avgOrNull(bands[75]), 100: avgOrNull(bands[100]),
    },
  };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const avgOrNull = (xs: number[]) => (xs.length ? Math.round(avg(xs) * 10) / 10 : null);

/** Miss-pattern buckets for heat maps (Fix #8): result direction relative to target. */
export type MissDirection = "long" | "short" | "left" | "right" | "holed_or_close";
export function missDirection(bearingToTargetDeg: number, bearingOfMissDeg: number, missDistanceFt: number): MissDirection {
  if (missDistanceFt <= 6) return "holed_or_close";
  let rel = (bearingOfMissDeg - bearingToTargetDeg + 540) % 360 - 180; // −180..180
  if (rel > -45 && rel <= 45) return "long";
  if (rel > 45 && rel <= 135) return "right";
  if (rel > -135 && rel <= -45) return "left";
  return "short";
}
