import type { FirebaseApp } from "firebase/app";
import { HIDE_AFTER_REPORTS, LIBRARY_LOAD_LIMIT, type LibraryStore } from "./library";

const loadSdk = () => import("firebase/firestore/lite");

// Field names must match firestore.rules exactly.
export const createFirestoreLibrary = (getApp: () => FirebaseApp): LibraryStore => {
  const refs = async () => {
    const sdk = await loadSdk();
    const db = sdk.getFirestore(getApp());
    const library = sdk.collection(db, "library");
    const entry = (id: string) => sdk.doc(library, id);
    return {
      sdk,
      db,
      library,
      entry,
      content: (id: string) => sdk.doc(entry(id), "content", "lesson"),
      vote: (id: string, uid: string) => sdk.doc(entry(id), "votes", uid),
      report: (id: string, uid: string) => sdk.doc(entry(id), "reports", uid),
    };
  };

  return {
    list: async () => {
      const { sdk, library } = await refs();
      // Equality-only, so no composite index; ranking happens on the client.
      const snapshot = await sdk.getDocs(sdk.query(library, sdk.where("hidden", "==", false), sdk.limit(LIBRARY_LOAD_LIMIT)));
      return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    },
    lesson: async (id) => {
      const { sdk, content } = await refs();
      const snapshot = await sdk.getDoc(content(id));
      return snapshot.data()?.lesson;
    },
    publish: async ({ lesson, ...meta }) => {
      const { sdk, db, library, content } = await refs();
      const entry = sdk.doc(library);
      const batch = sdk.writeBatch(db);
      batch.set(entry, { ...meta, votes: 0, reports: 0, hidden: false, createdAt: sdk.serverTimestamp() });
      batch.set(content(entry.id), { lesson });
      await batch.commit();
      return entry.id;
    },
    myVotes: async (ids, uid) => {
      const { sdk, vote } = await refs();
      const found = await Promise.all(ids.map(async (id) => ((await sdk.getDoc(vote(id, uid))).exists() ? id : null)));
      return new Set(found.filter((id): id is string => id !== null));
    },
    setVote: async (id, uid, on) => {
      const { sdk, db, entry, vote } = await refs();
      const batch = sdk.writeBatch(db);
      if (on) batch.set(vote(id, uid), { at: sdk.serverTimestamp() });
      else batch.delete(vote(id, uid));
      batch.update(entry(id), { votes: sdk.increment(on ? 1 : -1) });
      await batch.commit();
    },
    report: async (id, uid) => {
      const { sdk, db, entry, report } = await refs();
      await sdk.runTransaction(db, async (tx) => {
        const current = await tx.get(entry(id));
        const reports = Number(current.data()?.reports ?? 0) + 1;
        tx.set(report(id, uid), { at: sdk.serverTimestamp() });
        tx.update(entry(id), { reports, hidden: reports >= HIDE_AFTER_REPORTS });
      });
    },
  };
};
