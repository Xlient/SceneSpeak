import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import type { AuthStatus } from "@scenespeak/core/auth/auth-state";
import { type BoardStore, type RankedEntry, boardName, rankBoard } from "@scenespeak/core/leaderboard/board";
import { daysPractisedThisWeek, isoWeekId } from "@scenespeak/core/leaderboard/week-id";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";
import { color, outline, radius } from "../theme/tokens";

import { BOARD_JOINED_KEY as JOINED_KEY } from "../legal/app-data";

type BoardState = { status: "loading" } | { status: "ready"; rows: RankedEntry[] } | { status: "failed"; message: string };

export interface BoardCardProps {
  store: BoardStore;
  auth: AuthStatus;
  practisedDays: readonly string[];
}

/** This week's board. Players choose to appear; only a first name and days practised are shared. */
export const BoardCard = ({ store, auth, practisedDays }: BoardCardProps) => {
  const member = auth.kind === "member" ? auth.user : undefined;
  const signedIn = auth.kind === "member" || auth.kind === "guest";
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<BoardState>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const weekId = isoWeekId(new Date());
  const days = daysPractisedThisWeek(practisedDays, new Date());
  const uid = member?.uid;
  const name = boardName(member?.displayName);

  useEffect(() => {
    AsyncStorage.getItem(JOINED_KEY)
      .then((value) => setJoined(value === "yes"))
      .catch(() => undefined);
  }, []);

  const refresh = useCallback(
    async (isCurrent: () => boolean) => {
      try {
        if (uid && joined) await store.publish(weekId, { uid, displayName: name, daysPractised: days });
        const rows = rankBoard(await store.load(weekId), uid);
        if (isCurrent()) setState({ status: "ready", rows });
      } catch (error) {
        if (!isCurrent()) return;
        setState({
          status: "failed",
          message: error instanceof NotConnectedError ? error.message : "Couldn't load the leaderboard. Check your connection.",
        });
      }
    },
    [store, weekId, uid, joined, name, days],
  );

  useEffect(() => {
    if (!signedIn) return;
    let current = true;
    void refresh(() => current);
    return () => {
      current = false;
    };
  }, [signedIn, refresh]);

  const toggleJoined = async (next: boolean) => {
    if (!uid) return;
    setBusy(true);
    try {
      if (!next) await store.remove(weekId, uid);
      await AsyncStorage.setItem(JOINED_KEY, next ? "yes" : "no").catch(() => undefined);
      setJoined(next);
    } catch {
      setState({ status: "failed", message: "Couldn't update the leaderboard. Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        This week's board
      </Text>
      <Text style={styles.note}>Ranked by days practised, not speed. Only a first name and days practised are shared.</Text>

      <View accessibilityLiveRegion="polite">
        {!signedIn && <Text style={styles.text}>Sign in to see the board.</Text>}
        {signedIn && state.status === "loading" && <Text style={styles.text}>Loading the board…</Text>}
        {signedIn && state.status === "failed" && <Text style={styles.text}>{state.message}</Text>}
        {signedIn &&
          state.status === "ready" &&
          (state.rows.length === 0 ? (
            <Text style={styles.text}>Nobody's on the board yet this week. Be the first!</Text>
          ) : (
            state.rows.map((row) => (
              <View key={row.uid} style={[styles.row, row.isMe ? styles.me : null]}>
                <Text style={styles.rank}>{row.rank}</Text>
                <Text style={styles.name}>
                  {row.displayName}
                  {row.isMe ? " (you)" : ""}
                </Text>
                <Text style={styles.text}>
                  {row.daysPractised} {row.daysPractised === 1 ? "day" : "days"}
                </Text>
              </View>
            ))
          ))}
      </View>

      {member ? (
        <View style={styles.toggle}>
          <Text style={styles.text} nativeID="board-join-label">
            Show me on the board as “{name}”
          </Text>
          <Switch
            value={joined}
            disabled={busy}
            onValueChange={(next) => void toggleJoined(next)}
            accessibilityLabel={`Show me on the board as ${name}`}
            accessibilityLabelledBy="board-join-label"
            trackColor={{ true: color.mintDeep, false: color.cream }}
          />
        </View>
      ) : (
        <Text style={styles.note}>Sign in with Google below to join the board.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    padding: 14,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: "800", color: color.ink },
  note: { fontSize: 13, color: color.inkSoft },
  text: { fontSize: 15, color: color.ink, flexShrink: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4, paddingHorizontal: 6, borderRadius: radius.small },
  me: { backgroundColor: color.butter },
  rank: { width: 24, fontWeight: "800", color: color.ink, textAlign: "center" },
  name: { flex: 1, fontSize: 15, fontWeight: "700", color: color.ink },
  toggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
});
