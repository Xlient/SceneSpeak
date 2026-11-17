import { getFirebaseApp } from "../ai/firebase";
import { type BoardStore, unavailableBoard } from "./board";
import { createFirestoreBoard } from "./firestore-board";

/** Firestore board, or a "not connected" stub when the Firebase config is missing. */
export const createDefaultBoard = (): BoardStore => {
  try {
    getFirebaseApp();
  } catch {
    return unavailableBoard;
  }
  return createFirestoreBoard(getFirebaseApp);
};
