import { getFirebaseApp } from "../ai/firebase";
import type { AuthClient } from "./auth-client";
import { createFirebaseAuthClient } from "./firebase-auth-client";

/** Firebase Auth, or null when the Firebase config is missing (accounts are then hidden). */
export const createDefaultAuth = (): AuthClient | null => {
  try {
    getFirebaseApp();
  } catch {
    return null;
  }
  return createFirebaseAuthClient(getFirebaseApp);
};
