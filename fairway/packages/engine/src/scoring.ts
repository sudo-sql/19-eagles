import type { HoleInfo, HoleScore } from "./types.ts";

/** Strokes received on a hole for a given course handicap (stroke-index allocation). */
export function strokesReceivedOnHole(courseHandicap: number, strokeIndex: number, holesInRound: 9 | 18 = 18): number {
  if (courseHandicap <= 0) {
    // Plus handicaps give strokes back starting at the highest stroke index.
    const give = Math.abs(courseHandicap);
    const base = Math.floor(give / holesInRound);
    const extra = give % holesInRound;
    return -(base + (strokeIndex > holesInRound - extra ? 1 : 0)) || 0; // || 0 normalizes -0
  }
  const base = Math.floor(courseHandicap / holesInRound);
  const extra = courseHandicap % holesInRound;
  return base + (strokeIndex <= extra ? 1 : 0);
}

/** Net double bogey cap (WHS Rule 3.1): par + 2 + strokes received. */
export function netDoubleBogey(hole: HoleInfo, courseHandicap: number, holesInRound: 9 | 18 = 18): number {
  return hole.par + 2 + strokesReceivedOnHole(courseHandicap, hole.strokeIndex, holesInRound);
}

/** Adjusted gross score for handicap posting: each hole capped at net double bogey. */
export function adjustedGrossScore(
  holes: HoleInfo[],
  scores: HoleScore[],
  courseHandicap: number,
): number {
  const holesInRound = (holes.length === 9 ? 9 : 18) as 9 | 18;
  return scores.reduce((total, s) => {
    const hole = holes.find((h) => h.holeNumber === s.holeNumber);
    if (!hole) throw new Error(`No hole info for hole ${s.holeNumber}`);
    return total + Math.min(s.strokes, netDoubleBogey(hole, courseHandicap, holesInRound));
  }, 0);
}

export interface ScorecardSummary {
  gross: number;
  net: number;
  toPar: number;
  putts: number;
  fairwaysHit: number;
  fairwayOpportunities: number;
  greensInRegulation: number;
  holesPlayed: number;
  scoreNames: Record<string, number>; // eagle, birdie, par, bogey, double+
}

export function summarizeScorecard(holes: HoleInfo[], scores: HoleScore[], playingHandicap = 0): ScorecardSummary {
  let gross = 0, putts = 0, fir = 0, firOpp = 0, gir = 0, toPar = 0;
  const names: Record<string, number> = { eagleOrBetter: 0, birdie: 0, par: 0, bogey: 0, doublePlus: 0 };
  for (const s of scores) {
    const hole = holes.find((h) => h.holeNumber === s.holeNumber);
    if (!hole) continue;
    gross += s.strokes;
    toPar += s.strokes - hole.par;
    putts += s.putts ?? 0;
    if (hole.par >= 4) { firOpp++; if (s.fairwayHit) fir++; }
    if (s.greenInRegulation) gir++;
    const d = s.strokes - hole.par;
    if (d <= -2) names.eagleOrBetter++;
    else if (d === -1) names.birdie++;
    else if (d === 0) names.par++;
    else if (d === 1) names.bogey++;
    else names.doublePlus++;
  }
  return {
    gross, net: gross - playingHandicap, toPar, putts,
    fairwaysHit: fir, fairwayOpportunities: firOpp,
    greensInRegulation: gir, holesPlayed: scores.length, scoreNames: names,
  };
}

/** Course handicap (WHS): HI × (slope ÷ 113) + (CR − par). Rounded to whole strokes. */
export function courseHandicap(handicapIndex: number, slope: number, courseRating: number, par: number): number {
  return Math.round(handicapIndex * (slope / 113) + (courseRating - par));
}

/** Playing handicap = course handicap × allowance (e.g. 0.95 for singles stroke play). */
export function playingHandicap(courseHcp: number, allowancePct = 100): number {
  return Math.round(courseHcp * (allowancePct / 100));
}
