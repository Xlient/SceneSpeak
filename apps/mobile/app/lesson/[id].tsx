import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { usePractice } from "../../src/progress/practice-context";
import { appGrader, appVoiceGrader } from "../../src/services/app-services";
import { findLesson } from "../../src/services/lesson-store";
import { color } from "../../src/theme/tokens";
import { LessonPlayer } from "../../src/ui/lesson-player";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lesson = useMemo(() => findLesson(id), [id]);
  const { finishLesson } = usePractice();

  if (!lesson) {
    return (
      <View style={styles.page}>
        <Stack.Screen options={{ title: "Lesson" }} />
        <Text style={styles.text}>That lesson isn't available anymore. Pick one from the home screen.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `${lesson.scenario.title} · ${lesson.scenario.level}` }} />
      <LessonPlayer
        lesson={lesson}
        grader={appGrader}
        voiceGrader={appVoiceGrader}
        onComplete={finishLesson}
        onExit={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  text: { fontSize: 16, color: color.ink },
});
