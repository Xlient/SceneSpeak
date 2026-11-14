import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthClient, AuthUser } from "../auth/auth-client";
import { authErrorMessage, authStatusOf, isProviderDisabled } from "../auth/auth-state";

export type AuthSession = ReturnType<typeof useAuth>;

/** `client: null` means accounts are off: the user stays signed out and no sign-in is offered. */
export const useAuth = (client: AuthClient | null) => {
  const [user, setUser] = useState<AuthUser | null | undefined>(client ? undefined : null);
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

  return {
    enabled: client !== null,
    status: authStatusOf(user),
    busy,
    error,
    signInWithGoogle: () => {
      if (client) void run(client.signInWithGoogle);
    },
    signOut: () => {
      if (client) void run(client.signOut);
    },
  };
};
