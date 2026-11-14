import { type FirebaseApp, FirebaseError } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { AuthClient } from "./auth-client";
import { authErrorCode, toAuthUser } from "./auth-state";

// Loaded on demand so firebase/auth stays out of the first paint bundle.
const loadAuthSdk = () => import("firebase/auth");

export const createFirebaseAuthClient = (getApp: () => FirebaseApp): AuthClient => {
  let auth: Promise<Auth> | undefined;
  const getAuthInstance = () => (auth ??= loadAuthSdk().then((sdk) => sdk.getAuth(getApp())));

  return {
    subscribe: (listener) => {
      let unsubscribe: (() => void) | undefined;
      let cancelled = false;
      void Promise.all([loadAuthSdk(), getAuthInstance()]).then(([sdk, instance]) => {
        if (cancelled) return;
        unsubscribe = sdk.onAuthStateChanged(instance, (user) => listener(toAuthUser(user)));
      }, () => {
        if (!cancelled) listener(null);
      });
      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    },

    signInAsGuest: async () => {
      const [sdk, instance] = await Promise.all([loadAuthSdk(), getAuthInstance()]);
      await sdk.signInAnonymously(instance);
    },

    signInWithGoogle: async () => {
      const [sdk, instance] = await Promise.all([loadAuthSdk(), getAuthInstance()]);
      const provider = new sdk.GoogleAuthProvider();
      const current = instance.currentUser;
      if (!current?.isAnonymous) {
        await sdk.signInWithPopup(instance, provider);
        return;
      }
      try {
        await sdk.linkWithPopup(current, provider);
      } catch (error) {
        // That Google account already has a user: switch to it (the guest's uid is left behind).
        if (!(error instanceof FirebaseError) || authErrorCode(error) !== "auth/credential-already-in-use") throw error;
        const credential = sdk.GoogleAuthProvider.credentialFromError(error);
        if (!credential) throw error;
        await sdk.signInWithCredential(instance, credential);
      }
    },

    signOut: async () => {
      const [sdk, instance] = await Promise.all([loadAuthSdk(), getAuthInstance()]);
      await sdk.signOut(instance);
    },
  };
};
