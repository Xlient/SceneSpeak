import { Stack } from "expo-router";
import { useSyncExternalStore } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { type ModelEvent, summarize } from "@scenespeak/core/monitor/model-monitor";
import { monitor } from "../src/services/app-services";
import { color, outline, radius } from "../src/theme/tokens";

const TASK_LABEL: Record<ModelEvent["task"], string> = {
  grade: "Grade reply",
  "grade-voice": "Grade voice",
  screen: "Check request",
  match: "Find similar lesson",
  generate: "Write lesson",
  paint: "Paint backdrop",
  speak: "Character voice",
  explain: "Grammar breakdown",
  coach: "Weekly coach",
};

const ms = (value: number | null) => (value === null ? "–" : `${value} ms`);

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/** Where every AI call ran, why, and how long it took. */
export default function ModelMonitorScreen() {
  const events = useSyncExternalStore(monitor.subscribe, monitor.events);
  const summary = summarize(events);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: "Model Monitor" }} />
      <View style={styles.stats}>
        <Stat label="On device" value={summary.onDevice} />
        <Stat label="Cloud" value={summary.inCloud} />
        <Stat label="Cloud calls saved" value={summary.cloudCallsSaved} />
        <Stat label="Avg on device" value={ms(summary.avgLatencyMs.on_device)} />
        <Stat label="Avg cloud" value={ms(summary.avgLatencyMs.in_cloud)} />
        <Stat label="Failed" value={summary.failures} />
      </View>

      {events.length === 0 ? (
        <Text style={styles.note}>No AI calls yet. Play a lesson or create one, then come back.</Text>
      ) : (
        <View style={styles.list} accessibilityLabel="Recent AI calls, newest first">
          {events.map((event) => (
            <View key={event.id} style={styles.event} accessible>
              <View style={styles.eventHead}>
                <Text style={styles.task}>{TASK_LABEL[event.task]}</Text>
                <Text style={[styles.badge, { backgroundColor: event.source === "on_device" ? color.lilac : color.sky }]}>
                  {event.source === "on_device" ? "Device" : "Cloud"}
                </Text>
                <Text style={styles.text}>{Math.round(event.latencyMs)} ms</Text>
                <Text style={[styles.text, event.ok ? styles.ok : styles.failed]}>{event.ok ? "OK" : "Failed"}</Text>
              </View>
              {event.route ? <Text style={styles.route}>{event.route}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, maxWidth: 720, width: "100%", alignSelf: "center" },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: {
    flexGrow: 1,
    flexBasis: "30%",
    backgroundColor: color.card,
    borderWidth: 2,
    borderColor: outline.color,
    borderRadius: radius.small,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800", color: color.ink },
  statLabel: { fontSize: 12, fontWeight: "700", color: color.inkSoft, textAlign: "center" },
  note: { fontSize: 14, color: color.inkSoft },
  list: { gap: 8 },
  event: {
    backgroundColor: color.card,
    borderWidth: 2,
    borderColor: outline.color,
    borderRadius: radius.small,
    padding: 10,
    gap: 4,
  },
  eventHead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  task: { fontSize: 15, fontWeight: "800", color: color.ink, flexGrow: 1 },
  badge: {
    fontSize: 12,
    fontWeight: "800",
    color: color.ink,
    borderWidth: 2,
    borderColor: outline.color,
    borderRadius: 999,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  text: { fontSize: 14, color: color.ink },
  ok: { color: color.mintDeep, fontWeight: "800" },
  failed: { color: "#b3261e", fontWeight: "800" },
  route: { fontSize: 13, color: color.inkSoft },
});
