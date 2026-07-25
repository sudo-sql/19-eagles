/** Side games (§2): Skins, Nassau, Match Play, Wolf, Stableford, Vegas. Pure functions. */
import { strokesReceivedOnHole } from "./scoring.ts";
import type { HoleInfo, PlayerRoundScores } from "./types.ts";

const netStrokes = (
  gross: number, hole: HoleInfo, playingHandicap: number, useNet: boolean,
): number => (useNet ? gross - strokesReceivedOnHole(playingHandicap, hole.strokeIndex) : gross);

const grossOn = (p: PlayerRoundScores, holeNumber: number) =>
  p.scores.find((s) => s.holeNumber === holeNumber)?.strokes;

// ---------------- Skins ----------------
export interface SkinsResult {
  holes: { holeNumber: number; winnerId: string | null; skins: number; carried: boolean }[];
  totals: Record<string, number>;
}

export function skins(
  players: PlayerRoundScores[],
  holes: HoleInfo[],
  opts: { carryover?: boolean; net?: boolean } = {},
): SkinsResult {
  const { carryover = true, net = true } = opts;
  const totals: Record<string, number> = Object.fromEntries(players.map((p) => [p.playerId, 0]));
  let pot = 1;
  const out: SkinsResult["holes"] = [];
  for (const hole of holes) {
    const entries = players
      .map((p) => ({ id: p.playerId, s: grossOn(p, hole.holeNumber) }))
      .filter((e): e is { id: string; s: number } => e.s !== undefined)
      .map((e) => ({ id: e.id, n: netStrokes(e.s, hole, players.find((p) => p.playerId === e.id)!.playingHandicap, net) }));
    if (entries.length < 2) continue;
    const min = Math.min(...entries.map((e) => e.n));
    const winners = entries.filter((e) => e.n === min);
    if (winners.length === 1) {
      totals[winners[0].id] += pot;
      out.push({ holeNumber: hole.holeNumber, winnerId: winners[0].id, skins: pot, carried: pot > 1 });
      pot = 1;
    } else {
      out.push({ holeNumber: hole.holeNumber, winnerId: null, skins: 0, carried: false });
      if (carryover) pot += 1;
    }
  }
  return { holes: out, totals };
}

// ---------------- Match play ----------------
export interface MatchState {
  /** Positive = player A up. */
  holesUp: number;
  holesRemaining: number;
  status: "live" | "dormie" | "closed";
  result?: string; // "3&2", "1 up", "AS"
}

export function matchPlay(
  a: PlayerRoundScores, b: PlayerRoundScores, holes: HoleInfo[], opts: { net?: boolean } = {},
): MatchState {
  const { net = true } = opts;
  let up = 0;
  let played = 0;
  let closedAt: { up: number; remaining: number } | null = null;
  for (const hole of holes) {
    const ga = grossOn(a, hole.holeNumber), gb = grossOn(b, hole.holeNumber);
    if (ga === undefined || gb === undefined) break;
    const na = netStrokes(ga, hole, a.playingHandicap, net);
    const nb = netStrokes(gb, hole, b.playingHandicap, net);
    if (na < nb) up++;
    else if (nb < na) up--;
    played++;
    const remaining = holes.length - played;
    if (Math.abs(up) > remaining && !closedAt) closedAt = { up, remaining };
  }
  const remaining = holes.length - played;
  if (closedAt) {
    return {
      holesUp: closedAt.up, holesRemaining: closedAt.remaining, status: "closed",
      result: `${Math.abs(closedAt.up)}&${closedAt.remaining}`,
    };
  }
  if (remaining === 0) {
    return {
      holesUp: up, holesRemaining: 0, status: "closed",
      result: up === 0 ? "AS" : `${Math.abs(up)} up`,
    };
  }
  return { holesUp: up, holesRemaining: remaining, status: Math.abs(up) === remaining ? "dormie" : "live" };
}

// ---------------- Nassau ----------------
export interface NassauResult {
  front: MatchState; back: MatchState; overall: MatchState;
  /** Positive = A wins that many bets. */
  netBets: number;
}

export function nassau(a: PlayerRoundScores, b: PlayerRoundScores, holes: HoleInfo[], opts: { net?: boolean } = {}): NassauResult {
  const front = holes.filter((h) => h.holeNumber <= 9);
  const back = holes.filter((h) => h.holeNumber > 9);
  const f = matchPlay(a, b, front, opts);
  const bk = matchPlay(a, b, back, opts);
  const ov = matchPlay(a, b, holes, opts);
  const win = (m: MatchState) => (m.status === "closed" ? Math.sign(m.holesUp) : 0);
  return { front: f, back: bk, overall: ov, netBets: win(f) + win(bk) + win(ov) };
}

