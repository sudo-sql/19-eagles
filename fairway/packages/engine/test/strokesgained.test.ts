import { describe, expect, it } from "./helpers/vitest-compat.ts";
import { expectedStrokes } from "../src/baselines.ts";
import {
  benchmarkRound, categorizeShot, inside100Stats, missDirection,
  strokesGainedForRound, strokesGainedForShot,
} from "../src/strokesgained.ts";
import type { Shot } from "../src/types.ts";

describe("baseline tables", () => {
  it("matches known Broadie anchors", () => {
    expect(expectedStrokes("fairway", 100)).toBeCloseTo(2.8, 2);
    expect(expectedStrokes("green", 10)).toBeCloseTo(1.61, 2);
    expect(expectedStrokes("tee", 400)).toBeCloseTo(3.99, 2);
  });
  it("interpolates between anchors monotonically", () => {
    expect(expectedStrokes("fairway", 150)).toBeGreaterThan(expectedStrokes("fairway", 140));
    expect(expectedStrokes("fairway", 150)).toBeLessThan(expectedStrokes("fairway", 160));
  });
});

describe("strokes gained per shot", () => {
  it("a holed 15ft putt gains E[15ft] − 1", () => {
    const shot: Shot = { holeNumber: 1, shotNumber: 3, distanceToHole: 15, lie: "green", resultDistanceToHole: 0, resultLie: "holed" };
    const sg = strokesGainedForShot(shot, 4);
    expect(sg.category).toBe("putting");
    expect(sg.strokesGained).toBeCloseTo(1.78 - 1, 2);
  });
  it("a chunked approach loses strokes", () => {
    const shot: Shot = { holeNumber: 1, shotNumber: 2, distanceToHole: 150, lie: "fairway", resultDistanceToHole: 80, resultLie: "fairway" };
    const sg = strokesGainedForShot(shot, 4);
    expect(sg.strokesGained).toBeLessThan(0);
  });
  it("penalty strokes subtract fully", () => {
    const clean: Shot = { holeNumber: 1, shotNumber: 1, distanceToHole: 400, lie: "tee", resultDistanceToHole: 150, resultLie: "fairway" };
    const wet: Shot = { ...clean, penaltyStrokes: 1 };
    expect(strokesGainedForShot(clean, 4).strokesGained - strokesGainedForShot(wet, 4).strokesGained).toBeCloseTo(1, 5);
  });
  it("categorizes: par-3 tee shot is approach; 25yd pitch is short game", () => {
    const tee3: Shot = { holeNumber: 3, shotNumber: 1, distanceToHole: 175, lie: "tee", resultDistanceToHole: 20, resultLie: "green" };
    expect(categorizeShot(tee3, 3)).toBe("approach");
    const pitch: Shot = { holeNumber: 4, shotNumber: 3, distanceToHole: 25, lie: "rough", resultDistanceToHole: 6, resultLie: "green" };
    expect(categorizeShot(pitch, 4)).toBe("shortGame");
  });
});

describe("round aggregation & benchmarks", () => {
  const holeShots: Shot[] = [
    { holeNumber: 1, shotNumber: 1, distanceToHole: 400, lie: "tee", resultDistanceToHole: 150, resultLie: "fairway" },
    { holeNumber: 1, shotNumber: 2, distanceToHole: 150, lie: "fairway", resultDistanceToHole: 20, resultLie: "green" },
    { holeNumber: 1, shotNumber: 3, distanceToHole: 20, lie: "green", resultDistanceToHole: 2, resultLie: "green" },
    { holeNumber: 1, shotNumber: 4, distanceToHole: 2, lie: "green", resultDistanceToHole: 0, resultLie: "holed" },
  ];
  it("SG for a par on a 400yd hole sums to E[tee,400] − 4", () => {
    const round = strokesGainedForRound(holeShots, { 1: 4 });
    expect(round.total).toBeCloseTo(expectedStrokes("tee", 400) - 4, 1);
  });
  it("benchmarks vs handicap band and finds worst category", () => {
    const round = strokesGainedForRound(holeShots, { 1: 4 });
    const bench = benchmarkRound(round, 12);
    expect(["driving", "approach", "shortGame", "putting"]).toContain(bench.worstCategory);
    expect(typeof bench.putting).toBe("number");
  });
});

describe("Inside-100 dashboard (Fix #10)", () => {
  it("computes up-and-down %, sand save %, and proximity bands", () => {
    const shots: Shot[] = [
      // Hole 1: greenside rough pitch to 4ft, holed putt → up-and-down
      { holeNumber: 1, shotNumber: 3, distanceToHole: 20, lie: "rough", resultDistanceToHole: 4, resultLie: "green" },
      { holeNumber: 1, shotNumber: 4, distanceToHole: 4, lie: "green", resultDistanceToHole: 0, resultLie: "holed" },
      // Hole 2: bunker shot, two putts → failed sand save
      { holeNumber: 2, shotNumber: 3, distanceToHole: 15, lie: "sand", resultDistanceToHole: 18, resultLie: "green" },
      { holeNumber: 2, shotNumber: 4, distanceToHole: 18, lie: "green", resultDistanceToHole: 2, resultLie: "green" },
      { holeNumber: 2, shotNumber: 5, distanceToHole: 2, lie: "green", resultDistanceToHole: 0, resultLie: "holed" },
      // Hole 3: 60yd wedge to 12ft
      { holeNumber: 3, shotNumber: 3, distanceToHole: 60, lie: "fairway", resultDistanceToHole: 12, resultLie: "green" },
    ];
    const round = strokesGainedForRound(shots, { 1: 4, 2: 4, 3: 4 });
    const stats = inside100Stats([round]);
    expect(stats.upAndDownPct).toBe(50);
    expect(stats.sandSavePct).toBe(0);
    expect(stats.proximityByBand["75"]).toBe(12);
  });
});

describe("miss direction buckets", () => {
  it("classifies long/short/left/right relative to target line", () => {
    expect(missDirection(0, 0, 30)).toBe("long");
    expect(missDirection(0, 180, 30)).toBe("short");
    expect(missDirection(0, 90, 30)).toBe("right");
    expect(missDirection(0, 270, 30)).toBe("left");
    expect(missDirection(0, 90, 3)).toBe("holed_or_close");
  });
});
