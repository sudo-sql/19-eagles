/**
 * Practice mode (Fix #9): 25+ scored drills with rubrics and
 * handicap-benchmarked targets, plus Practice Plan generation from the
 * player's worst strokes-gained category.
 */
import type { SGCategory } from "./types.ts";

export type DrillCategory = "putting" | "short_game" | "wedges" | "approach" | "driving";

export interface DrillTargets {
  /** Target score by handicap band; keys: "scratch" | "5" | "10" | "15" | "20" | "25". */
  [band: string]: number;
}

export interface Drill {
  slug: string;
  title: string;
  category: DrillCategory;
  description: string;
  /** How raw reps become a 0–100 score. */
  scoring: "percent_success" | "points" | "distance_error";
  reps: number;
  estMinutes: number;
  targets: DrillTargets;
}

const T = (scratch: number, h5: number, h10: number, h15: number, h20: number, h25: number): DrillTargets =>
  ({ scratch, "5": h5, "10": h10, "15": h15, "20": h20, "25": h25 });

export const DRILLS: Drill[] = [
  // ---- Putting (7) ----
  { slug: "gate-3ft", title: "3-Foot Gate", category: "putting", scoring: "percent_success", reps: 20, estMinutes: 10,
    description: "20 putts from 3ft through a tee gate one putter-head wide. Score = % holed.", targets: T(95, 90, 85, 75, 65, 55) },
  { slug: "circle-5ft", title: "5-Foot Circle", category: "putting", scoring: "percent_success", reps: 12, estMinutes: 12,
    description: "12 putts from 5ft around the hole (clock drill). Score = % holed.", targets: T(85, 75, 65, 55, 45, 35) },
  { slug: "ladder-lag", title: "Lag Ladder 20/30/40", category: "putting", scoring: "points", reps: 9, estMinutes: 12,
    description: "3 putts each from 20/30/40ft. 3pts inside 2ft, 1pt inside 3ft. Score = points ÷ max.", targets: T(80, 70, 60, 50, 42, 35) },
  { slug: "no-three-putt-18", title: "18-Hole No-3-Putt", category: "putting", scoring: "percent_success", reps: 18, estMinutes: 20,
    description: "18 lag putts from 25–50ft. Success = 2 putts or fewer.", targets: T(95, 90, 85, 78, 70, 60) },
  { slug: "breaker-8ft", title: "Breaking 8-Footers", category: "putting", scoring: "percent_success", reps: 16, estMinutes: 15,
    description: "16 putts from 8ft, 4 from each compass point of a sloped hole.", targets: T(60, 52, 45, 38, 30, 25) },
  { slug: "speed-control-40", title: "Dead-Weight 40s", category: "putting", scoring: "percent_success", reps: 10, estMinutes: 10,
    description: "10 putts from 40ft finishing in a 3ft-past window. Never short.", targets: T(80, 70, 60, 50, 42, 35) },
  { slug: "one-hand-6ft", title: "One-Hand Release", category: "putting", scoring: "percent_success", reps: 10, estMinutes: 8,
    description: "10 trail-hand-only putts from 6ft to train release.", targets: T(70, 60, 50, 42, 35, 28) },

  // ---- Short game (7) ----
  { slug: "updown-test", title: "Up-&-Down Test", category: "short_game", scoring: "percent_success", reps: 9, estMinutes: 25,
    description: "9 balls from varied greenside lies. Success = hole out in ≤2 (chip + putt).", targets: T(67, 55, 44, 33, 25, 18) },
  { slug: "landing-towel", title: "Landing-Spot Towel", category: "short_game", scoring: "percent_success", reps: 15, estMinutes: 15,
    description: "15 chips landing on a towel at your chosen spot. Score = % on towel.", targets: T(60, 50, 40, 33, 26, 20) },
  { slug: "sand-save-9", title: "Sand Save Nine", category: "short_game", scoring: "percent_success", reps: 9, estMinutes: 20,
    description: "9 bunker shots. Success = ball inside 9ft.", targets: T(55, 45, 35, 27, 20, 14) },
  { slug: "par-18", title: "Par-18 Short Course", category: "short_game", scoring: "points", reps: 9, estMinutes: 30,
    description: "9 greenside holes, par 2 each. Score = (36 − strokes over 18) mapped to 100.", targets: T(78, 67, 56, 47, 39, 31) },
  { slug: "flop-carry", title: "Flop Carry Control", category: "short_game", scoring: "percent_success", reps: 10, estMinutes: 15,
    description: "10 flop shots carrying a bag 5yd away, stopping inside 12ft.", targets: T(50, 40, 32, 25, 18, 12) },
  { slug: "chip-3-clubs", title: "Three-Club Chipping", category: "short_game", scoring: "percent_success", reps: 12, estMinutes: 15,
    description: "Same target with PW/9i/8i, 4 balls each. Success = inside 6ft.", targets: T(58, 48, 40, 32, 25, 18) },
  { slug: "worst-lie-updown", title: "Worst-Lie Up-&-Down", category: "short_game", scoring: "percent_success", reps: 6, estMinutes: 15,
    description: "6 balls thrown into trouble; play them as they lie. Success = up-and-down.", targets: T(45, 35, 27, 20, 14, 9) },

  // ---- Wedges (5) ----
  { slug: "wedge-matrix", title: "Wedge Distance Matrix", category: "wedges", scoring: "distance_error", reps: 12, estMinutes: 25,
    description: "3 balls each to 40/60/80/100yd targets. Score from average % distance error.", targets: T(82, 74, 66, 58, 50, 42) },
  { slug: "clock-swings", title: "Clock-Face Carries", category: "wedges", scoring: "distance_error", reps: 9, estMinutes: 20,
    description: "9:00/10:30/12:00 swings with one wedge, 3 balls each; call carry before each.", targets: T(80, 72, 64, 56, 48, 40) },
  { slug: "trajectory-windows", title: "Trajectory Windows", category: "wedges", scoring: "percent_success", reps: 12, estMinutes: 20,
    description: "12 shots alternating low/mid/high to one 60yd target; success = correct window + inside 20ft.", targets: T(55, 46, 38, 30, 23, 17) },
  { slug: "one-ball-course", title: "One-Ball Wedge Course", category: "wedges", scoring: "points", reps: 10, estMinutes: 25,
    description: "10 random distances 30–110yd, one ball each. 3pts <10ft, 2pts <20ft, 1pt on green.", targets: T(75, 66, 57, 48, 40, 32) },
  { slug: "spin-check", title: "Check-and-Release", category: "wedges", scoring: "percent_success", reps: 10, estMinutes: 15,
    description: "10 half-wedges that stop within 6ft of pitch mark.", targets: T(50, 42, 34, 27, 20, 14) },

  // ---- Approach (4) ----
  { slug: "gir-sim-9", title: "9-Hole GIR Simulator", category: "approach", scoring: "percent_success", reps: 9, estMinutes: 25,
    description: "9 approaches at range targets matching your course's approach distances. Success = on 'green' window.", targets: T(67, 55, 44, 36, 28, 20) },
  { slug: "nine-shot", title: "Nine-Shot Drill", category: "approach", scoring: "percent_success", reps: 9, estMinutes: 20,
    description: "Draw/straight/fade × low/mid/high with a 7-iron. Success = called shape flies.", targets: T(55, 44, 33, 25, 18, 12) },
  { slug: "proximity-150", title: "150 Proximity", category: "approach", scoring: "distance_error", reps: 10, estMinutes: 20,
    description: "10 balls to a 150yd target; score from average proximity.", targets: T(78, 70, 61, 52, 44, 36) },
  { slug: "long-iron-fairway", title: "Long-Iron Fairway Finder", category: "approach", scoring: "percent_success", reps: 10, estMinutes: 15,
    description: "10 shots with 4/5-iron into a 25yd-wide fairway window.", targets: T(70, 60, 50, 40, 32, 24) },

  // ---- Driving (4) ----
  { slug: "fairway-14", title: "14 Fairways", category: "driving", scoring: "percent_success", reps: 14, estMinutes: 25,
    description: "14 drives into a 35yd-wide window (your course's average fairway).", targets: T(71, 62, 53, 45, 37, 29) },
  { slug: "shot-shape-tee", title: "Tee-Shot Shapes", category: "driving", scoring: "percent_success", reps: 10, estMinutes: 20,
    description: "Alternate called fades and draws off the tee. Success = called curve, playable line.", targets: T(60, 50, 40, 31, 24, 17) },
  { slug: "pressure-driver", title: "Pressure Ladder", category: "driving", scoring: "points", reps: 10, estMinutes: 20,
    description: "Consecutive fairway hits build points (1,2,3...); a miss resets. Score = best streak points ÷ max.", targets: T(55, 45, 36, 28, 21, 15) },
  { slug: "tempo-75", title: "75% Tempo Drives", category: "driving", scoring: "percent_success", reps: 10, estMinutes: 15,
    description: "10 drives at 75% effort into the window — trains sequencing.", targets: T(75, 66, 57, 48, 40, 32) },
];

