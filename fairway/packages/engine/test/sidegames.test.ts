import { describe, expect, it } from "./helpers/vitest-compat.ts";
import { matchPlay, nassau, skins, stableford, vegas, wolf } from "../src/sidegames.ts";
import type { HoleInfo, PlayerRoundScores } from "../src/types.ts";

const holes: HoleInfo[] = Array.from({ length: 18 }, (_, i) => ({
  holeNumber: i + 1,
  par: 4,
  strokeIndex: i + 1,
}));

const player = (id: string, strokesByHole: number[], hcp = 0): PlayerRoundScores => ({
  playerId: id, displayName: id, playingHandicap: hcp,
  scores: strokesByHole.map((s, i) => ({ holeNumber: i + 1, strokes: s })),
});

describe("skins", () => {
  it("carries tied holes into the next pot", () => {
    const a = player("a", [4, 4, 3, ...Array(15).fill(4)]);
    const b = player("b", [4, 4, 4, ...Array(15).fill(4)]);
    const result = skins([a, b], holes, { net: false });
    expect(result.totals.a).toBe(3); // holes 1-2 tied, carried into hole 3
    expect(result.holes[2].carried).toBe(true);
  });
  it("respects net scoring with handicaps", () => {
    const a = player("a", Array(18).fill(5), 18); // net 4 everywhere
    const b = player("b", Array(18).fill(5), 0);
    const result = skins([a, b], holes, { net: true, carryover: false });
    expect(result.totals.a).toBe(18);
    expect(result.totals.b).toBe(0);
  });
});

describe("match play", () => {
  it("closes out a match when lead exceeds holes remaining", () => {
    const a = player("a", [3, 3, 3, 3, 3, ...Array(13).fill(4)]);
    const b = player("b", Array(18).fill(4));
    const m = matchPlay(a, b, holes, { net: false });
    // A wins holes 1-5, rest halved → closes after hole 14: 5 up, 4 to play.
    expect(m.status).toBe("closed");
    expect(m.result).toBe("5&4");
  });
  it("reports all square", () => {
    const a = player("a", Array(18).fill(4));
    const b = player("b", Array(18).fill(4));
    expect(matchPlay(a, b, holes, { net: false }).result).toBe("AS");
  });
  it("detects dormie", () => {
    const a = player("a", [3, ...Array(16).fill(4)]); // 1 up through 17
    const b = player("b", Array(17).fill(4));
    const m = matchPlay(a, b, holes, { net: false });
    expect(m.status).toBe("dormie");
  });
});

describe("nassau", () => {
  it("scores front, back, and overall as separate bets", () => {
    const a = player("a", [...Array(9).fill(3), ...Array(9).fill(5)]); // wins front, loses back
    const b = player("b", Array(18).fill(4));
    const n = nassau(a, b, holes, { net: false });
    expect(n.front.result).toMatch(/&|up/);
    expect(Math.sign(n.front.holesUp)).toBe(1);
    expect(Math.sign(n.back.holesUp)).toBe(-1);
    expect(n.netBets).toBe(0); // front to A, back to B, overall AS
  });
});

describe("stableford", () => {
  it("classic: birdie 3, par 2, bogey 1, double 0", () => {
    const p = player("p", [3, 4, 5, 6, ...Array(14).fill(4)]);
    const s = stableford(p, holes, { net: false });
    expect(s.byHole.slice(0, 4).map((h) => h.points)).toEqual([3, 2, 1, 0]);
    expect(s.total).toBe(3 + 2 + 1 + 0 + 14 * 2);
  });
  it("modified: aggressive points swing", () => {
    const p = player("p", [3, 5], 0);
    const s = stableford(p, holes.slice(0, 2), { net: false, points: { [-1]: 2, 0: 0, 1: -1, 2: -3, [-2]: 5, [-3]: 8 } });
    expect(s.total).toBe(1);
  });
});

describe("wolf", () => {
  const a = player("a", Array(18).fill(4));
  const b = player("b", Array(18).fill(5));
  const c = player("c", Array(18).fill(5));
  const d = player("d", Array(18).fill(5));
  it("partner win pays both partners", () => {
    const pts = wolf([a, b, c, d], holes, [{ holeNumber: 1, wolfId: "b", choice: { partnerId: "a" } }], { net: false });
    expect(pts.a).toBe(1);
    expect(pts.b).toBe(1);
    expect(pts.c).toBe(0);
  });
  it("lone wolf win pays double per opponent", () => {
    const pts = wolf([a, b, c, d], holes, [{ holeNumber: 1, wolfId: "a", choice: { lone: true } }], { net: false });
    expect(pts.a).toBe(6); // 2 × 3 opponents
  });
  it("lone wolf loss pays the pack", () => {
    const pts = wolf([a, b, c, d], holes, [{ holeNumber: 1, wolfId: "b", choice: { lone: true } }], { net: false });
    expect(pts.b).toBe(0);
    expect(pts.a).toBe(2);
    expect(pts.c).toBe(2);
  });
});

describe("vegas", () => {
  const a1 = player("a1", Array(18).fill(4)), a2 = player("a2", Array(18).fill(5));
  it("computes team numbers low·10 + high", () => {
    const b1 = player("b1", Array(18).fill(5)), b2 = player("b2", Array(18).fill(6));
    const v = vegas([a1, a2], [b1, b2], holes.slice(0, 1));
    expect(v.byHole[0]).toMatchObject({ a: 45, b: 56, delta: 11 });
  });
  it("flips the team number on an opposing birdie", () => {
    const b1 = player("b1", [3, ...Array(17).fill(5)]), b2 = player("b2", Array(18).fill(6));
    const v = vegas([a1, a2], [b1, b2], holes.slice(0, 1));
    expect(v.byHole[0].a).toBe(54); // flipped by B's birdie
    expect(v.byHole[0].b).toBe(36);
  });
});
