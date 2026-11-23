import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, Stack, useRouter } from "expo-router";
import { type ReactNode, useState, useSyncExternalStore } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { MIN_AGE } from "@scenespeak/core/legal/policy";
import { TOUR_SEEN_KEY } from "../src/legal/app-data";
import { describeNativeDevice } from "../src/onboarding/device-step";
import { deviceStatus } from "../src/services/app-services";
import { color, outline, radius } from "../src/theme/tokens";
import { DownloadBar } from "../src/ui/download-bar";
import { Bullets, Para } from "../src/ui/legal";
import { ToyButton } from "../src/ui/toy-button";

interface Step {
  icon: string;
  title: string;
  body: ReactNode;
}

const linkStyle = { color: color.ink, fontWeight: "800", textDecorationLine: "underline" } as const;
const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";

/** First-run tour: what a lesson is, on-device AI, and privacy. */
export default function WelcomeScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const device = useSyncExternalStore(deviceStatus.subscribe, deviceStatus.get);
  const deviceStep = describeNativeDevice(device, platform);

  const close = () => {
    void AsyncStorage.setItem(TOUR_SEEN_KEY, "seen").catch(() => undefined);
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const steps: Step[] = [
    {
      icon: "👋",
      title: "Welcome to SceneSpeak",
      body: <Para>Practise real conversations in tiny 3D scenes. Each lesson takes about 5 minutes: chat with a character, reach your goals, and earn stars.</Para>,
    },
    {
      icon: "💬",
      title: "How a lesson works",
      body: (
        <Bullets
          items={[
            "Read what the character says. Flip on Show English if you need it.",
            "Type your reply in the language you picked.",
            "Get instant feedback with a better way to say it, then keep the conversation going.",
          ]}
        />
      ),
    },
    {
      icon: "🔒",
      title: deviceStep.title,
      body: (
        <>
          <Para>{deviceStep.body}</Para>
          {device.status === "downloading" && <DownloadBar progress={device.progress} label="Gemini Nano download" />}
          {deviceStep.canSetUp && <ToyButton label="Set up on-device AI" tint={color.mint} onPress={() => void deviceStatus.download()} />}
        </>
      ),
    },
    {
      icon: "🛡️",
      title: "Your privacy",
      body: (
        <>
          <Bullets
            items={[
              "Your progress and streaks are stored only on this phone.",
              "When the cloud is used, your replies and lesson requests go to Google's Gemini through Firebase.",
              "Personal details like emails and phone numbers are removed from lesson requests before they leave your phone.",
              "Joining the leaderboard is optional and shares only your first name and days practised.",
            ]}
          />
          <Text style={styles.note}>
            SceneSpeak is for ages {MIN_AGE}+; younger learners should use it with a parent or guardian. By continuing you agree to the{" "}
            <Link href="/terms" style={linkStyle}>
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" style={linkStyle}>
              Privacy Policy
            </Link>
            .
          </Text>
        </>
      ),
    },
  ];

  const step = steps[index] ?? steps[0];
  if (!step) return null;
  const last = index === steps.length - 1;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: "Welcome" }} />
      <View style={styles.card}>
        <Text style={styles.icon} importantForAccessibility="no" accessibilityElementsHidden>
          {step.icon}
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          {step.title}
        </Text>
        <View style={styles.body} accessibilityLiveRegion="polite">
          {step.body}
        </View>
        <Text style={styles.note} accessibilityLabel={`Step ${index + 1} of ${steps.length}`}>
          {steps.map((_, i) => (i === index ? "●" : "○")).join(" ")}
        </Text>
        <View style={styles.actions}>
          {index > 0 ? (
            <ToyButton label="Back" tint={color.card} onPress={() => setIndex(index - 1)} />
          ) : (
            <ToyButton label="Skip" tint={color.card} onPress={close} />
          )}
          <ToyButton label={last ? "Start learning" : "Next"} tint={color.butter} onPress={() => (last ? close() : setIndex(index + 1))} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, maxWidth: 560, width: "100%", alignSelf: "center", flexGrow: 1, justifyContent: "center" },
  card: {
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    padding: 20,
    gap: 12,
  },
  icon: { fontSize: 48, textAlign: "center" },
  title: { fontSize: 22, fontWeight: "800", color: color.ink, textAlign: "center" },
  body: { gap: 10 },
  note: { fontSize: 13, color: color.inkSoft, textAlign: "center" },
  actions: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
});
