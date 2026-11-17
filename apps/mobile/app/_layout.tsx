import "../src/polyfills";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider } from "../src/auth/auth-context";
import { PracticeProvider } from "../src/progress/practice-context";
import { deviceStatus } from "../src/services/app-services";
import { startNetworkTracking } from "../src/services/network-status";
import { color } from "../src/theme/tokens";

export default function RootLayout() {
  useEffect(() => void deviceStatus.refresh(), []);
  useEffect(() => startNetworkTracking(), []);
  return (
    <AuthProvider>
      <PracticeProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: color.paper },
            headerTintColor: color.ink,
            headerTitleStyle: { fontWeight: "800" },
            contentStyle: { backgroundColor: color.paper },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Lessons" }} />
          <Stack.Screen name="welcome" options={{ presentation: "modal", title: "Welcome" }} />
          {["privacy", "terms", "monitor", "create", "lesson/[id]"].map((name) => (
            <Stack.Screen key={name} name={name} options={{ presentation: "card" }} />
          ))}
        </Stack>
      </PracticeProvider>
    </AuthProvider>
  );
}
