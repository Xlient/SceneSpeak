import { getFirebaseApp } from "../ai/firebase";
import { createFirestoreLibrary } from "./firestore-library";
import { type LibraryStore, unavailableLibrary } from "./library";

/** Firestore library, or a "not connected" stub when the Firebase config is missing. */
export const createDefaultLibrary = (): LibraryStore => {
  try {
    getFirebaseApp();
  } catch {
    return unavailableLibrary;
  }
  return createFirestoreLibrary(getFirebaseApp);
};
