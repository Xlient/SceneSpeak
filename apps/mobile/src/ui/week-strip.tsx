import { StyleSheet, Text, View } from "react-native";
import type { WeekDay } from "@scenespeak/core/progress/weekly";
import { color, outline } from "../theme/tokens";
import { weekdayLabel } from "./weekday";

/** The last seven days, with a flame on each day practised. */
export const WeekStrip = ({ days }: { days: readonly WeekDay[] }) => (
  <View style={styles.strip} accessibilityLabel="Last 7 days" accessibilityRole="list">
    {days.map((d, i) => {
      const label = i === days.length - 1 ? "Today" : weekdayLabel(d.day);
      const practised = d.lessons > 0;
      return (
        <View
          key={d.day}
          style={styles.day}
          accessible
          accessibilityLabel={`${label}, ${practised ? `${d.lessons} ${d.lessons === 1 ? "lesson" : "lessons"}` : "no practice"}`}
        >
          <View style={[styles.dot, practised ? styles.on : null]}>
            <Text>{practised ? "🔥" : ""}</Text>
          </View>
          <Text style={styles.label}>{label}</Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  strip: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", gap: 4, flex: 1 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: outline.color,
    backgroundColor: color.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  on: { backgroundColor: color.butter },
  label: { fontSize: 12, fontWeight: "700", color: color.ink },
});
