/** Profile & settings: auth, units, free-tier covenant, manage subscription
 *  (deep-links straight to the platform cancel screen — Fix #4). */
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@fairway/ui-tokens";
import { useTheme } from "../../src/lib/theme.tsx";

const CANCEL_URL = Platform.select({
  ios: "https://apps.apple.com/account/subscriptions",
  android: "https://play.google.com/store/account/subscriptions",
  default: "https://fairway.golf/account",
});

export default function Profile() {
  const t = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <Text style={[styles.h1, { color: t.text }]}>Profile</Text>
      <Pressable style={[styles.item, { borderColor: t.hairline }]} onPress={() => Linking.openURL(CANCEL_URL!)}>
        <Text style={{ color: t.text }}>Manage / cancel subscription</Text>
        <Text style={{ color: t.textMuted, fontSize: typography.scale.caption }}>
          Opens your {Platform.OS === "ios" ? "App Store" : "Play Store"} subscription page directly.
        </Text>
      </Pressable>
      <View style={[styles.item, { borderColor: t.hairline }]}>
        <Text style={{ color: t.text }}>The free-tier covenant</Text>
        <Text style={{ color: t.textMuted, fontSize: typography.scale.caption }}>
          GPS, scorecard, stats, manual shot tracking, and handicap are free forever.
          We will never move a shipped free feature behind the paywall.
        </Text>
      </View>
      <Pressable style={[styles.item, { borderColor: t.hairline }]}>
        <Text style={{ color: t.text }}>Export my data (CSV / JSON)</Text>
      </Pressable>
      <Pressable style={[styles.item, { borderColor: t.hairline }]}>
        <Text style={{ color: t.overPar }}>Delete account</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.md },
  h1: { fontSize: typography.scale.h1, fontFamily: typography.display.family, fontWeight: "800", marginTop: spacing.xl },
  item: { borderWidth: 1, borderRadius: 16, padding: spacing.md, gap: 4, minHeight: 48, justifyContent: "center" },
});
