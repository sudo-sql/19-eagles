/** Three primary tabs max + profile (Fix #3). Advanced tools live behind a
 *  single "More" sheet inside each tab — never a fourth tab. */
import { Tabs } from "expo-router";
import { useTheme } from "../../src/lib/theme.tsx";

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.hairline },
      tabBarActiveTintColor: t.accent,
      tabBarInactiveTintColor: t.textMuted,
    }}>
      <Tabs.Screen name="index" options={{ title: "Play" }} />
      <Tabs.Screen name="stats" options={{ title: "Stats" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
