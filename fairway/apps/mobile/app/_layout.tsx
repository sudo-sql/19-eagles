import { Stack } from "expo-router";
import { useEffect } from "react";
import { ThemeProvider } from "../src/lib/theme.tsx";
import { migrate } from "../src/lib/db.ts";

export default function RootLayout() {
  useEffect(() => { migrate(); }, []);
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="round/[id]" options={{ gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}
