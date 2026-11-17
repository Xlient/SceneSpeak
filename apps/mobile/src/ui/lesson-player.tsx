import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import type { Grader } from "@scenespeak/core/lesson/grader";
import { LESSON_MODES, type LessonMode, MODE_SETTINGS } from "@scenespeak/core/lesson/lesson-mode";
import { characterAnimation, currentLine, initialLessonState, lessonReducer } from "@scenespeak/core/lesson/lesson-progress";
import type { PlayableLesson } from "@scenespeak/core/lesson/playable-lesson";
import { scoreLesson } from "@scenespeak/core/lesson/scoring";
import type { FinishedLesson } from "@scenespeak/core/progress/streak";
import type { InlineAudio } from "../ai-port/hybrid-model";
import { SceneView } from "../scene/scene-view";
import { gradeErrorMessage } from "../services/grade-error-message";
import type { MobileVoiceGrader } from "../services/mobile-voice-grader";
import { color, outline, radius } from "../theme/tokens";
import { FeedbackCard } from "./feedback-card";
import { LessonSummary } from "./lesson-summary";
import { SceneBubble } from "./scene-bubble";
import { ToyButton } from "./toy-button";
import { VoiceReply } from "./voice-reply";

type Attempt = { kind: "text"; reply: string } | { kind: "voice"; audio: InlineAudio };

// Browsers record WebM, which Gemini doesn't take, so Speaking mode is phone-only here (the web app has its own).
const VOICE_SUPPORTED = Platform.OS !== "web";

export interface LessonPlayerProps {
  lesson: PlayableLesson;
  grader: Grader;
  voiceGrader: MobileVoiceGrader;
  initialMode?: LessonMode;
  onExit: () => void;
  /** Called once when the learner reaches the end of the lesson. */
  onComplete?: (result: FinishedLesson) => void;
}

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (next: boolean) => void }) => (
  <View style={styles.toggle}>
    <Text style={styles.label}>{label}</Text>
    <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: color.mintDeep, false: color.cream }} />
  </View>
);

