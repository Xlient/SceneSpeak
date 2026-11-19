import { readFileSync } from "node:fs";
import { type RulesTestEnvironment, assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getBytes, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// Runs against the Firestore and Storage emulators: `pnpm test:rules`.
let env: RulesTestEnvironment;

const KEY = "a".repeat(64);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
const image = (overrides: Record<string, unknown> = {}) => ({ path: `backdrops/${KEY}.jpg`, contentType: "image/jpeg", createdAt: serverTimestamp(), ...overrides });

const user = (uid = "u1") => env.authenticatedContext(uid);
const signedOut = () => env.unauthenticatedContext();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-scenespeak",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
});
afterAll(() => env.cleanup());

describe("backdrop index (Firestore)", () => {
  it("lets any signed-in user, guests included, add and read an entry", async () => {
    await assertSucceeds(setDoc(doc(user().firestore(), `backdrops/${KEY}`), image()));
    await assertSucceeds(getDoc(doc(user("someone-else").firestore(), `backdrops/${KEY}`)));
  });

  it("blocks signed-out users", async () => {
    await assertFails(setDoc(doc(signedOut().firestore(), `backdrops/${KEY}`), image()));
    await assertFails(getDoc(doc(signedOut().firestore(), `backdrops/${KEY}`)));
  });

  it("is write-once: no overwrite, update or delete", async () => {
    const db = user().firestore();
    await assertSucceeds(setDoc(doc(db, `backdrops/${KEY}`), image()));
    await assertFails(setDoc(doc(db, `backdrops/${KEY}`), image({ contentType: "image/png" })));
    await assertFails(updateDoc(doc(db, `backdrops/${KEY}`), { contentType: "image/png" }));
    await assertFails(deleteDoc(doc(db, `backdrops/${KEY}`)));
  });

  it("rejects bad keys, paths, types, extra fields and client timestamps", async () => {
    const db = user().firestore();
    await assertFails(setDoc(doc(db, "backdrops/not-a-hash"), image()));
    await assertFails(setDoc(doc(db, `backdrops/${KEY}`), image({ path: `backdrops/${"b".repeat(64)}.jpg` })));
    await assertFails(setDoc(doc(db, `backdrops/${KEY}`), image({ contentType: "text/html" })));
    await assertFails(setDoc(doc(db, `backdrops/${KEY}`), image({ setting: "the user's request" })));
    await assertFails(setDoc(doc(db, `backdrops/${KEY}`), image({ createdAt: new Date(2020, 0, 1) })));
  });
});

describe("backdrop files (Storage)", () => {
  // Each test uses its own file: emulator Storage isn't reliably cleared between tests.
  let n = 0;
  let name = "";
  beforeEach(() => {
    n += 1;
    name = `${String(n).padStart(64, "0")}.jpg`;
  });
  const file = (ctx = user(), fileName = name) => ref(ctx.storage(), `backdrops/${fileName}`);

  it("lets a signed-in user upload an image once and anyone signed in read it", async () => {
    await assertSucceeds(uploadBytes(file(), PNG, { contentType: "image/jpeg" }));
    await assertSucceeds(getBytes(file(user("other"))));
  });

  it("blocks signed-out users", async () => {
    await assertFails(uploadBytes(file(signedOut()), PNG, { contentType: "image/jpeg" }));
  });

  it("can't be deleted", async () => {
    await assertSucceeds(uploadBytes(file(), PNG, { contentType: "image/jpeg" }));
    await assertFails(deleteObject(file()));
  });

  it("can't be overwritten", async () => {
    await assertSucceeds(uploadBytes(file(), PNG, { contentType: "image/jpeg" }));
    await assertFails(uploadBytes(file(), PNG, { contentType: "image/jpeg" }));
  });

  it("rejects non-images, oversized files and names that aren't a hash", async () => {
    await assertFails(uploadBytes(file(), PNG, { contentType: "text/html" }));
    await assertFails(uploadBytes(file(), new Uint8Array(2 * 1024 * 1024 + 1), { contentType: "image/jpeg" }));
    await assertFails(uploadBytes(file(user(), "my-photo.jpg"), PNG, { contentType: "image/jpeg" }));
  });

  it("keeps the rest of the bucket closed", async () => {
    await assertFails(uploadBytes(ref(user().storage(), "recordings/u1.webm"), PNG, { contentType: "audio/webm" }));
  });
});
