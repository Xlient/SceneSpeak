import { StyleSheet, Text, View } from "react-native";
import type { LessonScore } from "@scenespeak/core/lesson/scoring";
import { color, outline, radius } from "../theme/tokens";
import { ToyButton } from "./toy-button";

const TITLES = ["Keep practising!", "Good start!", "Great job!", "Perfect!"] as const;

/** End-of-lesson card: stars, points and the phrases worth another go. */
export const LessonSummary = ({ score, onExit }: { score: LessonScore; onExit: () => void }) => (
  <View style={styles.card} accessibilityLiveRegion="polite">
    <Text style={styles.title} accessibilityRole="header">
      {TITLES[score.stars] ?? TITLES[0]}
    </Text>
    <Text style={styles.stars} accessibilityRole="image" accessibilityLabel={`${score.stars} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <Text key={n} style={{ color: n <= score.stars ? color.butter : color.cream }}>
          ★
        </Text>
      ))}
    </Text>
    <Text style={styles.xp}>+{score.xp} points</Text>
    <Text style={styles.text}>
      {score.goalsDone} of {score.goalsTotal} goals done
      {score.firstTryGoals > 0 ? ` · ${score.firstTryGoals} on the first try` : ""}
      {score.accuracy !== null ? ` · ${score.accuracy}% first-try score` : ""}
    </Text>
    {score.review.length > 0 && (
      <View style={styles.review}>
        <Text style={styles.subtitle}>Phrases to review</Text>
        {score.review.map((phrase) => (
          <View key={phrase.lineId}>
            <Text style={styles.phrase}>{phrase.text}</Text>
            <Text style={styles.translation}>{phrase.translation}</Text>
          </View>
        ))}
      </View>
    )}
    <ToyButton label="Back to lessons" onPress={onExit} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    padding: 16,
    gap: 8,
    alignItems: "stretch",
  },
  title: { fontSize: 22, fontWeight: "800", color: color.ink, textAlign: "center" },
  stars: { fontSize: 36, textAlign: "center", textShadowColor: color.ink, textShadowRadius: 1 },
  xp: { fontSize: 17, fontWeight: "800", color: color.mintDeep, textAlign: "center" },
  text: { fontSize: 15, color: color.ink, textAlign: "center" },
  review: { gap: 6, marginTop: 4 },
  subtitle: { fontSize: 16, fontWeight: "800", color: color.ink },
  phrase: { fontSize: 15, fontWeight: "700", color: color.ink },
  translation: { fontSize: 14, color: color.inkSoft },
});
