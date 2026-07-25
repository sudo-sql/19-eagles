/** Shared engine types. Pure data — no platform imports anywhere in this package. */

export type Lie = "tee" | "fairway" | "rough" | "sand" | "recovery" | "green" | "penalty";

export interface HoleInfo {
  holeNumber: number;
  par: number;
  /** Stroke index 1..18 (handicap allocation). */
  strokeIndex: number;
  yards?: number;
}

export interface HoleScore {
  holeNumber: number;
  strokes: number;
  putts?: number;
  fairwayHit?: boolean | null;
  greenInRegulation?: boolean;
  penalties?: number;
}

export interface TeeRating {
  /** 18-hole course rating unless holes = 9. */
  courseRating: number;
  slopeRating: number;
  par: number;
  holes: 9 | 18;
}

export interface Shot {
  holeNumber: number;
  shotNumber: number;
  /** Distance remaining to the hole BEFORE the shot, in yards (green lie: feet). */
  distanceToHole: number;
  lie: Lie;
  /** Distance remaining AFTER the shot (0 = holed). Green lie: feet. */
  resultDistanceToHole: number;
  resultLie: Lie | "holed";
  penaltyStrokes?: number;
  club?: string;
}

export type SGCategory = "driving" | "approach" | "shortGame" | "putting";

export interface PlayerRoundScores {
  playerId: string;
  displayName: string;
  playingHandicap: number;
  scores: HoleScore[];
}
