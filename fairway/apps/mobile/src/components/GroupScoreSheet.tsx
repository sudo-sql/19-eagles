/**
 * Group score entry in ≤3s per hole (Fix #7): every player on one screen,
 * steppers pre-filled to par, swipe up/down per row, one confirm advances.
 * 56pt touch targets — glove-friendly.
 */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { touch, typography } from "@fairway/ui-tokens";
import { useTheme } from "../lib/theme.tsx";

export interface PlayerRow { id: string; name: string; strokes: number }

export function GroupScoreSheet({ par, players, zenMode, runningToPar, onConfirm }: {
  par: number;
  players: { id: string; name: string }[];
  zenMode: boolean;
  runningToPar?: Record<string, number>;
  onConfirm: (scores: PlayerRow[]) => void;
}) {
  const t = useTheme();
  const [rows, setRows] = useState<PlayerRow[]>(
    () => players.map((p) => ({ ...p, strokes: par })), // pre-filled to par
  );
  const bump = (id: string, d: number) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, strokes: Math.max(1, r.strokes + d) } : r)));

  return (
    <View style={[styles.sheet, { backgroundColor: t.surface }]}>
      {rows.map((r) => {
        const swipe = Gesture.Fling();
        return (
          <GestureDetector
            key={r.id}
            gesture={Gesture.Exclusive(
              Gesture.Fling().direction(1).onEnd(() => bump(r.id, -1)), // swipe up = fewer
              Gesture.Fling().direction(2).onEnd(() => bump(r.id, +1)),
            )}
          >
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: t.text }]}>{r.name}</Text>
                {!zenMode && runningToPar?.[r.id] != null && (
                  <Text style={{ color: runningToPar[r.id]! <= 0 ? t.underPar : t.overPar, fontSize: typography.scale.caption }}>
                    {runningToPar[r.id]! > 0 ? `+${runningToPar[r.id]}` : runningToPar[r.id] === 0 ? "E" : runningToPar[r.id]}
                  </Text>
                )}
              </View>
              <Pressable accessibilityLabel={`decrease ${r.name} score`} style={[styles.step, { borderColor: t.hairline }]} onPress={() => bump(r.id, -1)}>
                <Text style={[styles.stepText, { color: t.text }]}>−</Text>
              </Pressable>
              <Text style={[styles.score, { color: r.strokes < par ? t.underPar : r.strokes > par ? t.overPar : t.text }]}>
                {r.strokes}
              </Text>
              <Pressable accessibilityLabel={`increase ${r.name} score`} style={[styles.step, { borderColor: t.hairline }]} onPress={() => bump(r.id, +1)}>
                <Text style={[styles.stepText, { color: t.text }]}>+</Text>
              </Pressable>
            </View>
          </GestureDetector>
        );
      })}
      <Pressable
        accessibilityLabel="confirm scores and go to next hole"
        style={[styles.confirm, { backgroundColor: t.accent }]}
        onPress={() => onConfirm(rows)}
      >
        <Text style={[styles.confirmText, { color: t.accentText }]}>Next hole</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { borderRadius: 16, padding: 16, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: touch.scoringStepper },
  name: { fontSize: typography.scale.body, fontWeight: "600" },
  step: { width: touch.scoringStepper, height: touch.scoringStepper, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 28, fontWeight: "600" },
  score: { fontSize: typography.scale.scoreCard, fontFamily: typography.display.family, fontWeight: "800", width: 52, textAlign: "center" },
  confirm: { minHeight: touch.minTarget, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  confirmText: { fontSize: typography.scale.body, fontWeight: "700" },
});
