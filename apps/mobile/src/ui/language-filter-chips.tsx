import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { type LanguageFilter, isCloudOnly } from "@scenespeak/core/language/language-filter";
import { languageName } from "@scenespeak/core/language/languages";
import { color } from "../theme/tokens";

export interface LanguageFilterChipsProps {
  options: readonly string[];
  value: LanguageFilter;
  onChange: (value: LanguageFilter) => void;
}

/** "All" plus one chip per language, scrolling sideways; cloud-only languages carry a cloud mark. */
export const LanguageFilterChips = ({ options, value, onChange }: LanguageFilterChipsProps) => {
  const chip = (code: LanguageFilter, label: string) => {
    const selected = value === code;
    const cloud = code !== null && isCloudOnly(code);
    return (
      <Pressable
        key={code ?? "all"}
        accessibilityRole="radio"
        accessibilityLabel={cloud ? `${label}, cloud only` : label}
        accessibilityState={{ checked: selected }}
        onPress={() => onChange(code)}
        style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
          styles.chip,
          { backgroundColor: selected ? color.mint : color.cream },
          selected || pressed ? styles.down : styles.raised,
          focused ? styles.focused : null,
        ]}
      >
        <Text style={styles.label}>
          {label}
          {cloud ? <Text style={styles.tag}> cloud </Text> : null}
        </Text>
      </Pressable>
    );
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Show lessons in">
      {chip(null, "All languages")}
      {options.map((code) => chip(code, languageName(code)))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 4 },
  chip: { borderWidth: 2, borderColor: color.ink, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  raised: { boxShadow: `0 2px 0 ${color.ink}`, marginBottom: 2 },
  down: { marginBottom: 2, transform: [{ translateY: 2 }] },
  focused: { outlineWidth: 3, outlineColor: color.sky, outlineStyle: "solid", outlineOffset: 2 },
  label: { fontSize: 14, fontWeight: "800", color: color.ink },
  tag: { fontSize: 11, backgroundColor: color.sky, borderRadius: 999, overflow: "hidden" },
});
