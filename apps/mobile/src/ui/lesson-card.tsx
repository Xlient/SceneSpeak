import { StyleSheet, Text, View } from "react-native";
import { isCloudOnly } from "@scenespeak/core/language/language-filter";
import { languageName } from "@scenespeak/core/language/languages";
import { color } from "../theme/tokens";
import { ToyButton } from "./toy-button";

export interface LessonCardProps {
  title: string;
  blurb: string;
  emoji?: string;
  language: string;
  level: string;
  credit?: string;
  tint: string;
  onPlay: () => void;
}

/** A playable lesson as one big toy button. */
export const LessonCard = ({ title, blurb, emoji, language, level, credit, tint, onPlay }: LessonCardProps) => (
  <ToyButton label={`Play ${title}. ${blurb}${isCloudOnly(language) ? " Cloud only." : ""}`} tint={tint} onPress={onPlay}>
    <Text style={styles.title}>
      {emoji ? `${emoji} ` : ""}
      {title}
    </Text>
    <Text style={styles.blurb}>{blurb}</Text>
    <View style={styles.meta}>
      <Text style={styles.pill}>
        {languageName(language)} · {level}
      </Text>
      {isCloudOnly(language) ? <Text style={[styles.pill, styles.cloud]}>☁️ Cloud only</Text> : null}
      {credit ? <Text style={styles.credit}>{credit}</Text> : null}
    </View>
  </ToyButton>
);

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "800", color: color.ink },
  blurb: { fontSize: 15, color: color.ink, marginTop: 2 },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 6 },
  pill: {
    fontSize: 12,
    fontWeight: "800",
    color: color.ink,
    backgroundColor: color.card,
    borderWidth: 2,
    borderColor: color.ink,
    borderRadius: 999,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  cloud: { backgroundColor: color.sky },
  credit: { fontSize: 13, color: color.ink, fontStyle: "italic" },
});
