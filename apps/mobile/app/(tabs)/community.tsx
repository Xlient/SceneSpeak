import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { buildPlayableLesson } from "@scenespeak/core/lesson/playable-lesson";
import { contributors } from "@scenespeak/core/lesson/community/contributors";
import { type LibraryEntry, parseLibraryLesson } from "@scenespeak/core/library/library";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";
import { COMMUNITY_LESSONS } from "../../src/lessons/community";
import { languageName } from "../../src/polyfills/intl-display-names";
import { library } from "../../src/services/app-services";
import { rememberLesson } from "../../src/services/lesson-store";
import { color, outline, radius, tintAt } from "../../src/theme/tokens";
import { LessonCard } from "../../src/ui/lesson-card";
import { LibrarySection } from "../../src/ui/library-section";
import { ToyButton } from "../../src/ui/toy-button";

const LESSON_GUIDE_URL = "https://github.com/Xlient/SceneSpeak/blob/main/packages/core/lessons/README.md";

export default function CommunityScreen() {
  const router = useRouter();
  const [playError, setPlayError] = useState<string | null>(null);
  const people = contributors(COMMUNITY_LESSONS);
  const open = (id: string) => router.push({ pathname: "/lesson/[id]", params: { id } });

  const playLibrary = async (entry: LibraryEntry) => {
    setPlayError(null);
    try {
      const lesson = parseLibraryLesson(await library.lesson(entry.id));
      open(rememberLesson(buildPlayableLesson(lesson.scenario, lesson.recipe)));
    } catch (error) {
      setPlayError(error instanceof NotConnectedError ? error.message : "Couldn't open that lesson. Try another one.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.lead}>Lessons written by learners and teachers around the world, checked by our mods before they go live.</Text>

      <LibrarySection language={null} onPlay={(entry) => void playLibrary(entry)} onCreate={() => router.push("/create")} />
      {playError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {playError}
        </Text>
      ) : null}

      <Text style={styles.title} accessibilityRole="header">
        Reviewed community lessons
      </Text>
      {COMMUNITY_LESSONS.length === 0 ? (
        <Text style={styles.text}>No community lessons yet. Be the first!</Text>
      ) : (
        COMMUNITY_LESSONS.map((lesson, index) => (
          <LessonCard
            key={lesson.path}
            title={lesson.scenario.title}
            blurb={lesson.blurb}
            emoji={lesson.emoji}
            language={lesson.scenario.language}
            level={lesson.scenario.level}
            credit={`By ${lesson.authors.join(", ")}`}
            tint={tintAt(index + 2)}
            onPlay={() => open(lesson.scenario.id)}
          />
        ))
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">
          Contributors
        </Text>
        {people.length === 0 ? (
          <Text style={styles.text}>Nobody yet.</Text>
        ) : (
          people.map((person) => (
            <View key={person.username} style={styles.person}>
              <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Text style={styles.avatarText}>{person.username[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.text}>
                <Text style={styles.strong}>@{person.username}</Text> · {person.lessons} {person.lessons === 1 ? "lesson" : "lessons"} ·{" "}
                {person.languages.map((code) => languageName(code) ?? code).join(", ")}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">
          Write a lesson
        </Text>
        <Text style={styles.text}>1. Copy the example lesson file and write your conversation in any language.</Text>
        <Text style={styles.text}>2. Run the checks. They tell you if a prop doesn't fit or a goal has no line.</Text>
        <Text style={styles.text}>3. Open a pull request. A mod reviews it, and once merged it appears here.</Text>
        <ToyButton label="Read the lesson guide (opens GitHub)" tint={color.sky} onPress={() => void Linking.openURL(LESSON_GUIDE_URL)}>
          <Text style={styles.link}>Read the lesson guide ↗</Text>
        </ToyButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, maxWidth: 720, width: "100%", alignSelf: "center" },
  lead: { fontSize: 15, color: color.inkSoft },
  title: { fontSize: 20, fontWeight: "800", color: color.ink, marginTop: 4 },
  text: { fontSize: 15, color: color.ink, flexShrink: 1 },
  strong: { fontWeight: "800" },
  error: { fontSize: 15, color: "#b3261e", fontWeight: "700" },
  card: {
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    padding: 14,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: color.ink },
  person: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.lilac,
    borderWidth: 2,
    borderColor: outline.color,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "800", color: color.ink },
  link: { fontSize: 16, fontWeight: "800", color: color.ink, textAlign: "center" },
});