// 27 drills total.

export interface DrillResultInput {
  drillSlug: string;
  /** percent_success: successes; points: raw points; distance_error: avg % error (0–100). */
  raw: number;
  /** For points scoring: the max achievable points. */
  maxPoints?: number;
}

export function scoreDrill(input: DrillResultInput): { score: number; drill: Drill } {
  const drill = DRILLS.find((d) => d.slug === input.drillSlug);
  if (!drill) throw new Error(`Unknown drill: ${input.drillSlug}`);
  let score: number;
  switch (drill.scoring) {
    case "percent_success":
      score = (input.raw / drill.reps) * 100;
      break;
    case "points":
      if (!input.maxPoints) throw new Error("maxPoints required for points-scored drills");
      score = (input.raw / input.maxPoints) * 100;
      break;
    case "distance_error":
      score = Math.max(0, 100 - input.raw * 4); // 0% err → 100; 25% err → 0
      break;
  }
  return { score: Math.round(Math.min(100, Math.max(0, score)) * 10) / 10, drill };
}

export function bandForIndex(handicapIndex: number): string {
  if (handicapIndex <= 2) return "scratch";
  if (handicapIndex <= 7) return "5";
  if (handicapIndex <= 12) return "10";
  if (handicapIndex <= 17) return "15";
  if (handicapIndex <= 22) return "20";
  return "25";
}

