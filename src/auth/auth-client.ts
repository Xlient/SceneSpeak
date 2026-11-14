export interface AuthUser {
  uid: string;
  isAnonymous: boolean;
  displayName?: string;
}

/** What the UI needs from auth; the Firebase version lives in `firebase-auth-client.ts`. */
export interface AuthClient {
  /** Calls back with the current user (or null) now and on every change. */
  subscribe: (listener: (user: AuthUser | null) => void) => () => void;
  signInAsGuest: () => Promise<void>;
  /** Upgrades a guest to Google, keeping the same uid when possible. */
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export class AuthUnavailableError extends Error {
  override readonly name = "AuthUnavailableError";
}

export const unavailableAuth = (reason: string): AuthClient => {
  const fail = () => Promise.reject(new AuthUnavailableError(reason));
  return {
    subscribe: (listener) => {
      listener(null);
      return () => {};
    },
    signInAsGuest: fail,
    signInWithGoogle: fail,
    signOut: fail,
  };
};
