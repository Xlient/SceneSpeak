import { StyleSheet, Text, View } from "react-native";
import { describeAccount } from "@scenespeak/core/auth/auth-state";
import { useAuthState } from "../auth/auth-context";
import { color, outline, radius } from "../theme/tokens";
import { ToyButton } from "./toy-button";

/** Who you're signed in as, with Google sign-in for guests (needed to vote, report and join the board). */
export const AccountCard = () => {
  const { status, error, busy, canSignIn, signInWithGoogle, signOut } = useAuthState();
  const view = describeAccount(status);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{view.label}</Text>
      {status.kind === "member" ? (
        <ToyButton label="Sign out" tint={color.card} disabled={busy} onPress={signOut} />
      ) : canSignIn ? (
        <>
          <Text style={styles.note}>Sign in with Google to vote on shared lessons and join the weekly board. Your progress stays on this phone.</Text>
          <ToyButton label={busy ? "Signing in…" : "Sign in with Google"} tint={color.sky} disabled={busy || status.kind === "loading"} onPress={signInWithGoogle} />
        </>
      ) : (
        <Text style={styles.note}>Accounts aren't set up in this copy of SceneSpeak.</Text>
      )}
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
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
  title: { fontSize: 17, fontWeight: "800", color: color.ink },
  note: { fontSize: 14, color: color.inkSoft },
  error: { fontSize: 14, color: "#b3261e", fontWeight: "700" },
});