/** Delta vs the target for the player's handicap band. Positive = beat the benchmark. */
export function benchmarkDelta(score: number, drill: Drill, handicapIndex: number): number {
  return Math.round((score - drill.targets[bandForIndex(handicapIndex)]) * 10) / 10;
}

const SG_TO_DRILL_CATEGORIES: Record<SGCategory, DrillCategory[]> = {
  putting: ["putting"],
  shortGame: ["short_game", "wedges"],
  approach: ["approach", "wedges"],
  driving: ["driving"],
};

/**
 * Practice Plan: prioritize the worst strokes-gained category, mixing in one
 * maintenance drill from the best category. Deterministic given inputs.
 */
export function generatePracticePlan(
  worstCategory: SGCategory,
  opts: { minutes?: number; recentSlugs?: string[]; bestCategory?: SGCategory } = {},
): Drill[] {
  const { minutes = 60, recentSlugs = [], bestCategory } = opts;
  const pool = DRILLS
    .filter((d) => SG_TO_DRILL_CATEGORIES[worstCategory].includes(d.category))
    .sort((a, b) => (recentSlugs.includes(a.slug) ? 1 : 0) - (recentSlugs.includes(b.slug) ? 1 : 0));
  const plan: Drill[] = [];
  let budget = minutes;
  for (const d of pool) {
    if (d.estMinutes <= budget - (bestCategory ? 10 : 0)) {
      plan.push(d);
      budget -= d.estMinutes;
    }
    if (plan.length >= 3) break;
  }
  if (bestCategory && budget >= 8) {
    const maint = DRILLS.find(
      (d) => SG_TO_DRILL_CATEGORIES[bestCategory].includes(d.category) && d.estMinutes <= budget && !plan.includes(d),
    );
    if (maint) plan.push(maint);
  }
  return plan;
}
