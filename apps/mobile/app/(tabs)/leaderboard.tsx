import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuthState } from "../../src/auth/auth-context";
import { usePractice } from "../../src/progress/practice-context";
import { board } from "../../src/services/app-services";
import { color, outline, radius } from "../../src/theme/tokens";
import { AccountCard } from "../../src/ui/account-card";
import { BoardCard } from "../../src/ui/board-card";
import { WeekStrip } from "../../src/ui/week-strip";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function LeaderboardScreen() {
  const { status } = useAuthState();
  const practice = usePractice();
  const name = status.kind === "member" ? (status.user.displayName ?? "You") : "You";

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.lead}>Practise a little every day to keep your streak alive.</Text>

      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          {name}
        </Text>
        <WeekStrip days={practice.week} />
        <View style={styles.stats}>
          <Stat label="Current streak" value={practice.streak > 0 ? `🔥 ${practice.streak}` : "0"} />
          <Stat label="Best streak" value={String(practice.best)} />
          <Stat label="Points" value={`⭐ ${practice.xp}`} />
          <Stat label="Lessons finished" value={String(practice.lessonsDone)} />
        </View>
        <Text style={styles.note}>Stored on this device only.</Text>
      </View>

      <BoardCard store={board} auth={status} practisedDays={practice.practisedDays} />

      <AccountCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, maxWidth: 720, width: "100%", alignSelf: "center" },
  lead: { fontSize: 15, color: color.inkSoft },
  card: {
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    padding: 14,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "800", color: color.ink },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: color.cream,
    borderWidth: 2,
    borderColor: outline.color,
    borderRadius: radius.small,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "800", color: color.ink },
  statLabel: { fontSize: 13, fontWeight: "700", color: color.inkSoft },
  note: { fontSize: 13, color: color.inkSoft },
});
