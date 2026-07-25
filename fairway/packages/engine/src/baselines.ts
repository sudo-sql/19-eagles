/**
 * Expected-strokes baselines for sensor-free strokes gained, derived from
 * Mark Broadie's published PGA Tour benchmark tables ("Every Shot Counts").
 * Distances in YARDS except putting, which is in FEET.
 * Values between anchor points are linearly interpolated.
 */

type Anchor = [distance: number, expectedStrokes: number];

const interp = (table: Anchor[], d: number): number => {
  if (d <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (d >= last[0]) {
    // extrapolate gently past the table using the final segment's slope
    const [x1, y1] = table[table.length - 2];
    const slope = (last[1] - y1) / (last[0] - x1);
    return last[1] + (d - last[0]) * slope;
  }
  for (let i = 1; i < table.length; i++) {
    const [x2, y2] = table[i];
    if (d <= x2) {
      const [x1, y1] = table[i - 1];
      return y1 + ((d - x1) / (x2 - x1)) * (y2 - y1);
    }
  }
  return last[1];
};

/** Off the tee (par 4/5). */
const TEE: Anchor[] = [
  [100, 2.92], [120, 2.99], [140, 2.97], [160, 2.99], [180, 3.05],
  [200, 3.12], [220, 3.17], [240, 3.25], [260, 3.45], [280, 3.65],
  [300, 3.71], [320, 3.79], [340, 3.86], [360, 3.92], [380, 3.96],
  [400, 3.99], [420, 4.02], [440, 4.08], [460, 4.17], [480, 4.28],
  [500, 4.41], [520, 4.54], [540, 4.65], [560, 4.74], [580, 4.79], [600, 4.82],
];

const FAIRWAY: Anchor[] = [
  [10, 2.18], [20, 2.40], [30, 2.52], [40, 2.60], [50, 2.66], [60, 2.70],
  [70, 2.72], [80, 2.75], [90, 2.77], [100, 2.80], [120, 2.85], [140, 2.91],
  [160, 2.98], [180, 3.08], [200, 3.19], [220, 3.32], [240, 3.42], [260, 3.53],
  [280, 3.62], [300, 3.71], [320, 3.79], [340, 3.86], [360, 3.92], [380, 3.96],
  [400, 3.99], [450, 4.25], [500, 4.53], [550, 4.78], [600, 5.00],
];

const ROUGH: Anchor[] = [
  [10, 2.34], [20, 2.59], [30, 2.70], [40, 2.78], [50, 2.87], [60, 2.91],
  [70, 2.93], [80, 2.96], [90, 2.99], [100, 3.02], [120, 3.08], [140, 3.15],
  [160, 3.23], [180, 3.31], [200, 3.42], [220, 3.53], [240, 3.64], [260, 3.74],
  [280, 3.83], [300, 3.90], [320, 3.98], [340, 4.06], [360, 4.14], [380, 4.22],
  [400, 4.30], [450, 4.52], [500, 4.80], [550, 5.06], [600, 5.30],
];

const SAND: Anchor[] = [
  [10, 2.43], [20, 2.53], [30, 2.66], [40, 2.82], [50, 2.92], [60, 3.15],
  [70, 3.21], [80, 3.24], [90, 3.24], [100, 3.23], [120, 3.21], [140, 3.22],
  [160, 3.28], [180, 3.40], [200, 3.55], [220, 3.70], [240, 3.84], [260, 3.93],
  [280, 4.00], [300, 4.04], [320, 4.12], [340, 4.26], [360, 4.41], [380, 4.55],
  [400, 4.69], [450, 5.02], [500, 5.32], [550, 5.57], [600, 5.80],
];

const RECOVERY: Anchor[] = [
  [100, 3.79], [120, 3.78], [140, 3.80], [160, 3.81], [180, 3.82], [200, 3.87],
  [220, 3.92], [240, 3.97], [260, 4.03], [280, 4.10], [300, 4.20], [320, 4.31],
  [340, 4.44], [360, 4.56], [380, 4.66], [400, 4.75], [450, 4.97], [500, 5.11],
  [550, 5.24], [600, 5.36],
];

/** Putting, distance in FEET. */
const GREEN: Anchor[] = [
  [1, 1.001], [2, 1.009], [3, 1.053], [4, 1.13], [5, 1.23], [6, 1.34],
  [7, 1.42], [8, 1.50], [9, 1.56], [10, 1.61], [15, 1.78], [20, 1.87],
  [30, 1.98], [40, 2.06], [50, 2.14], [60, 2.21], [90, 2.40],
];

export type BaselineLie = "tee" | "fairway" | "rough" | "sand" | "recovery" | "green";

const TABLES: Record<BaselineLie, Anchor[]> = {
  tee: TEE, fairway: FAIRWAY, rough: ROUGH, sand: SAND, recovery: RECOVERY, green: GREEN,
};

/**
 * Expected strokes to hole out from `distance` (yards; FEET on green) and lie,
 * for the PGA Tour baseline.
 */
export function expectedStrokes(lie: BaselineLie, distance: number): number {
  if (distance <= 0) return 0;
  return interp(TABLES[lie], distance);
}

/**
 * Typical total strokes-gained-per-round deficit vs the PGA baseline, by
 * handicap band and category — used for "your putting is X strokes worse than
 * a typical 12-handicap" benchmarks (Fix #8). Derived from Broadie's amateur
 * benchmark distributions (approximate category split of total deficit).
 */
export const HANDICAP_BAND_BENCHMARKS: Record<
  string,
  { driving: number; approach: number; shortGame: number; putting: number }
> = {
  scratch: { driving: -1.2, approach: -2.1, shortGame: -1.1, putting: -0.9 },
  "5": { driving: -1.9, approach: -3.2, shortGame: -1.7, putting: -1.4 },
  "10": { driving: -2.6, approach: -4.5, shortGame: -2.3, putting: -1.9 },
  "15": { driving: -3.4, approach: -5.9, shortGame: -3.0, putting: -2.4 },
  "20": { driving: -4.2, approach: -7.2, shortGame: -3.8, putting: -3.0 },
  "25": { driving: -5.0, approach: -8.6, shortGame: -4.6, putting: -3.6 },
};

export function benchmarkForIndex(handicapIndex: number) {
  if (handicapIndex <= 2) return HANDICAP_BAND_BENCHMARKS.scratch;
  if (handicapIndex <= 7) return HANDICAP_BAND_BENCHMARKS["5"];
  if (handicapIndex <= 12) return HANDICAP_BAND_BENCHMARKS["10"];
  if (handicapIndex <= 17) return HANDICAP_BAND_BENCHMARKS["15"];
  if (handicapIndex <= 22) return HANDICAP_BAND_BENCHMARKS["20"];
  return HANDICAP_BAND_BENCHMARKS["25"];
}
