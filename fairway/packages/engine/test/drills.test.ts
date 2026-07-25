import { describe, expect, it } from "./helpers/vitest-compat.ts";
import { DRILLS, benchmarkDelta, generatePracticePlan, scoreDrill } from "../src/drills.ts";
import { GpsKalman, distanceYards, playsLikeYards, pointInPolygon } from "../src/geo.ts";

describe("drill library (Fix #9)", () => {
  it("ships 25+ drills across all five categories", () => {
    expect(DRILLS.length).toBeGreaterThanOrEqual(25);
    for (const cat of ["putting", "short_game", "wedges", "approach", "driving"]) {
      expect(DRILLS.some((d) => d.category === cat)).toBe(true);
    }
  });
  it("every drill has benchmarked targets for all six handicap bands", () => {
    for (const d of DRILLS) {
      for (const band of ["scratch", "5", "10", "15", "20", "25"]) {
        expect(d.targets[band], `${d.slug} missing band ${band}`).toBeTypeOf("number");
      }
      // Targets must get easier as handicap rises
      expect(d.targets.scratch).toBeGreaterThan(d.targets["25"]);
    }
  });
});

describe("drill scoring", () => {
  it("percent_success: 16/20 gates = 80", () => {
    expect(scoreDrill({ drillSlug: "gate-3ft", raw: 16 }).score).toBe(80);
  });
  it("points: raw over max", () => {
    expect(scoreDrill({ drillSlug: "ladder-lag", raw: 18, maxPoints: 27 }).score).toBeCloseTo(66.7, 1);
  });
  it("distance_error: 10% error = 60", () => {
    expect(scoreDrill({ drillSlug: "wedge-matrix", raw: 10 }).score).toBe(60);
  });
  it("benchmarks against the player's band", () => {
    const { score, drill } = scoreDrill({ drillSlug: "gate-3ft", raw: 16 });
    expect(benchmarkDelta(score, drill, 12)).toBe(-5); // 80 vs 85 target for 10-band
  });
});

describe("practice plan generation", () => {
  it("targets the worst SG category and avoids recently-done drills first", () => {
    const plan = generatePracticePlan("putting", { minutes: 45, recentSlugs: ["gate-3ft"] });
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every((d) => d.category === "putting")).toBe(true);
    expect(plan[0].slug).not.toBe("gate-3ft");
    expect(plan.reduce((s, d) => s + d.estMinutes, 0)).toBeLessThanOrEqual(45);
  });
  it("adds a maintenance drill from the best category when time allows", () => {
    const plan = generatePracticePlan("shortGame", { minutes: 90, bestCategory: "driving" });
    expect(plan.some((d) => d.category === "driving")).toBe(true);
  });
});

describe("geo utilities", () => {
  it("haversine: known distance (about 119.6yd for 0.001° lat)", () => {
    const d = distanceYards({ lat: 40, lng: -75 }, { lat: 40.001, lng: -75 });
    expect(d).toBeGreaterThan(119);
    expect(d).toBeLessThan(123);
  });
  it("plays-like: headwind and uphill add distance", () => {
    const flat = playsLikeYards(150);
    expect(flat).toBe(150);
    expect(playsLikeYards(150, { elevationDeltaFt: 15 })).toBe(155);
    expect(playsLikeYards(150, { windMph: 10, windRelativeBearingDeg: 0 })).toBe(165);
    expect(playsLikeYards(150, { windMph: 10, windRelativeBearingDeg: 180 })).toBe(143);
  });
  it("kalman filter converges toward true position", () => {
    const kf = new GpsKalman();
    const truth = { lat: 40.0, lng: -75.0 };
    let last = { lat: 0, lng: 0 };
    for (let i = 0; i < 30; i++) {
      const noise = () => (Math.sin(i * 7.3) * 0.00005); // deterministic "noise" ~5m
      last = kf.update({
        lat: truth.lat + noise(), lng: truth.lng + noise(),
        accuracyMeters: 8, timestampMs: i * 1000,
      });
    }
    expect(distanceYards(last, truth)).toBeLessThan(12);
  });
  it("point-in-polygon detects on-green lies", () => {
    const green = [
      { lat: 40.0, lng: -75.0 }, { lat: 40.0004, lng: -75.0 },
      { lat: 40.0004, lng: -74.9996 }, { lat: 40.0, lng: -74.9996 },
    ];
    expect(pointInPolygon({ lat: 40.0002, lng: -74.9998 }, green)).toBe(true);
    expect(pointInPolygon({ lat: 40.001, lng: -75.0 }, green)).toBe(false);
  });
});
