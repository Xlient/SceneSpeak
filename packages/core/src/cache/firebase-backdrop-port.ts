import type { FirebaseApp } from "firebase/app";
import type { BackdropCloudPort } from "./shared-backdrop-store";

// Loaded on first use so Firestore and Storage stay out of the first page load.
const loadFirestore = () => import("firebase/firestore/lite");
const loadStorage = () => import("firebase/storage");

/** The real Firebase side of the shared backdrop cache. */
export const createFirebaseBackdropPort = (getApp: () => FirebaseApp, bucket: string): BackdropCloudPort => {
  const entryDoc = async (key: string) => {
    const sdk = await loadFirestore();
    return { sdk, ref: sdk.doc(sdk.getFirestore(getApp()), "backdrops", key) };
  };

  // Backdrops have their own bucket; the default bucket's rules deny everything.
  const fileRef = async (path: string) => {
    const sdk = await loadStorage();
    return { sdk, ref: sdk.ref(sdk.getStorage(getApp(), `gs://${bucket}`), path) };
  };

  return {
    readEntry: async (key) => {
      const { sdk, ref } = await entryDoc(key);
      const snapshot = await sdk.getDoc(ref);
      return snapshot.exists() ? snapshot.data() : undefined;
    },

    createEntry: async (key, entry) => {
      const { sdk, ref } = await entryDoc(key);
      // Rules allow create only, so a second writer for the same key is refused (write-once).
      await sdk.setDoc(ref, { ...entry, createdAt: sdk.serverTimestamp() });
    },

    download: async (path) => {
      const { sdk, ref } = await fileRef(path);
      return sdk.getBlob(ref);
    },

    upload: async (path, blob, contentType) => {
      const { sdk, ref } = await fileRef(path);
      await sdk.uploadBytes(ref, blob, { contentType });
    },
  };
};
