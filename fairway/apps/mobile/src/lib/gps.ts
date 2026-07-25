/**
 * Adaptive GPS duty-cycling (Fix #11 battery budget, Fix #12 accuracy).
 * High accuracy ONLY while the GPS screen is foregrounded or a shot is being
 * tracked; significant-change updates otherwise; low-power mode <30% battery.
 */
import * as Battery from "expo-battery";
import * as Location from "expo-location";
import { GpsKalman, type LatLng } from "@fairway/engine";

export type GpsMode = "precise" | "balanced" | "lowPower" | "off";

type Listener = (pos: LatLng & { accuracyMeters: number }) => void;

const OPTIONS: Record<Exclude<GpsMode, "off">, Location.LocationOptions> = {
  precise: { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 1, timeInterval: 1000 },
  balanced: { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
  lowPower: { accuracy: Location.Accuracy.Low, distanceInterval: 25, timeInterval: 15000 },
};

class GpsService {
  private sub: Location.LocationSubscription | null = null;
  private kalman = new GpsKalman();
  private listeners = new Set<Listener>();
  private mode: GpsMode = "off";
  lastFix: (LatLng & { accuracyMeters: number }) | null = null;

  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  /** Chooses the effective mode, downgrading below 30% battery. */
  private async effectiveMode(requested: GpsMode): Promise<GpsMode> {
    if (requested === "precise") {
      const level = await Battery.getBatteryLevelAsync().catch(() => 1);
      if (level >= 0 && level < 0.3) return "balanced"; // automatic low-power mode
    }
    return requested;
  }

  async setMode(requested: GpsMode) {
    const mode = await this.effectiveMode(requested);
    if (mode === this.mode) return;
    this.mode = mode;
    this.sub?.remove();
    this.sub = null;
    if (mode === "off") return;
    this.sub = await Location.watchPositionAsync(OPTIONS[mode], (loc) => {
      const smoothed = this.kalman.update({
        lat: loc.coords.latitude, lng: loc.coords.longitude,
        accuracyMeters: loc.coords.accuracy ?? 20, timestampMs: loc.timestamp,
      });
      this.lastFix = { ...smoothed, accuracyMeters: loc.coords.accuracy ?? 20 };
      this.listeners.forEach((l) => l(this.lastFix!));
    });
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}

export const gps = new GpsService();
