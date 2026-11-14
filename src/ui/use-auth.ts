import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthClient, AuthUser } from "../auth/auth-client";
import { authErrorMessage, authStatusOf, isProviderDisabled } from "../auth/auth-state";

export const useAuth = (client: AuthClient) => {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const guestTried = useRef(false);

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  }, []);

  // Start everyone as an anonymous guest when that provider is on; otherwise just offer Google.
  useEffect(
    () =>
      client.subscribe((next) => {
        setUser(next);
        if (next !== null || guestTried.current) return;
        guestTried.current = true;
        client.signInAsGuest().catch((failure: unknown) => {
          if (!isProviderDisabled(failure)) setError(authErrorMessage(failure));
        });
      }),
    [client],
  );

  return {
    status: authStatusOf(user),
    busy,
    error,
    signInWithGoogle: () => void run(client.signInWithGoogle),
    signOut: () => void run(client.signOut),
  };
};
