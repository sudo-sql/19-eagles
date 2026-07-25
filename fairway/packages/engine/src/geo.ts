/** Geodesy + GPS smoothing shared by mobile and web (Fix #12). */

export interface LatLng { lat: number; lng: number }

const R_METERS = 6371008.8;
const toRad = (d: number) => (d * Math.PI) / 180;

/** Haversine distance in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_METERS * Math.asin(Math.sqrt(s));
}

export const metersToYards = (m: number) => m * 1.0936133;
export const distanceYards = (a: LatLng, b: LatLng) => metersToYards(distanceMeters(a, b));

/** Initial bearing from a to b, degrees 0..360. */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat), Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/** "Plays-like" distance (premium): wind + elevation adjustment, in yards. */
export function playsLikeYards(
  actualYards: number,
  opts: { elevationDeltaFt?: number; windMph?: number; windRelativeBearingDeg?: number } = {},
): number {
  const { elevationDeltaFt = 0, windMph = 0, windRelativeBearingDeg = 0 } = opts;
  // Rule-of-thumb models: 1yd per 3ft of elevation; headwind ~1% per mph, tailwind ~0.5% per mph.
  const elev = elevationDeltaFt / 3;
  const headComponent = Math.cos(toRad(windRelativeBearingDeg)) * windMph; // + = headwind
  const windAdj = headComponent >= 0
    ? actualYards * 0.01 * headComponent
    : actualYards * 0.005 * headComponent;
  return Math.round(actualYards + elev + windAdj);
}

/**
 * Lightweight constant-velocity Kalman filter for GPS fixes (Fix #12).
 * State: [lat, lng, vLat, vLng]; observation: lat/lng with accuracy (m).
 */
export class GpsKalman {
  private x: [number, number, number, number] | null = null;
  private p = 1; // scalar covariance approximation
  private lastT = 0;
  private readonly q: number;

  constructor(processNoise = 3) { this.q = processNoise; }

  /** Feed a fix; returns the smoothed position. */
  update(fix: LatLng & { accuracyMeters: number; timestampMs: number }): LatLng {
    const degPerMeter = 1 / 111_320;
    const r = Math.max(fix.accuracyMeters, 3) * degPerMeter;
    if (!this.x) {
      this.x = [fix.lat, fix.lng, 0, 0];
      this.p = r * r;
      this.lastT = fix.timestampMs;
      return { lat: fix.lat, lng: fix.lng };
    }
    const dt = Math.max((fix.timestampMs - this.lastT) / 1000, 0.001);
    this.lastT = fix.timestampMs;
    // Predict
    const [lat, lng, vLat, vLng] = this.x;
    const predLat = lat + vLat * dt;
    const predLng = lng + vLng * dt;
    this.p += this.q * dt * degPerMeter * degPerMeter;
    // Update
    const k = this.p / (this.p + r * r);
    const newLat = predLat + k * (fix.lat - predLat);
    const newLng = predLng + k * (fix.lng - predLng);
    this.x = [newLat, newLng, (newLat - lat) / dt, (newLng - lng) / dt];
    this.p *= 1 - k;
    return { lat: newLat, lng: newLng };
  }

  reset() { this.x = null; this.p = 1; }
}

/** Point-in-polygon (ray casting) for lie detection against course geometry. */
export function pointInPolygon(pt: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng, yi = ring[i].lat, xj = ring[j].lng, yj = ring[j].lat;
    if (yi > pt.lat !== yj > pt.lat && pt.lng < ((xj - xi) * (pt.lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
