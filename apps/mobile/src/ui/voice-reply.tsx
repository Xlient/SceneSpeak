import { StyleSheet, Text, View } from "react-native";
import type { InlineAudio } from "../ai-port/hybrid-model";
import { useVoiceReply } from "../audio/use-voice-reply";
import { color } from "../theme/tokens";
import { ToyButton } from "./toy-button";

export interface VoiceReplyProps {
  disabled: boolean;
  onRecorded: (audio: InlineAudio) => void;
}

/** The mic button for Speaking mode. Recordings go to the cloud grader once and are never stored. */
export const VoiceReply = ({ disabled, onRecorded }: VoiceReplyProps) => {
  const { state, start, stop } = useVoiceReply(onRecorded);
  const recording = state.kind === "recording";
  return (
    <View style={styles.wrap}>
      <ToyButton
        label={recording ? "Stop recording and send" : "Record your reply"}
        tint={recording ? color.rose : color.mint}
        disabled={disabled}
        onPress={() => void (recording ? stop() : start())}
      >
        <Text style={styles.label}>{recording ? "■ Stop and send" : "🎙️ Tap to speak"}</Text>
      </ToyButton>
      <Text style={styles.note} accessibilityLiveRegion="polite">
        {recording ? "Listening… tap again when you're done." : "Graded in the cloud. Your recording is never saved."}
      </Text>
      {state.kind === "error" && (
        <Text style={styles.error} accessibilityRole="alert">
          {state.message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 18, fontWeight: "800", color: color.ink, textAlign: "center" },
  note: { fontSize: 13, color: color.inkSoft, textAlign: "center" },
  error: { fontSize: 15, color: "#b3261e", fontWeight: "700" },
});
