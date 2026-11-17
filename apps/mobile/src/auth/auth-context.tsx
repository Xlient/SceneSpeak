import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuthUser } from "@scenespeak/core/auth/auth-client";
import { type AuthStatus, authErrorMessage, authStatusOf, isProviderDisabled } from "@scenespeak/core/auth/auth-state";
import { createFirebaseAuthClient } from "@scenespeak/core/auth/firebase-auth-client";
import { getFirebaseApp } from "../firebase/firebase-app";
import { googleSignInAvailable, signInWithGoogle, signOut } from "./google-sign-in";

interface AuthState {
  status: AuthStatus;
  error: string | undefined;
  busy: boolean;
  /** False when Firebase or the Google client ID isn't configured; sign-in is then hidden. */
  canSignIn: boolean;
  signInWithGoogle: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState>({
  status: { kind: "signed-out" },
  error: undefined,
  busy: false,
  canSignIn: false,
  signInWithGoogle: () => {},
  signOut: () => {},
});

/** Everyone starts as an anonymous guest, like the web app; Google sign-in links the guest. */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const app = useMemo(() => getFirebaseApp(), []);
  const client = useMemo(() => (app ? createFirebaseAuthClient(() => app) : null), [app]);
  const [user, setUser] = useState<AuthUser | null | undefined>(client ? undefined : null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const guestTried = useRef(false);

  useEffect(() => {
    if (!client) return;
    return client.subscribe((next) => {
      setUser(next);
      if (next !== null || guestTried.current) return;
      guestTried.current = true;
      client.signInAsGuest().catch((failure: unknown) => {
        if (!isProviderDisabled(failure)) setError(authErrorMessage(failure));
      });
    });
  }, [client]);

  const run = useCallback(
    (action: (firebaseApp: NonNullable<typeof app>) => Promise<void>) => {
      if (!app) return;
      setBusy(true);
      setError(undefined);
      action(app)
        .catch((failure: unknown) => setError(authErrorMessage(failure) ?? "Couldn't sign in. Please try again."))
        .finally(() => setBusy(false));
    },
    [app],
  );

  const value = useMemo(
    (): AuthState => ({
      status: authStatusOf(user),
      error,
      busy,
      canSignIn: app !== null && googleSignInAvailable,
      signInWithGoogle: () => run(signInWithGoogle),
      signOut: () => run(signOut),
    }),
    [user, error, busy, app, run],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthState = (): AuthState => useContext(AuthContext);
