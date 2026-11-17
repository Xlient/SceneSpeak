import type { FirebaseApp } from "firebase/app";
import { createFirebaseAuthClient } from "@scenespeak/core/auth/firebase-auth-client";

// Expo web: the browser popup flow from core, same as the web app.
export const googleSignInAvailable = true;

export const signInWithGoogle = (app: FirebaseApp): Promise<void> => createFirebaseAuthClient(() => app).signInWithGoogle();

export const signOut = (app: FirebaseApp): Promise<void> => createFirebaseAuthClient(() => app).signOut();
