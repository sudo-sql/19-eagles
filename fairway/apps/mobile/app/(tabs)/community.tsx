/** Community (opt-in, private by default). Never interrupts scoring. */
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@fairway/ui-tokens";
import { useTheme } from "../../src/lib/theme.tsx";

export default function Community() {
  const t = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <Text style={[styles.h1, { color: t.text }]}>Community</Text>
      <Text style={{ color: t.textMuted, textAlign: "center" }}>
        Friends, live group leaderboards, and badges — all opt-in.{"\n"}
        Your profile is private until you say otherwise.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.md },
  h1: { fontSize: typography.scale.h1, fontFamily: typography.display.family, fontWeight: "800" },
});
