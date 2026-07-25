/**
 * World Handicap System — implemented per the published Rules of Handicapping.
 * Directly fixes the 18Birdies complaint (Fix #6): 9-hole scores are NEVER doubled.
 *
 * 18-hole differential: (113 ÷ slope) × (AGS − CR − PCC)                [Rule 5.1a]
 * 9-hole differential:  (113 ÷ slope9) × (AGS9 − CR9 − 0.5 × PCC),
 *   then combined with the player's EXPECTED 9-hole differential to form
 *   an 18-hole differential, rounded to one decimal (.5 up).            [Rule 5.1b, 2024 rev.]
 * Index: average of best 8 of last 20, with the small-record table,
 *   soft cap and hard cap vs. Low Handicap Index.                       [Rule 5.2, 5.7, 5.8]
 */

export interface DifferentialInput {
  adjustedGross: number;
  courseRating: number;
  slopeRating: number;
  /** Playing conditions calculation, usually 0. Range −1..+3. */
  pcc?: number;
  holes: 9 | 18;
  /** Player's handicap index at time of posting (needed for 9-hole expected score). */
  handicapIndexAtPosting?: number;
  playedAt?: string; // ISO date, for ordering + Low HI window
}

export interface ComputedDifferential {
  value: number; // 18-hole score differential, rounded to 0.1
  holes: 9 | 18;
  explanation: string; // human-readable "show your work" (Fix #6)
  raw: { nineHoleDifferential?: number; expectedNineHole?: number };
}

const round1 = (x: number) => Math.round((x + Number.EPSILON) * 10) / 10;

/**
 * Expected 9-hole score differential for a player of the given index.
 * The USGA's exact table is not published; this linear approximation
 * (HI ÷ 2 + 1.5) reproduces the USGA's own worked example
 * (HI 14.0, 9-hole SD 7.2 → 18-hole SD 15.7). Injectable for exact tables.
 */
export function defaultExpectedNineHoleDifferential(handicapIndex: number): number {
  return handicapIndex / 2 + 1.5;
}

export function scoreDifferential(
  input: DifferentialInput,
  expectedFn: (hi: number) => number = defaultExpectedNineHoleDifferential,
): ComputedDifferential {
  const pcc = input.pcc ?? 0;
  if (input.holes === 18) {
    const value = round1((113 / input.slopeRating) * (input.adjustedGross - input.courseRating - pcc));
    return {
      value, holes: 18, raw: {},
      explanation:
        `(113 ÷ ${input.slopeRating}) × (${input.adjustedGross} − ${input.courseRating}` +
        (pcc ? ` − ${pcc}` : "") + `) = ${value}`,
    };
  }
  // 9-hole: differential stays unrounded until combined with expected score.
  const nine = (113 / input.slopeRating) * (input.adjustedGross - input.courseRating - 0.5 * pcc);
  const hi = input.handicapIndexAtPosting ?? 0;
  const expected = expectedFn(hi);
  const value = round1(nine + expected);
  return {
    value, holes: 9,
    raw: { nineHoleDifferential: round1(nine), expectedNineHole: round1(expected) },
    explanation:
      `9-hole differential (113 ÷ ${input.slopeRating}) × (${input.adjustedGross} − ${input.courseRating}) = ` +
      `${round1(nine)}, plus your expected 9-hole differential at index ${hi.toFixed(1)} (${round1(expected)}) = ${value}. ` +
      `Your 9-hole score was NOT doubled.`,
  };
}

/** WHS small-record table: how many differentials count and any adjustment. [Rule 5.2a] */
export function selectionForRecordSize(n: number): { use: number; adjustment: number } {
  if (n < 3) throw new Error("A handicap index requires at least 3 differentials (54 holes).");
  if (n === 3) return { use: 1, adjustment: -2.0 };
  if (n === 4) return { use: 1, adjustment: -1.0 };
  if (n === 5) return { use: 1, adjustment: 0 };
  if (n === 6) return { use: 2, adjustment: -1.0 };
  if (n <= 8) return { use: 2, adjustment: 0 };
  if (n <= 11) return { use: 3, adjustment: 0 };
  if (n <= 14) return { use: 4, adjustment: 0 };
  if (n <= 16) return { use: 5, adjustment: 0 };
  if (n <= 18) return { use: 6, adjustment: 0 };
  if (n === 19) return { use: 7, adjustment: 0 };
  return { use: 8, adjustment: 0 };
}

export interface HandicapComputation {
  index: number;
  usedDifferentials: number[];
  allDifferentials: number[];
  recordSize: number;
  adjustment: number;
  capApplied: "none" | "soft" | "hard";
  lowHandicapIndex?: number;
  /** Full human-readable breakdown, shown in the app (Fix #6). */
  explanation: string[];
}

/**
 * Compute a WHS Handicap Index from the most recent (≤20) 18-hole differentials.
 * `differentials` must be ordered most-recent-first; only the latest 20 are used.
 */
export function handicapIndex(
  differentials: number[],
  opts: { lowHandicapIndex?: number } = {},
): HandicapComputation {
  const window = differentials.slice(0, 20);
  const { use, adjustment } = selectionForRecordSize(window.length);
  const sorted = [...window].sort((a, b) => a - b);
  const best = sorted.slice(0, use);
  const avg = best.reduce((s, d) => s + d, 0) / best.length;
  // WHS truncates (does not round) the final index to one decimal.
  let index = Math.trunc((avg + adjustment) * 10) / 10;

  const explanation: string[] = [
    `Scoring record: ${window.length} differential${window.length === 1 ? "" : "s"} (max 20).`,
    `Best ${use} of ${window.length}: ${best.map((d) => d.toFixed(1)).join(", ")} → average ${avg.toFixed(2)}.`,
  ];
  if (adjustment !== 0) explanation.push(`Small-record adjustment: ${adjustment.toFixed(1)}.`);

  let capApplied: "none" | "soft" | "hard" = "none";
  const low = opts.lowHandicapIndex;
  if (low !== undefined && index > low + 3.0) {
    // Soft cap: increase beyond 3.0 above Low HI is halved. [Rule 5.8]
    const softened = low + 3.0 + (index - (low + 3.0)) * 0.5;
    capApplied = "soft";
    // Hard cap: never more than 5.0 above Low HI.
    if (softened > low + 5.0) {
      index = low + 5.0;
      capApplied = "hard";
      explanation.push(`Hard cap: limited to Low Index ${low.toFixed(1)} + 5.0.`);
    } else {
      index = Math.trunc(softened * 10) / 10;
      explanation.push(`Soft cap: increase beyond ${(low + 3.0).toFixed(1)} halved.`);
    }
  }
  explanation.push(`Handicap Index: ${index.toFixed(1)}.`);

  return {
    index, usedDifferentials: best, allDifferentials: window,
    recordSize: window.length, adjustment, capApplied,
    lowHandicapIndex: low, explanation,
  };
}

/**
 * Convenience: full pipeline from posted rounds (mixed 9/18) to an index with
 * a complete audit trail. Rounds ordered most-recent-first.
 */
export function handicapFromRounds(
  rounds: DifferentialInput[],
  opts: { lowHandicapIndex?: number; expectedFn?: (hi: number) => number } = {},
): HandicapComputation & { perRound: ComputedDifferential[] } {
  const perRound = rounds.map((r) => scoreDifferential(r, opts.expectedFn));
  const comp = handicapIndex(perRound.map((d) => d.value), opts);
  return { ...comp, perRound };
}