/** Same reducer, grading and scoring as the web lesson screen, with Typing and Speaking modes. */
export const LessonPlayer = ({ lesson, grader, voiceGrader, initialMode = "typing", onExit, onComplete }: LessonPlayerProps) => {
  const { scenario, manifest } = lesson;
  const reducer = useMemo(() => lessonReducer(scenario), [scenario]);
  const [state, dispatch] = useReducer(reducer, scenario, initialLessonState);
  const [reply, setReply] = useState("");
  const [mode, setMode] = useState<LessonMode>(VOICE_SUPPORTED ? initialMode : "typing");
  const settings = MODE_SETTINGS[mode];
  const [showTranslation, setShowTranslation] = useState(settings.showTranslation);
  const [autoPlay, setAutoPlay] = useState(settings.autoPlay);
  const [typeInstead, setTypeInstead] = useState(false);
  const attempt = useRef<Attempt | null>(null);
  const line = currentLine(scenario, state);
  const speaking = mode === "speaking";
  const score = state.phase === "done" ? scoreLesson(scenario, state.attempts, { speaking }) : undefined;
  const speakerName = (id: string) => scenario.cast.find((member) => member.characterId === id)?.name ?? id;
  const completed = useRef(false);

  const changeMode = (next: LessonMode) => {
    setMode(next);
    setShowTranslation(MODE_SETTINGS[next].showTranslation);
    setAutoPlay(MODE_SETTINGS[next].autoPlay);
    setTypeInstead(false);
  };

  useEffect(() => {
    if (state.phase !== "done" || completed.current) return;
    completed.current = true;
    const { xp } = scoreLesson(scenario, state.attempts, { speaking });
    onComplete?.({ lessonId: scenario.id, goalsDone: state.completedGoalIds.length, goalsTotal: scenario.goals.length, speaking, xp });
  }, [state.phase, state.attempts, state.completedGoalIds, scenario, onComplete, speaking]);

  useEffect(() => {
    const current = attempt.current;
    if (state.phase !== "grading" || !line || !current) return;
    const controller = new AbortController();
    const base = { scenario, line, signal: controller.signal };
    const grading = current.kind === "text" ? grader({ ...base, reply: current.reply }) : voiceGrader({ ...base, audio: current.audio });
    // Drop the recording as soon as it's handed off.
    attempt.current = null;
    grading.then(
      (result) => dispatch({ type: "graded", result }),
      (error: unknown) => {
        if (!controller.signal.aborted) dispatch({ type: "gradeFailed", message: gradeErrorMessage(error, current.kind) });
      },
    );
    return () => controller.abort();
  }, [state.phase, line, grader, voiceGrader, scenario]);

  const submit = () => {
    if (!reply.trim() || state.phase !== "replying") return;
    attempt.current = { kind: "text", reply };
    dispatch({ type: "submit" });
  };

  const submitVoice = useCallback((audio: InlineAudio) => {
    attempt.current = { kind: "voice", audio };
    dispatch({ type: "submit" });
  }, []);

  const goNext = () => {
    setReply("");
    dispatch({ type: "continue" });
  };

  const grading = state.phase === "grading";
  const listening = state.phase === "listening";
  const autoAdvance = settings.autoAdvance && autoPlay && listening ? () => dispatch({ type: "next" }) : undefined;

  const typedReply = (
    <View style={styles.reply}>
      <Text style={styles.label} nativeID="reply-label">
        Your reply in Spanish
      </Text>
      <View style={styles.replyRow}>
        <TextInput
          style={styles.input}
          value={reply}
          onChangeText={setReply}
          onSubmitEditing={submit}
          editable={!grading}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="send"
          accessibilityLabel="Your reply in Spanish"
          accessibilityLabelledBy="reply-label"
        />
        <ToyButton label={grading ? "Checking…" : "Send"} onPress={submit} disabled={grading || !reply.trim()} />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      {VOICE_SUPPORTED && (
        <View style={styles.modes} accessibilityRole="radiogroup" accessibilityLabel="Lesson mode">
          {LESSON_MODES.map((id) => (
            <ToyButton
              key={id}
              label={`${MODE_SETTINGS[id].label} mode${mode === id ? ", selected" : ""}`}
              tint={mode === id ? color.butter : color.card}
              onPress={() => changeMode(id)}
            >
              <Text style={styles.modeLabel}>
                {MODE_SETTINGS[id].icon} {MODE_SETTINGS[id].label}
              </Text>
            </ToyButton>
          ))}
        </View>
      )}

      <View style={styles.stage}>
        <SceneView manifest={manifest} animation={characterAnimation(scenario, state)} />
      </View>

      {line && (
        <SceneBubble
          key={line.id}
          line={line}
          speakerName={speakerName(line.speaker)}
          language={scenario.language}
          showTranslation={showTranslation}
          autoPlay={autoPlay && listening}
          onEnded={autoAdvance}
        />
      )}

      {listening && <ToyButton label="Next" onPress={() => dispatch({ type: "next" })} />}

      {(state.phase === "replying" || grading) &&
        (speaking && !typeInstead ? (
          <View style={styles.reply}>
            <Text style={styles.prompt}>Say it out loud in Spanish</Text>
            <VoiceReply disabled={grading} onRecorded={submitVoice} />
            {grading && (
              <Text style={styles.note} accessibilityLiveRegion="polite">
                Listening to your answer…
              </Text>
            )}
            <ToyButton label="Type instead" tint={color.card} onPress={() => setTypeInstead(true)} />
          </View>
        ) : (
          typedReply
        ))}

      {state.error && (state.phase === "replying" || grading) && (
        <Text style={styles.error} accessibilityRole="alert">
          {state.error}
        </Text>
      )}

      {state.phase === "feedback" && state.lastResult && (
        <>
          <FeedbackCard result={state.lastResult} />
          <View style={styles.row}>
            {!state.lastResult.grade.ok && <ToyButton label="Try again" tint={color.peach} onPress={() => dispatch({ type: "retry" })} />}
            <ToyButton
              label={state.lastResult.grade.ok ? "Continue" : "Skip"}
              tint={state.lastResult.grade.ok ? color.mint : color.card}
              onPress={goNext}
            />
          </View>
        </>
      )}

      {score && <LessonSummary score={score} onExit={onExit} />}

      <View style={styles.panel}>
        <Text style={styles.heading} accessibilityRole="header">
          Goals
        </Text>
        {scenario.goals.map((goal) => {
          const done = state.completedGoalIds.includes(goal.id);
          return (
            <Text key={goal.id} style={[styles.goal, done ? styles.goalDone : null]} accessibilityLabel={`${goal.description}, ${done ? "done" : "to do"}`}>
              {done ? "✓ " : "○ "}
              {goal.description}
            </Text>
          );
        })}
        <Toggle label="Show English" value={showTranslation} onChange={setShowTranslation} />
        <Toggle label="Play voices" value={autoPlay} onChange={setAutoPlay} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { padding: 16, gap: 12, maxWidth: 900, width: "100%", alignSelf: "center" },
  modes: { flexDirection: "row", gap: 10, justifyContent: "center" },
  modeLabel: { fontSize: 15, fontWeight: "800", color: color.ink },
  stage: {
    height: 320,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    overflow: "hidden",
  },
  reply: { gap: 6 },
  replyRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  input: {
    flex: 1,
    minHeight: 50,
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.small,
    paddingHorizontal: 12,
    fontSize: 17,
    color: color.ink,
  },
  prompt: { fontSize: 17, fontWeight: "800", color: color.ink, textAlign: "center" },
  note: { fontSize: 13, color: color.inkSoft, textAlign: "center" },
  label: { fontSize: 15, fontWeight: "700", color: color.ink },
  error: { fontSize: 15, color: "#b3261e", fontWeight: "700" },
  row: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  panel: {
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    padding: 14,
    gap: 6,
  },
  heading: { fontSize: 17, fontWeight: "800", color: color.ink },
  goal: { fontSize: 15, color: color.ink },
  goalDone: { color: color.mintDeep, fontWeight: "700" },
  toggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
});
