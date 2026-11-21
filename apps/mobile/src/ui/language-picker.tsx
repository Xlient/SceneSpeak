import { Pressable, StyleSheet, Text, View } from "react-native";
import { LESSON_LANGUAGES, type LessonLanguageCode, findLanguage } from "@scenespeak/core/language/languages";
import { color, lift, outline, radius } from "../theme/tokens";

export interface LanguagePickerProps {
  value: LessonLanguageCode;
  onChange: (code: LessonLanguageCode) => void;
  disabled?: boolean;
}

/** Lesson language as chunky radio tiles, with where its replies get graded. */
export const LanguagePicker = ({ value, onChange, disabled = false }: LanguagePickerProps) => {
  const chosen = findLanguage(value);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label} nativeID="language-label">
        Which language?
      </Text>
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabelledBy="language-label">
        {LESSON_LANGUAGES.map((option) => {
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
