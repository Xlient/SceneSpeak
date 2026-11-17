import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { TOUR_SEEN_KEY } from "../../src/legal/app-data";
import { color, outline } from "../../src/theme/tokens";

const icon = (glyph: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{glyph}</Text>;
  };

const MonitorButton = () => {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open the Model Monitor"
      onPress={() => router.push("/monitor")}
      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <Text style={{ fontSize: 20 }}>📊</Text>
    </Pressable>
  );
};

export default function TabsLayout() {
  const router = useRouter();

  // First launch: show the welcome tour once.
  useEffect(() => {
    AsyncStorage.getItem(TOUR_SEEN_KEY)
      .then((seen) => {
        if (seen !== "seen") router.push("/welcome");
      })
      .catch(() => undefined);
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.paper },
        headerTintColor: color.ink,
        headerTitleStyle: { fontWeight: "800" },
        headerRight: () => <MonitorButton />,
        sceneStyle: { backgroundColor: color.paper },
        tabBarStyle: { backgroundColor: color.card, borderTopWidth: outline.width, borderTopColor: outline.color },
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.inkSoft,
        tabBarLabelStyle: { fontWeight: "800" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Lessons", headerTitle: "SceneSpeak", tabBarIcon: icon("📚") }} />
      <Tabs.Screen name="community" options={{ title: "Community", tabBarIcon: icon("🌍") }} />
      <Tabs.Screen name="leaderboard" options={{ title: "Leaderboard", tabBarIcon: icon("🏆") }} />
    </Tabs>
  );
}