// ---------------- Stableford ----------------
export const STABLEFORD_CLASSIC: Record<number, number> = { [-3]: 5, [-2]: 4, [-1]: 3, 0: 2, 1: 1, 2: 0 };
export const STABLEFORD_MODIFIED: Record<number, number> = { [-3]: 8, [-2]: 5, [-1]: 2, 0: 0, 1: -1, 2: -3 };

export function stableford(
  p: PlayerRoundScores, holes: HoleInfo[],
  opts: { net?: boolean; points?: Record<number, number> } = {},
): { total: number; byHole: { holeNumber: number; points: number }[] } {
  const { net = true, points = STABLEFORD_CLASSIC } = opts;
  const byHole: { holeNumber: number; points: number }[] = [];
  let total = 0;
  for (const hole of holes) {
    const g = grossOn(p, hole.holeNumber);
    if (g === undefined) continue;
    const n = netStrokes(g, hole, p.playingHandicap, net);
    const diff = Math.max(-3, Math.min(2, n - hole.par));
    const pts = points[diff] ?? (diff >= 2 ? points[2] ?? 0 : 0);
    byHole.push({ holeNumber: hole.holeNumber, points: pts });
    total += pts;
  }
  return { total, byHole };
}

// ---------------- Wolf ----------------
export type WolfChoice = { partnerId: string } | { lone: true } | { blindLone: true };

export interface WolfHole {
  holeNumber: number;
  wolfId: string;
  choice: WolfChoice;
}

/**
 * Wolf: rotating wolf picks a partner (2v2) or goes lone (1v3, double points;
 * blind lone before seeing tee shots = triple). Best-ball net per side.
 */
export function wolf(
  players: PlayerRoundScores[], holes: HoleInfo[], wolfHoles: WolfHole[],
  opts: { net?: boolean } = {},
): Record<string, number> {
  const { net = true } = opts;
  const points: Record<string, number> = Object.fromEntries(players.map((p) => [p.playerId, 0]));
  for (const wh of wolfHoles) {
    const hole = holes.find((h) => h.holeNumber === wh.holeNumber);
    if (!hole) continue;
    const best = (ids: string[]) =>
      Math.min(...ids.map((id) => {
        const p = players.find((x) => x.playerId === id)!;
        const g = grossOn(p, wh.holeNumber);
        return g === undefined ? Infinity : netStrokes(g, hole, p.playingHandicap, net);
      }));
    const lone = "lone" in wh.choice || "blindLone" in wh.choice;
    const mult = "blindLone" in wh.choice ? 3 : "lone" in wh.choice ? 2 : 1;
    const wolfSide = lone ? [wh.wolfId] : [wh.wolfId, (wh.choice as { partnerId: string }).partnerId];
    const others = players.map((p) => p.playerId).filter((id) => !wolfSide.includes(id));
    const w = best(wolfSide), o = best(others);
    if (!isFinite(w) || !isFinite(o) || w === o) continue;
    if (w < o) for (const id of wolfSide) points[id] += 1 * mult * (lone ? others.length : 1);
    else for (const id of others) points[id] += 1 * mult;
  }
  return points;
}

// ---------------- Vegas ----------------
/**
 * Vegas (2v2): team number = low·10 + high; difference in team numbers = points.
 * A gross birdie by the opposing team flips your team number (high·10 + low).
 */
export function vegas(
  teamA: [PlayerRoundScores, PlayerRoundScores],
  teamB: [PlayerRoundScores, PlayerRoundScores],
  holes: HoleInfo[],
): { pointsToA: number; byHole: { holeNumber: number; a: number; b: number; delta: number }[] } {
  let pointsToA = 0;
  const byHole: { holeNumber: number; a: number; b: number; delta: number }[] = [];
  for (const hole of holes) {
    const g = (team: [PlayerRoundScores, PlayerRoundScores]) =>
      team.map((p) => grossOn(p, hole.holeNumber));
    const [a1, a2] = g(teamA), [b1, b2] = g(teamB);
    if ([a1, a2, b1, b2].some((x) => x === undefined)) continue;
    const teamNumber = (x: number, y: number, flipped: boolean) => {
      const lo = Math.min(x, y), hi = Math.max(x, y);
      return flipped ? hi * 10 + lo : lo * 10 + hi;
    };
    const bBirdie = Math.min(b1!, b2!) < hole.par;
    const aBirdie = Math.min(a1!, a2!) < hole.par;
    const aNum = teamNumber(a1!, a2!, bBirdie);
    const bNum = teamNumber(b1!, b2!, aBirdie);
    const delta = bNum - aNum; // positive = A gains
    pointsToA += delta;
    byHole.push({ holeNumber: hole.holeNumber, a: aNum, b: bNum, delta });
  }
  return { pointsToA, byHole };
}
