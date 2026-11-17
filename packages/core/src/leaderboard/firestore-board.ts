import type { FirebaseApp } from "firebase/app";
import { BOARD_SIZE, type BoardStore } from "./board";

// The lite SDK is plain REST (no realtime listeners), loaded only when the Leaderboard opens.
const loadSdk = () => import("firebase/firestore/lite");

export const createFirestoreBoard = (getApp: () => FirebaseApp): BoardStore => {
  const boardOf = async (weekId: string) => {
    const sdk = await loadSdk();
    return { sdk, board: sdk.collection(sdk.getFirestore(getApp()), "weeks", weekId, "board") };
  };

  return {
    load: async (weekId) => {
      const { sdk, board } = await boardOf(weekId);
      const snapshot = await sdk.getDocs(sdk.query(board, sdk.orderBy("daysPractised", "desc"), sdk.limit(BOARD_SIZE)));
      return snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id }));
    },
    publish: async (weekId, { uid, displayName, daysPractised }) => {
      const { sdk, board } = await boardOf(weekId);
      // Field names and updatedAt must match firestore.rules exactly.
      await sdk.setDoc(sdk.doc(board, uid), { displayName, daysPractised, updatedAt: sdk.serverTimestamp() });
    },
    remove: async (weekId, uid) => {
      const { sdk, board } = await boardOf(weekId);
      await sdk.deleteDoc(sdk.doc(board, uid));
    },
  };
};
