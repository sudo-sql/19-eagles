/** Tee-confirm sheet: tap 2 of "two taps to first tee". Group setup and side
 *  games are OPTIONAL expanders, never blockers. Starting downloads the full
 *  course for offline play. */
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { spacing, typography } from "@fairway/ui-tokens";
import { getCachedCourse, prefetchCourse } from "../../src/lib/courses.ts";
import { db } from "../../src/lib/db.ts";
import { useTheme } from "../../src/lib/theme.tsx";

export default function NewRound() {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const t = useTheme();
  const [zen, setZen] = useState(false); // per-round, remembered server-side
  const [starting, setStarting] = useState(false);

  const start = async () => {
    if (!courseId) { router.push("/course-search"); return; }
    setStarting(true);
    try { await prefetchCourse(courseId); } catch { /* offline: use cache if present */ }
    const course = getCachedCourse(courseId);
    if (!course) { setStarting(false); return; }
    const roundId = `local-${Date.now()}`;
    db.runSync(
      "insert into local_rounds (id, course_json, started_at, zen_mode) values (?, ?, ?, ?)",
      [roundId, JSON.stringify(course), new Date().toISOString(), zen ? 1 : 0],
    );
    db.runSync(
      "insert into local_players (id, round_id, guest_name, position) values (?, ?, ?, 0)",
      [`${roundId}-p0`, roundId, "Me"],
    );
    router.replace(`/round/${roundId}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <Text style={[styles.title, { color: t.text }]}>Ready to play</Text>
      <View style={styles.zenRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: typography.scale.body }}>Zen mode</Text>
          <Text style={{ color: t.textMuted, fontSize: typography.scale.caption }}>
            Hide score-to-par until the round ends
          </Text>
        </View>
        <Switch value={zen} onValueChange={setZen} thumbColor={t.accent} />
      </View>
      <Pressable style={[styles.cta, { backgroundColor: t.accent }]} onPress={start} disabled={starting}>
        <Text style={{ color: t.accentText, fontWeight: "700", fontSize: typography.scale.h3 }}>
          {starting ? "Downloading course…" : "Start round"}
        </Text>
      </Pressable>
      <Text style={{ color: t.textMuted, fontSize: typography.scale.caption, textAlign: "center" }}>
        Course data downloads now — the full round works with no signal.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, justifyContent: "center", gap: spacing.lg },
  title: { fontSize: 28, fontFamily: "Fraunces", fontWeight: "800", textAlign: "center" },
  zenRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cta: { minHeight: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
