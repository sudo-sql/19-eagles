import { describe, expect, it } from "./helpers/vitest-compat.ts";
import {
  adjustedGrossScore, courseHandicap, netDoubleBogey, playingHandicap,
  strokesReceivedOnHole, summarizeScorecard,
} from "../src/scoring.ts";
import type { HoleInfo, HoleScore } from "../src/types.ts";

const holes18: HoleInfo[] = Array.from({ length: 18 }, (_, i) => ({
  holeNumber: i + 1,
  par: [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4][i],
  strokeIndex: [5, 11, 17, 1, 7, 15, 9, 3, 13, 6, 18, 12, 2, 8, 16, 4, 10, 14][i],
}));

describe("stroke allocation", () => {
  it("gives 1 stroke on the 10 hardest holes for a 10 handicap", () => {
    const received = holes18.map((h) => strokesReceivedOnHole(10, h.strokeIndex));
    expect(received.reduce((a, b) => a + b, 0)).toBe(10);
    expect(strokesReceivedOnHole(10, 1)).toBe(1);
    expect(strokesReceivedOnHole(10, 11)).toBe(0);
  });
  it("gives 2 strokes on hardest holes for a 25 handicap", () => {
    expect(strokesReceivedOnHole(25, 1)).toBe(2);
    expect(strokesReceivedOnHole(25, 7)).toBe(2);
    expect(strokesReceivedOnHole(25, 8)).toBe(1);
    const total = holes18.map((h) => strokesReceivedOnHole(25, h.strokeIndex)).reduce((a, b) => a + b);
    expect(total).toBe(25);
  });
  it("plus handicaps give strokes back on the easiest holes", () => {
    expect(strokesReceivedOnHole(-2, 18)).toBe(-1);
    expect(strokesReceivedOnHole(-2, 17)).toBe(-1);
    expect(strokesReceivedOnHole(-2, 16)).toBe(0);
  });
});

describe("net double bogey / adjusted gross (Rule 3.1)", () => {
  it("caps a blow-up hole at par + 2 + strokes received", () => {
    const hole = holes18[3]; // par 4, SI 1
    expect(netDoubleBogey(hole, 10)).toBe(7);
    const scores: HoleScore[] = holes18.map((h) => ({
      holeNumber: h.holeNumber, strokes: h.holeNumber === 4 ? 11 : h.par,
    }));
    const ags = adjustedGrossScore(holes18, scores, 10);
    const parTotal = holes18.reduce((s, h) => s + h.par, 0);
    expect(ags).toBe(parTotal - 4 + 7); // hole 4's 11 capped at 7
  });
});

describe("course & playing handicap", () => {
  it("computes WHS course handicap with CR − par adjustment", () => {
    // 14.0 × (125/113) + (71.1 − 72) = 15.487 − 0.9 = 14.587 → 15
    expect(courseHandicap(14.0, 125, 71.1, 72)).toBe(15);
  });
  it("applies allowance", () => {
    expect(playingHandicap(15, 95)).toBe(14);
  });
});

describe("scorecard summary", () => {
  it("aggregates gross/net/FIR/GIR/putts and score names", () => {
    const scores: HoleScore[] = holes18.map((h) => ({
      holeNumber: h.holeNumber,
      strokes: h.par + (h.holeNumber % 3 === 0 ? 1 : h.holeNumber === 1 ? -1 : 0),
      putts: 2,
      fairwayHit: h.par >= 4 ? h.holeNumber % 2 === 0 : null,
      greenInRegulation: h.holeNumber % 2 === 0,
    }));
    const sum = summarizeScorecard(holes18, scores, 10);
    expect(sum.holesPlayed).toBe(18);
    expect(sum.putts).toBe(36);
    expect(sum.gross - sum.net).toBe(10);
    expect(sum.scoreNames.birdie).toBe(1);
    expect(sum.scoreNames.bogey).toBe(6);
    expect(sum.fairwayOpportunities).toBe(14); // four par 3s
    expect(sum.greensInRegulation).toBe(9);
  });
});
