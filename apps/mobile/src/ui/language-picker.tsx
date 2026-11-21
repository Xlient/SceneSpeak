import { Pressable, StyleSheet, Text, View } from "react-native";
import { languagesByInference } from "@scenespeak/core/language/language-filter";
import { type LessonLanguageCode, findLanguage } from "@scenespeak/core/language/languages";
import { color, lift, outline, radius } from "../theme/tokens";

export interface LanguagePickerProps {
  value: LessonLanguageCode;
  onChange: (code: LessonLanguageCode) => void;
  disabled?: boolean;
}

const { onDevice, cloudOnly } = languagesByInference();
const GROUPS = [
  { id: "device", title: "🔒 On your device", note: "Graded privately when on-device AI is ready.", languages: onDevice },
  { id: "cloud", title: "☁️ Cloud only", note: "On-device AI doesn't speak these yet.", languages: cloudOnly },
] as const;

/** Lesson language as chunky radio tiles, with where its replies get graded. */
export const LanguagePicker = ({ value, onChange, disabled = false }: LanguagePickerProps) => {
  const chosen = findLanguage(value);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label} nativeID="language-label">
        Which language?
      </Text>
      <View style={styles.groups} accessibilityRole="radiogroup" accessibilityLabelledBy="language-label">
        {GROUPS.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.groupTitle} accessibilityRole="header">
              <Text style={[styles.groupBadge, { backgroundColor: group.id === "device" ? color.mint : color.sky }]}>{group.title}</Text> {group.note}
            </Text>
            <View style={styles.grid}>
              {group.languages.map((option) => {
                const selected = option.code === value;
                return (
                  <Pressable
                    key={option.code}
                    accessibilityRole="radio"
                    accessibilityLabel={option.name}
                    accessibilityState={{ checked: selected, disabled }}
                    disabled={disabled}
                    onPress={() => onChange(option.code)}
                    style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
                      styles.tile,
                      { backgroundColor: selected ? color.mint : color.cream },
                      selected || pressed ? styles.down : styles.raised,
                      disabled ? styles.disabled : null,
                      focused ? styles.focused : null,
                    ]}
                  >
                    <Text style={styles.native}>{option.nativeName}</Text>
                    <Text style={styles.english}>{option.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.note} accessibilityLiveRegion="polite">
        {chosen?.onDevice
          ? `On your device: ${chosen.name} replies can be graded privately when on-device AI is ready.`
          : `Cloud: on-device AI doesn't speak ${chosen?.name ?? "this language"} yet, so its replies are graded in the cloud.`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 16, fontWeight: "800", color: color.ink },
  groups: { gap: 10 },
  group: { gap: 6 },
  groupTitle: { fontSize: 13, color: color.inkSoft },
  groupBadge: { fontWeight: "800", color: color.ink, borderWidth: 2, borderColor: color.ink, borderRadius: 999, overflow: "hidden" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: {
    minWidth: 96,
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.small,
  },
  raised: { boxShadow: `0 ${lift}px 0 ${color.ink}`, marginBottom: lift },
  down: { marginBottom: lift, transform: [{ translateY: lift }] },
  disabled: { opacity: 0.6 },
  focused: { outlineWidth: 3, outlineColor: color.sky, outlineStyle: "solid", outlineOffset: 3 },
  native: { fontSize: 17, fontWeight: "800", color: color.ink },
  english: { fontSize: 12, color: color.ink },
  note: { fontSize: 13, color: color.inkSoft },
});
