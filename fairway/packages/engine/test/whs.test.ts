import { describe, expect, it } from "./helpers/vitest-compat.ts";
import {
  defaultExpectedNineHoleDifferential,
  handicapFromRounds,
  handicapIndex,
  scoreDifferential,
  selectionForRecordSize,
} from "../src/whs.ts";

describe("18-hole score differential (Rule 5.1a)", () => {
  it("matches the canonical worked example: 85 on CR 71.1 / slope 125", () => {
    const d = scoreDifferential({ adjustedGross: 85, courseRating: 71.1, slopeRating: 125, holes: 18 });
    // (113/125) × (85 − 71.1) = 12.565 → 12.6
    expect(d.value).toBe(12.6);
  });

  it("applies PCC", () => {
    const d = scoreDifferential({ adjustedGross: 85, courseRating: 71.1, slopeRating: 125, pcc: 1, holes: 18 });
    // (113/125) × (85 − 71.1 − 1) = 11.66 → 11.7
    expect(d.value).toBe(11.7);
  });

  it("neutral slope 113 yields AGS − CR", () => {
    const d = scoreDifferential({ adjustedGross: 90, courseRating: 72.0, slopeRating: 113, holes: 18 });
    expect(d.value).toBe(18);
  });
});

describe("9-hole score differential (Rule 5.1b, 2024 revision)", () => {
  it("reproduces the USGA worked example: HI 14.0, 9-hole SD 7.2 → 18-hole SD 15.7", () => {
    // Construct a 9-hole round that yields an unrounded 9-hole differential of 7.2:
    // slope 113, CR 35.8, AGS 43 → (113/113) × (43 − 35.8) = 7.2
    const d = scoreDifferential({
      adjustedGross: 43, courseRating: 35.8, slopeRating: 113,
      holes: 9, handicapIndexAtPosting: 14.0,
    });
    expect(d.raw.nineHoleDifferential).toBe(7.2);
    expect(d.raw.expectedNineHole).toBe(8.5); // 14.0/2 + 1.5
    expect(d.value).toBe(15.7);
    expect(d.explanation).toContain("NOT doubled");
  });

  it("NEVER doubles the 9-hole differential (the 18Birdies bug)", () => {
    const d = scoreDifferential({
      adjustedGross: 45, courseRating: 36.0, slopeRating: 120,
      holes: 9, handicapIndexAtPosting: 10.0,
    });
    const nine = (113 / 120) * (45 - 36.0); // 8.475
    expect(d.value).not.toBeCloseTo(2 * nine, 1); // doubled would be ~16.9
    expect(d.value).toBe(Math.round((nine + 6.5) * 10) / 10); // 15.0 with expected 6.5
  });

  it("halves PCC for 9-hole rounds", () => {
    const withPcc = scoreDifferential({
      adjustedGross: 43, courseRating: 35.8, slopeRating: 113, pcc: 2,
      holes: 9, handicapIndexAtPosting: 14.0,
    });
    expect(withPcc.value).toBe(14.7); // 7.2 − 1.0 + 8.5
  });
});

describe("record-size selection table (Rule 5.2a)", () => {
  it("throws under 3 scores", () => expect(() => selectionForRecordSize(2)).toThrow());
  it.each([
    [3, 1, -2.0], [4, 1, -1.0], [5, 1, 0], [6, 2, -1.0], [7, 2, 0], [8, 2, 0],
    [9, 3, 0], [11, 3, 0], [12, 4, 0], [14, 4, 0], [15, 5, 0], [16, 5, 0],
    [17, 6, 0], [18, 6, 0], [19, 7, 0], [20, 8, 0], [25, 8, 0],
  ])("n=%i uses %i with adj %d", (n, use, adj) => {
    expect(selectionForRecordSize(n)).toEqual({ use, adjustment: adj });
  });
});

describe("handicap index (Rule 5.2)", () => {
  it("averages the best 8 of 20 and truncates to one decimal", () => {
    const diffs = [
      10.1, 12.3, 9.8, 15.2, 11.0, 14.4, 8.9, 13.7, 10.5, 12.0,
      16.1, 9.2, 11.8, 14.9, 10.9, 13.3, 9.5, 12.7, 15.8, 11.4,
    ];
    const best8 = [...diffs].sort((a, b) => a - b).slice(0, 8);
    const expected = Math.trunc((best8.reduce((s, d) => s + d, 0) / 8) * 10) / 10;
    const comp = handicapIndex(diffs);
    expect(comp.index).toBe(expected);
    expect(comp.usedDifferentials).toHaveLength(8);
    expect(comp.explanation.join(" ")).toContain("Best 8");
  });

  it("applies the −2.0 adjustment with exactly 3 scores", () => {
    const comp = handicapIndex([12.0, 15.0, 18.0]);
    expect(comp.index).toBe(10.0); // lowest (12.0) − 2.0
  });

  it("soft cap halves the rise beyond Low HI + 3.0", () => {
    const comp = handicapIndex([20.0, 20.0, 20.0, 20.0, 20.0, 20.0], { lowHandicapIndex: 14.0 });
    // raw: avg lowest 2 (20.0) − 1.0 = 19.0 → above 17.0 → 17.0 + (2.0 × 0.5) = 18.0
    expect(comp.index).toBe(18.0);
    expect(comp.capApplied).toBe("soft");
  });

  it("hard cap limits to Low HI + 5.0", () => {
    const comp = handicapIndex([25.0, 25.0, 25.0, 25.0, 25.0], { lowHandicapIndex: 14.0 });
    expect(comp.index).toBe(19.0);
    expect(comp.capApplied).toBe("hard");
  });
});

describe("mixed 9- and 18-hole records end-to-end (Definition of Done)", () => {
  it("produces a correct index from mixed rounds with a full audit trail", () => {
    const rounds = [
      { adjustedGross: 85, courseRating: 71.1, slopeRating: 125, holes: 18 as const },
      { adjustedGross: 43, courseRating: 35.8, slopeRating: 113, holes: 9 as const, handicapIndexAtPosting: 14.0 },
      { adjustedGross: 88, courseRating: 72.0, slopeRating: 130, holes: 18 as const },
      { adjustedGross: 41, courseRating: 34.9, slopeRating: 118, holes: 9 as const, handicapIndexAtPosting: 13.5 },
    ];
    const comp = handicapFromRounds(rounds);
    expect(comp.perRound[0].value).toBe(12.6);
    expect(comp.perRound[1].value).toBe(15.7);
    // 4 scores → lowest 1 − 1.0
    const lowest = Math.min(...comp.perRound.map((d) => d.value));
    expect(comp.index).toBe(Math.trunc((lowest - 1.0) * 10) / 10);
    expect(comp.explanation.length).toBeGreaterThan(2);
  });
});

describe("expected 9-hole differential approximation", () => {
  it("is monotonic in handicap index", () => {
    expect(defaultExpectedNineHoleDifferential(20)).toBeGreaterThan(defaultExpectedNineHoleDifferential(5));
  });
});
