/**
 * Play home — "two taps to first tee" (Fix #1):
 *   Tap 1: the single primary CTA "Play <nearest course>" (GPS pre-resolved).
 *   Tap 2: "Start round" on the tee-confirm sheet.
 * Zero interstitials. Premium exists only as one quiet dismissible card
 * (dismiss = hidden 60 days) and in Settings.
 */
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MMKV } from "react-native-mmkv";
import { spacing, typography } from "@fairway/ui-tokens";
import { gps } from "../../src/lib/gps.ts";
import { supabaseProvider, type CourseSummary } from "../../src/lib/courses.ts";
import { useTheme } from "../../src/lib/theme.tsx";

const prefs = new MMKV({ id: "fairway-prefs" });
const DISMISS_KEY = "premiumCardDismissedUntil";

export default function PlayHome() {
  const t = useTheme();
  const [nearest, setNearest] = useState<CourseSummary | null>(null);
  const showPremiumCard = (prefs.getString(DISMISS_KEY) ?? "") < new Date().toISOString();

  useEffect(() => {
    (async () => {
      if (!(await gps.requestPermission())) return;
      await gps.setMode("balanced"); // no precise GPS until the round starts
      const unsub = gps.subscribe(async (fix) => {
        unsub();
        const courses = await supabaseProvider.searchNearby(fix.lat, fix.lng, 30).catch(() => []);
        setNearest(courses[0] ?? null);
      });
    })();
    return () => { gps.setMode("off"); };
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <Text style={[styles.brand, { color: t.text }]}>Fairway</Text>
      {/* ONE primary action (Fix #3) */}
      <Pressable
        accessibilityLabel={nearest ? `Play ${nearest.name}` : "Find a course"}
        style={[styles.cta, { backgroundColor: t.accent }]}
        onPress={() => router.push(nearest ? `/round/new?courseId=${nearest.id}` : "/round/new")}
      >
        <Text style={[styles.ctaLabel, { color: t.accentText }]}>
          {nearest ? `Play ${nearest.name}` : "Start a round"}
        </Text>
        {nearest?.distanceMeters != null && (
          <Text style={[styles.ctaSub, { color: t.accentText }]}>
            {(nearest.distanceMeters / 1609).toFixed(1)} mi away
          </Text>
        )}
      </Pressable>

      <Pressable style={styles.secondary} onPress={() => router.push("/round/new")}>
        <Text style={{ color: t.textMuted }}>Choose a different course</Text>
      </Pressable>

      {showPremiumCard && (
        <View style={[styles.premiumCard, { backgroundColor: t.surface, borderColor: t.hairline }]}>
          <Text style={{ color: t.text, fontWeight: "600" }}>Fairway Premium — $39.99/yr</Text>
          <Text style={{ color: t.textMuted, fontSize: typography.scale.caption, marginTop: 4 }}>
            AI caddie, green contours, plays-like distances. Everything you have now stays free — that's the covenant.
          </Text>
          <Pressable
            accessibilityLabel="dismiss premium card"
            onPress={() => {
              const until = new Date(Date.now() + 60 * 864e5).toISOString(); // 60 days
              prefs.set(DISMISS_KEY, until);
            }}
          >
            <Text style={{ color: t.textMuted, marginTop: 8 }}>Dismiss</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, justifyContent: "center", gap: spacing.md },
  brand: { fontSize: typography.scale.h1, fontFamily: typography.display.family, fontWeight: "800", textAlign: "center", marginBottom: spacing.xl },
  cta: { borderRadius: 16, paddingVertical: spacing.lg, alignItems: "center" },
  ctaLabel: { fontSize: typography.scale.h3, fontWeight: "700" },
  ctaSub: { fontSize: typography.scale.caption, opacity: 0.8, marginTop: 2 },
  secondary: { alignItems: "center", padding: spacing.sm, minHeight: 48, justifyContent: "center" },
  premiumCard: { borderRadius: 16, borderWidth: 1, padding: spacing.md, marginTop: spacing.xxl },
});
