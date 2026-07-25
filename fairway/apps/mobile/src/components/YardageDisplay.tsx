/** Sunlight-readable yardages: 72pt center number, F/C/B flanks, accuracy chip. */
import { StyleSheet, Text, View } from "react-native";
import { typography } from "@fairway/ui-tokens";
import { useTheme } from "../lib/theme.tsx";

export function YardageDisplay({ front, center, back, accuracyMeters }: {
  front: number | null; center: number | null; back: number | null; accuracyMeters?: number;
}) {
  const t = useTheme();
  return (
    <View style={styles.row} accessibilityLabel={`${center ?? "unknown"} yards to center of green`}>
      <Text style={[styles.side, { color: t.textMuted }]}>{front ?? "–"}</Text>
      <View style={styles.centerBlock}>
        <Text style={[styles.center, { color: t.text }]}>{center ?? "–"}</Text>
        {accuracyMeters != null && (
          <Text style={[styles.accuracy, { color: accuracyMeters <= 8 ? t.underPar : t.overPar }]}>
            ±{Math.round(accuracyMeters)}m
          </Text>
        )}
      </View>
      <Text style={[styles.side, { color: t.textMuted }]}>{back ?? "–"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  centerBlock: { alignItems: "center" },
  center: { fontSize: typography.scale.yardagePrimary, fontFamily: typography.display.family, fontWeight: "800", lineHeight: typography.scale.yardagePrimary * 1.05 },
  side: { fontSize: typography.scale.yardageSecondary, fontFamily: typography.sans.family },
  accuracy: { fontSize: typography.scale.micro, marginTop: 2 },
});
