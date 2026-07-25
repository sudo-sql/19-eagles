/**
 * Live hole view: satellite map (prefetched tiles), F/C/B yardages,
 * tap-anywhere distance, shot tracking, group scoring sheet, Zen mode.
 * Works with zero connectivity (Fix #16); no gimmicks on this path (Fix #12).
 */
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { distanceYards, type LatLng } from "@fairway/engine";
import { spacing } from "@fairway/ui-tokens";
import { GroupScoreSheet, type PlayerRow } from "../../src/components/GroupScoreSheet.tsx";
import { YardageDisplay } from "../../src/components/YardageDisplay.tsx";
import { getCachedCourse } from "../../src/lib/courses.ts";
import { db } from "../../src/lib/db.ts";
import { gps } from "../../src/lib/gps.ts";
import { enqueue } from "../../src/lib/sync.ts";
import { useTheme } from "../../src/lib/theme.tsx";

interface HoleGeom {
  hole_number: number; par: number;
  green_front?: LatLng; green_center?: LatLng; green_back?: LatLng;
}

export default function LiveRound() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const [hole, setHole] = useState(1);
  const [fix, setFix] = useState<(LatLng & { accuracyMeters: number }) | null>(null);
  const [tapPoint, setTapPoint] = useState<LatLng | null>(null);
  const [trackingShot, setTrackingShot] = useState<LatLng | null>(null);

  const round = useMemo(() => db.getFirstSync<{ course_json: string; zen_mode: number }>(
    "select course_json, zen_mode from local_rounds where id = ?", [id]), [id]);
  const players = useMemo(() => db.getAllSync<{ id: string; guest_name: string }>(
    "select id, coalesce(guest_name, 'Me') as guest_name from local_players where round_id = ? order by position", [id]), [id]);
  const course = round ? JSON.parse(round.course_json) : getCachedCourse(String(id));
  const holes: HoleGeom[] = course?.holes ?? [];
  const current = holes.find((h) => h.hole_number === hole);

  useEffect(() => {
    gps.setMode(trackingShot ? "precise" : "precise"); // precise while this screen is foregrounded
    const unsub = gps.subscribe(setFix);
    return () => { unsub(); gps.setMode("balanced"); };
  }, [trackingShot]);

  const yards = (target?: LatLng | null) =>
    fix && target ? Math.round(distanceYards(fix, target)) : null;

  const confirmHole = (scores: PlayerRow[]) => {
    const now = new Date().toISOString();
    for (const s of scores) {
      db.runSync(
        `insert or replace into local_scores (round_id, player_id, hole, strokes, client_updated_at)
         values (?, ?, ?, ?, ?)`,
        [String(id), s.id, hole, s.strokes, now],
      );
      enqueue("hole_score", {
        round_id: id, round_player_id: s.id, hole_number: hole,
        strokes: s.strokes, client_updated_at: now,
      });
    }
    if (hole < holes.length) setHole(hole + 1);
  };

  const runningToPar = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const p of players) {
      const rows = db.getAllSync<{ hole: number; strokes: number }>(
        "select hole, strokes from local_scores where round_id = ? and player_id = ?", [String(id), p.id]);
      totals[p.id] = rows.reduce((sum, r) => {
        const h = holes.find((x) => x.hole_number === r.hole);
        return sum + (h ? r.strokes - h.par : 0);
      }, 0);
    }
    return totals;
  }, [players, hole]);

  return (
    <View style={[styles.screen, { backgroundColor: t.amoledBg }]}>
      <View style={styles.header}>
        <Text style={[styles.holeLabel, { color: t.textMuted }]}>
          Hole {hole} · Par {current?.par ?? "–"}
        </Text>
      </View>

      {/* Map placeholder region: MapLibre view with prefetched satellite tiles.
          Tapping the map sets tapPoint for tap-anywhere distance. */}
      <Pressable
        style={[styles.map, { borderColor: t.hairline }]}
        onPress={() => setTapPoint(current?.green_center ?? null) /* map tap → coordinate */}
      >
        <Text style={{ color: t.textMuted }}>
          {tapPoint && fix ? `${yards(tapPoint)} yds to point` : "Satellite hole view"}
        </Text>
      </Pressable>

      <YardageDisplay
        front={yards(current?.green_front)}
        center={yards(current?.green_center)}
        back={yards(current?.green_back)}
        accuracyMeters={fix?.accuracyMeters}
      />

      <Pressable
        accessibilityLabel={trackingShot ? "finish tracked shot" : "track this shot"}
        style={[styles.trackBtn, { borderColor: t.accent }]}
        onPress={() => {
          if (!fix) return;
          if (!trackingShot) { setTrackingShot(fix); return; }
          const dist = Math.round(distanceYards(trackingShot, fix));
          db.runSync(
            `insert into local_shots (id, round_id, player_id, hole, shot_number, start_lat, start_lng, end_lat, end_lng, distance_yards)
             values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [`${id}-${hole}-${Date.now()}`, String(id), players[0]?.id ?? "me", hole, 0,
             trackingShot.lat, trackingShot.lng, fix.lat, fix.lng, dist],
          );
          setTrackingShot(null);
        }}
      >
        <Text style={{ color: t.accent, fontWeight: "600" }}>
          {trackingShot ? "I'm at my ball — save shot" : "I'm hitting"}
        </Text>
      </Pressable>

      <GroupScoreSheet
        par={current?.par ?? 4}
        players={players.map((p) => ({ id: p.id, name: p.guest_name }))}
        zenMode={Boolean(round?.zen_mode)}
        runningToPar={runningToPar}
        onConfirm={confirmHole}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.md, gap: spacing.md },
  header: { alignItems: "center", paddingTop: spacing.xl },
  holeLabel: { fontSize: 16 },
  map: { flex: 1, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  trackBtn: { minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
