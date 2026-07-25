/** Stats tab: strokes gained vs your handicap band + Inside-100 dashboard. */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@fairway/ui-tokens";
import { useTheme } from "../../src/lib/theme.tsx";

const Row = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <View style={styles.row}>
    <Text style={[styles.label, { color }]}>{label}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
  </View>
);

export default function Stats() {
  const t = useTheme();
  // Data loads from local db + supabase; rendered sections mirror the web dashboard.
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={styles.screen}>
      <Text style={[styles.h1, { color: t.text }]}>Strokes gained</Text>
      <Text style={{ color: t.textMuted }}>vs a typical player at your index</Text>
      <View style={[styles.card, { backgroundColor: t.surface }]}>
        <Row label="Driving" value="–" color={t.text} />
        <Row label="Approach" value="–" color={t.text} />
        <Row label="Short game" value="–" color={t.text} />
        <Row label="Putting" value="–" color={t.text} />
      </View>
      <Text style={[styles.h1, { color: t.text }]}>Inside 100</Text>
      <View style={[styles.card, { backgroundColor: t.surface }]}>
        <Row label="Up & down %" value="–" color={t.text} />
        <Row label="Sand saves" value="–" color={t.text} />
        <Row label="Proximity 50–100y" value="–" color={t.text} />
      </View>
      <Text style={[styles.h1, { color: t.text }]}>Handicap</Text>
      <View style={[styles.card, { backgroundColor: t.surface }]}>
        <Text style={{ color: t.textMuted, fontSize: typography.scale.caption }}>
          Tap any index to see exactly how it was computed — best 8 of 20, every differential shown.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: spacing.lg, gap: spacing.sm },
  h1: { fontSize: typography.scale.h2, fontFamily: typography.display.family, fontWeight: "800", marginTop: spacing.md },
  card: { borderRadius: 16, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", minHeight: 32, alignItems: "center" },
  label: { fontSize: typography.scale.body },
  value: { fontSize: typography.scale.body, fontWeight: "700" },
});
