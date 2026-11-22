import { StyleSheet, Text, View } from "react-native";
import { splitWords } from "@scenespeak/core/language/word-split";
import { LEARNER_SPEAKER, type Line } from "@scenespeak/core/schemas";
import { useLineVoice } from "../audio/use-line-voice";
import { color, outline, radius } from "../theme/tokens";
import { ToyButton } from "./toy-button";

export interface SceneBubbleProps {
  line: Line;
  speakerName: string;
  language: string;
  showTranslation: boolean;
  /** Character lines read themselves aloud when the line appears. */
  autoPlay: boolean;
  onEnded?: (() => void) | undefined;
}

/** The current line as a speech bubble under the scene, with its pronunciation one tap away. */
export const SceneBubble = ({ line, speakerName, language, showTranslation, autoPlay, onEnded }: SceneBubbleProps) => {
  const learner = line.speaker === LEARNER_SPEAKER;
  const voice = useLineVoice({ text: line.text, language, autoPlay: autoPlay && !learner, onEnded });
  const label = learner ? "Hear it" : "Listen";

  return (
    <View style={[styles.bubble, learner ? styles.learner : null]} accessibilityLiveRegion="polite">
      <Text style={styles.speaker}>{learner ? "Your turn" : speakerName}</Text>
      <Text style={styles.line}>
        {voice.available
          ? splitWords(line.text, language).map((part, i) =>
              part.kind === "text" ? (
                part.text
              ) : (
                <Text
                  key={i}
                  style={[styles.word, voice.playingWord === i ? styles.wordPlaying : null]}
                  accessibilityRole="button"
                  accessibilityLabel={`Hear ${part.text}`}
                  onPress={() => voice.playWord(part.text, i)}
                >
                  {part.text}
                </Text>
              ),
            )
          : line.text}
      </Text>
      {/* Learners always see what their line means; character lines follow the Show English toggle. */}
      {(learner || showTranslation) && <Text style={styles.translation}>{line.translation}</Text>}
      <View style={styles.actions}>
        {voice.available && (
          <ToyButton
            label={voice.playing ? `Stop ${label.toLowerCase()}` : `${label}: ${line.text}`}
            tint={voice.playing ? color.butter : color.card}
            onPress={voice.playing ? voice.stop : voice.play}
          >
            <Text style={styles.action}>{voice.playing ? "■ Stop" : `🔊 ${label}`}</Text>
          </ToyButton>
        )}
        {voice.available && <Text style={styles.note}>Tap a word to hear it.</Text>}
        {voice.missing && <Text style={styles.note}>No voice for this language on this device.</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    padding: 14,
    gap: 2,
  },
  learner: { backgroundColor: color.cream },
  speaker: { fontSize: 13, fontWeight: "800", color: color.inkSoft, textTransform: "uppercase" },
  line: { fontSize: 20, fontWeight: "800", color: color.ink },
  word: { textDecorationLine: "underline", textDecorationColor: color.butter, textDecorationStyle: "solid" },
  wordPlaying: { backgroundColor: color.butter },
  translation: { fontSize: 15, color: color.inkSoft },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  action: { fontSize: 14, fontWeight: "800", color: color.ink },
  note: { fontSize: 13, color: color.inkSoft },
});
