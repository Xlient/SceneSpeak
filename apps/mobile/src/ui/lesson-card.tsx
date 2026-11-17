import { StyleSheet, Text, View } from "react-native";
import { languageName } from "../polyfills/intl-display-names";
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
  <ToyButton label={`Play ${title}. ${blurb}`} tint={tint} onPress={onPlay}>
    <Text style={styles.title}>
      {emoji ? `${emoji} ` : ""}
      {title}
    </Text>
    <Text style={styles.blurb}>{blurb}</Text>
    <View style={styles.meta}>
      <Text style={styles.pill}>
        {languageName(language) ?? language} · {level}
      </Text>
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
  credit: { fontSize: 13, color: color.ink, fontStyle: "italic" },
});
