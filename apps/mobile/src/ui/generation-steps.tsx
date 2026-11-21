import { StyleSheet, Text, View } from "react-native";
import type { GenerationStep } from "@scenespeak/core/lesson/generator";
import { color, outline, radius } from "../theme/tokens";
import { type StepState, stepState } from "./step-state";

export type StepId = GenerationStep | "build";

export const STEPS: readonly { id: StepId; label: string; where: "device" | "cloud" | "local" }[] = [
  { id: "device-check", label: "Checking your request privately", where: "device" },
  { id: "library-check", label: "Looking for a lesson that already exists", where: "device" },
  { id: "cloud-write", label: "Writing the lesson", where: "cloud" },
  { id: "build", label: "Building the 3D scene", where: "local" },
];

const WHERE_LABEL = { device: "On your device", cloud: "Cloud", local: "On your phone" } as const;

const MARK_COLOR: Record<StepState, string> = { done: color.mint, active: color.butter, failed: color.rose, pending: color.cream };

/** The create flow's progress list, with where each step runs. `onDevice` false: the lesson language routes to the cloud, so device steps run there too. */
export const GenerationSteps = ({ active, failed, onDevice = true }: { active: StepId; failed: boolean; onDevice?: boolean }) => {
  const activeIndex = STEPS.findIndex((step) => step.id === active);
  return (
    <View style={styles.list} accessibilityLiveRegion="polite">
      {STEPS.map((step, index) => {
        const state = stepState(index, activeIndex, failed);
        const where = step.where === "device" && !onDevice ? "cloud" : step.where;
        return (
          <View key={step.id} style={styles.row} accessibilityLabel={`${step.label}, ${WHERE_LABEL[where]}, ${state}`}>
            <View style={[styles.mark, { backgroundColor: MARK_COLOR[state] }]}>
              <Text style={styles.markText}>{state === "done" ? "✓" : state === "failed" ? "!" : index + 1}</Text>
            </View>
            <View style={styles.body}>
              <Text style={[styles.label, state === "pending" ? styles.pending : null]}>{step.label}</Text>
              <Text style={[styles.badge, { backgroundColor: where === "cloud" ? color.sky : color.lilac }]}>{WHERE_LABEL[where]}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: outline.color,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { fontWeight: "800", color: color.ink },
  body: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  label: { fontSize: 15, color: color.ink, fontWeight: "700" },
  pending: { color: color.inkSoft, fontWeight: "400" },
  badge: {
    fontSize: 12,
    fontWeight: "700",
    color: color.ink,
    borderWidth: 2,
    borderColor: outline.color,
    borderRadius: radius.small,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
});
