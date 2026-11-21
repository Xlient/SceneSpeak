import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { LibraryEntry } from "@scenespeak/core/library/library";
import { useAuthState } from "../auth/auth-context";
import { library } from "../services/app-services";
import { color, outline, radius, tintAt } from "../theme/tokens";
import { LessonCard } from "./lesson-card";
import { ToyButton } from "./toy-button";
import { useLibrary } from "./use-library";

const matches = (entry: LibraryEntry, query: string) => {
  const q = query.trim().toLowerCase();
  return q === "" || `${entry.title} ${entry.topic}`.toLowerCase().includes(q);
};

export interface LibrarySectionProps {
  /** null lists every language. */
  language: string | null;
  onPlay: (entry: LibraryEntry) => void;
  onCreate: () => void;
}

/** Shared lessons people made with "Create a lesson", most upvoted first. */
export const LibrarySection = ({ language, onPlay, onCreate }: LibrarySectionProps) => {
  const { status } = useAuthState();
  const { state, voted, canVote, toggleVote, report, notice } = useLibrary(library, status, language);
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const entries = state.status === "ready" ? state.entries.filter((e) => matches(e, query)) : [];

  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        Lesson library
      </Text>
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search lessons"
        placeholderTextColor={color.inkSoft}
        accessibilityLabel="Search the library"
        returnKeyType="search"
      />
      <Text style={styles.note}>
        Lessons people made with "Create a lesson" and chose to share.{canVote ? " Upvote the ones you like." : " Sign in with Google on the Leaderboard tab to vote."}
      </Text>
      {notice ? (
        <Text style={styles.note} accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}

      {state.status === "loading" && <Text style={styles.text}>Loading lessons…</Text>}
      {state.status === "failed" && <Text style={styles.error}>{state.message}</Text>}
      {state.status === "ready" && entries.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.text}>{query ? "No lessons match that search." : "No shared lessons yet."}</Text>
          <ToyButton label="Create one" tint={color.butter} onPress={onCreate} />
        </View>
      )}

      {entries.map((entry, index) => {
        const mine = voted.has(entry.id);
        return (
          <View key={entry.id} style={styles.entry}>
            <LessonCard
              title={entry.title}
              blurb={entry.topic}
              language={entry.language}
              level={entry.level}
              credit={`By ${entry.authorName}`}
              tint={tintAt(index)}
              onPlay={() => onPlay(entry)}
            />
            <View style={styles.actions}>
              <ToyButton
                label={`${entry.votes} upvotes${mine ? ", you upvoted this" : ""}. Upvote ${entry.title}`}
                tint={mine ? color.butter : color.card}
                disabled={!canVote}
                onPress={() => void toggleVote(entry.id)}
              >
                <Text style={styles.vote}>▲ {entry.votes}</Text>
              </ToyButton>
              {canVote &&
                (confirming === entry.id ? (
                  <>
                    <ToyButton
                      label="Yes, report"
                      tint={color.rose}
                      onPress={() => {
                        setConfirming(null);
                        void report(entry.id);
                      }}
                    />
                    <ToyButton label="Cancel" tint={color.card} onPress={() => setConfirming(null)} />
                  </>
                ) : (
                  <ToyButton label={`Report ${entry.title}`} tint={color.card} onPress={() => setConfirming(entry.id)}>
                    <Text style={styles.vote}>⚑ Report</Text>
                  </ToyButton>
                ))}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { gap: 10 },
  title: { fontSize: 20, fontWeight: "800", color: color.ink },
  search: {
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.small,
    backgroundColor: color.card,
    paddingHorizontal: 12,
    minHeight: 46,
    fontSize: 16,
    color: color.ink,
  },
  note: { fontSize: 13, color: color.inkSoft },
  text: { fontSize: 15, color: color.ink },
  error: { fontSize: 15, color: "#b3261e", fontWeight: "700" },
  empty: { gap: 8 },
  entry: { gap: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vote: { fontSize: 15, fontWeight: "800", color: color.ink },
});
