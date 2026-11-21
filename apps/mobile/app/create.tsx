import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DEFAULT_LESSON_LANGUAGE, type LessonLanguageCode, findLanguage, languageName } from "@scenespeak/core/language/languages";
import { LESSON_PROMPT_MAX, type LibraryMatch, checkLessonPrompt } from "@scenespeak/core/lesson/generator";
import { buildPlayableLesson } from "@scenespeak/core/lesson/playable-lesson";
import { parseLibraryLesson } from "@scenespeak/core/library/library";
import { appGenerator, library } from "../src/services/app-services";
import { generateErrorMessage } from "../src/services/generate-error-message";
import { rememberLesson } from "../src/services/lesson-store";
import { color, outline, radius } from "../src/theme/tokens";
import { GenerationSteps, type StepId } from "../src/ui/generation-steps";
import { ToyButton } from "../src/ui/toy-button";
import { LanguagePicker } from "../src/ui/language-picker";

const EXAMPLES = ["Opening a bank account", "Asking a neighbour to borrow a ladder", "Checking in at a hotel", "Buying fruit at the market"];

type Status =
  | { kind: "editing" }
  | { kind: "working"; step: StepId }
  | { kind: "failed"; step: StepId; message: string }
  | { kind: "existing"; match: LibraryMatch; prompt: string };

export default function CreateLessonScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState<LessonLanguageCode>(DEFAULT_LESSON_LANGUAGE);
  const [status, setStatus] = useState<Status>({ kind: "editing" });
  const [inputError, setInputError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const open = (id: string) => router.replace({ pathname: "/lesson/[id]", params: { id } });

  const run = async (request: string, allowExisting: boolean) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    let step: StepId = "device-check";
    const advance = (next: StepId) => {
      step = next;
      setStatus({ kind: "working", step: next });
    };
    advance("device-check");
    try {
      const result = await appGenerator({
        prompt: request,
        language,
        signal: current.signal,
        allowExisting,
        onProgress: (progress) => {
          if (!current.signal.aborted) advance(progress.step);
        },
      });
      if (current.signal.aborted) return;
      if (result.kind === "existing") {
        setStatus({ kind: "existing", match: result.match, prompt: request });
        return;
      }
      advance("build");
      open(rememberLesson(buildPlayableLesson(result.lesson.scenario, result.lesson.recipe)));
    } catch (error) {
      if (!current.signal.aborted) setStatus({ kind: "failed", step, message: generateErrorMessage(error) });
    }
  };

  const playExisting = async (id: string) => {
    try {
      const lesson = parseLibraryLesson(await library.lesson(id));
      open(rememberLesson(buildPlayableLesson(lesson.scenario, lesson.recipe)));
    } catch (error) {
      setStatus({ kind: "failed", step: "library-check", message: generateErrorMessage(error) });
    }
  };

  const submit = () => {
    const check = checkLessonPrompt(prompt);
    if (!check.ok) {
      setInputError(check.message);
      return;
    }
    setInputError(null);
    void run(check.prompt, true);
  };

  const working = status.kind === "working";

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: "Create a lesson" }} />
      <View style={styles.card}>
        <LanguagePicker value={language} onChange={setLanguage} disabled={working} />
        <Text style={styles.label} nativeID="prompt-label">
          What do you want to be able to say? (English or {languageName(language)})
        </Text>
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          editable={!working}
          multiline
          maxLength={LESSON_PROMPT_MAX}
          accessibilityLabel="What do you want to be able to say?"
          accessibilityLabelledBy="prompt-label"
          accessibilityHint="Describe a situation, for example opening a bank account"
        />
        <Text style={styles.note}>
          {prompt.length}/{LESSON_PROMPT_MAX}. Personal details are removed on your device, then your request goes to Google's Gemini to
          write the lesson.
        </Text>
        {inputError && (
          <Text style={styles.error} accessibilityRole="alert">
            {inputError}
          </Text>
        )}
        <View style={styles.chips} accessibilityRole="list" accessibilityLabel="Examples">
          {EXAMPLES.map((example) => (
            <ToyButton key={example} label={example} tint={color.cream} disabled={working} onPress={() => setPrompt(example)}>
              <Text style={styles.chip}>{example}</Text>
            </ToyButton>
          ))}
        </View>
        <ToyButton label={working ? "Building…" : "✨ Build my lesson"} tint={color.butter} disabled={working} onPress={submit} />
      </View>

      {status.kind === "existing" && (
        <View style={styles.card} accessibilityLiveRegion="polite">
          <Text style={styles.heading}>There's already a lesson for that!</Text>
          <Text style={styles.text}>
            <Text style={styles.strong}>{status.match.title}</Text> in the lesson library covers the same situation
            {status.match.votes > 0 ? ` and has ▲ ${status.match.votes} ${status.match.votes === 1 ? "upvote" : "upvotes"}` : ""}. Playing it
            is instant and saves writing a new one in the cloud.
          </Text>
          <View style={styles.row}>
            <ToyButton label="Play it" onPress={() => void playExisting(status.match.id)} />
            <ToyButton label="Make mine anyway" tint={color.card} onPress={() => void run(status.prompt, false)} />
          </View>
        </View>
      )}

      {(status.kind === "working" || status.kind === "failed") && (
        <View style={styles.card}>
          <Text style={styles.heading} accessibilityRole="header">
            Progress
          </Text>
          <GenerationSteps active={status.step} failed={status.kind === "failed"} onDevice={findLanguage(language)?.onDevice ?? false} />
          {status.kind === "failed" && (
            <>
              <Text style={styles.error} accessibilityRole="alert">
                {status.message}
              </Text>
              <ToyButton label="Try a featured lesson" tint={color.card} onPress={() => router.replace("/")} />
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, maxWidth: 720, width: "100%", alignSelf: "center" },
  card: {
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    padding: 16,
    gap: 10,
  },
  label: { fontSize: 16, fontWeight: "800", color: color.ink },
  input: {
    minHeight: 84,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.small,
    padding: 12,
    fontSize: 17,
    color: color.ink,
    backgroundColor: color.paper,
    textAlignVertical: "top",
  },
  note: { fontSize: 13, color: color.inkSoft },
  error: { fontSize: 15, color: "#b3261e", fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { fontSize: 14, fontWeight: "700", color: color.ink },
  heading: { fontSize: 18, fontWeight: "800", color: color.ink },
  text: { fontSize: 15, color: color.ink },
  strong: { fontWeight: "800" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
});
