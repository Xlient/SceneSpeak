import { StyleSheet, Text, View } from "react-native";
import type { GradeResult } from "@scenespeak/core/lesson/grader";
import { color, outline, radius } from "../theme/tokens";

const SOURCE_LABEL = { on_device: "Graded on your device", in_cloud: "Graded in the cloud" } as const;

export const FeedbackCard = ({ result }: { result: GradeResult }) => {
  const { grade, source } = result;
  return (
    <View style={[styles.card, { backgroundColor: grade.ok ? color.mint : color.peach }]} accessibilityLiveRegion="polite">
      <Text style={styles.title}>{grade.ok ? "Nice one!" : "Almost! Try again?"}</Text>
      <Text style={styles.text}>Score: {grade.score} / 100</Text>
      {grade.correction ? (
        <Text style={styles.text}>
          <Text style={styles.strong}>Better: </Text>
          {grade.correction}
        </Text>
      ) : null}
      {grade.hint ? (
        <Text style={styles.text}>
          <Text style={styles.strong}>Hint: </Text>
          {grade.hint}
        </Text>
      ) : null}
      <View style={[styles.badge, { backgroundColor: source === "on_device" ? color.lilac : color.sky }]}>
        <Text style={styles.badgeText}>{SOURCE_LABEL[source]}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: outline.width, borderColor: outline.color, borderRadius: radius.large, padding: 14, gap: 4 },
  title: { fontSize: 18, fontWeight: "800", color: color.ink },
  text: { fontSize: 15, color: color.ink },
  strong: { fontWeight: "800" },
  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 2,
    borderColor: outline.color,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 13, fontWeight: "700", color: color.ink },
});
