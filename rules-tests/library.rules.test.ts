import { readFileSync } from "node:fs";
import { type RulesTestEnvironment, assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import {
  type Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// Runs against the Firestore emulator: `pnpm test:rules`.
let env: RulesTestEnvironment;

const meta = (uid: string, overrides: Record<string, unknown> = {}) => ({
  title: "Hotel check-in",
  topic: "checking in at a hotel",
  language: "es",
  level: "A1",
  intents: ["greet"],
  authorUid: uid,
  authorName: "Ana",
  votes: 0,
  reports: 0,
  hidden: false,
  createdAt: serverTimestamp(),
  ...overrides,
});

// The test context returns the compat Firestore type; it works with the modular functions at runtime.
const asModular = (db: unknown) => db as Firestore;
const google = (uid: string) => asModular(env.authenticatedContext(uid, { firebase: { sign_in_provider: "google.com" } }).firestore());
const guest = (uid: string) => asModular(env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).firestore());

const publish = (db: Firestore, id: string, uid: string, overrides: Record<string, unknown> = {}, lesson = "{}") => {
  const batch = writeBatch(db);
  batch.set(doc(db, "library", id), meta(uid, overrides));
  batch.set(doc(db, "library", id, "content", "lesson"), { lesson });
  return batch.commit();
};

const vote = (db: Firestore, id: string, uid: string, on: boolean) => {
  const batch = writeBatch(db);
  if (on) batch.set(doc(db, "library", id, "votes", uid), { at: serverTimestamp() });
  else batch.delete(doc(db, "library", id, "votes", uid));
  batch.update(doc(db, "library", id), { votes: increment(on ? 1 : -1) });
  return batch.commit();
};

const report = (db: Firestore, id: string, uid: string, reports: number) => {
  const batch = writeBatch(db);
  batch.set(doc(db, "library", id, "reports", uid), { at: serverTimestamp() });
  batch.update(doc(db, "library", id), { reports, hidden: reports >= 3 });
  return batch.commit();
};

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-scenespeak",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
beforeEach(() => env.clearFirestore());
afterAll(() => env.cleanup());

describe("library: publishing", () => {
  it("lets a Google user publish a lesson with its content", async () => {
    await assertSucceeds(publish(google("ana"), "l1", "ana"));
  });

  it("blocks guests, impersonation and entries without content", async () => {
    await assertFails(publish(guest("g1"), "l1", "g1"));
    await assertFails(publish(google("bo"), "l1", "ana"));
    await assertFails(setDoc(doc(google("ana"), "library", "l1"), meta("ana")));
  });

  it("rejects preset votes, hidden flags, extra fields and oversized lessons", async () => {
    const db = google("ana");
    await assertFails(publish(db, "l1", "ana", { votes: 50 }));
    await assertFails(publish(db, "l2", "ana", { hidden: true }));
    await assertFails(publish(db, "l3", "ana", { email: "ana@example.com" }));
    await assertFails(publish(db, "l4", "ana", { level: "Z9" }));
    await assertFails(publish(db, "l5", "ana", {}, "x".repeat(60_001)));
  });

  it("doesn't let anyone else edit the lesson text", async () => {
    await publish(google("ana"), "l1", "ana");
    await assertFails(updateDoc(doc(google("bo"), "library", "l1"), { title: "Rude title" }));
    await assertFails(setDoc(doc(google("bo"), "library", "l1", "content", "lesson"), { lesson: "{}" }));
  });
});

describe("library: reading", () => {
  it("lets guests list and open visible lessons", async () => {
    await publish(google("ana"), "l1", "ana");
    await assertSucceeds(getDocs(query(collection(guest("g1"), "library"), where("hidden", "==", false))));
    await assertSucceeds(getDoc(doc(guest("g1"), "library", "l1", "content", "lesson")));
  });

  it("blocks listing without the hidden filter", async () => {
    await assertFails(getDocs(collection(guest("g1"), "library")));
  });
});

describe("library: votes", () => {
  beforeEach(() => publish(google("ana"), "l1", "ana"));

  it("lets a Google user upvote once and take it back", async () => {
    const db = google("bo");
    await assertSucceeds(vote(db, "l1", "bo", true));
    await assertFails(vote(db, "l1", "bo", true));
    await assertSucceeds(vote(db, "l1", "bo", false));
  });

  it("blocks guests, jumps and votes without a marker", async () => {
    await assertFails(vote(guest("g1"), "l1", "g1", true));
    await assertFails(updateDoc(doc(google("bo"), "library", "l1"), { votes: increment(1) }));
    const bo = google("bo");
    const batch = writeBatch(bo);
    batch.set(doc(bo, "library", "l1", "votes", "bo"), { at: serverTimestamp() });
    batch.update(doc(bo, "library", "l1"), { votes: increment(5) });
    await assertFails(batch.commit());
  });

  it("only lets people see their own vote marker", async () => {
    await vote(google("bo"), "l1", "bo", true);
    await assertSucceeds(getDoc(doc(google("bo"), "library", "l1", "votes", "bo")));
    await assertFails(getDoc(doc(google("cy"), "library", "l1", "votes", "bo")));
  });
});

describe("library: reports", () => {
  beforeEach(() => publish(google("ana"), "l1", "ana"));

  it("hides a lesson after three reports, once per person", async () => {
    await assertSucceeds(report(google("u1"), "l1", "u1", 1));
    await assertFails(report(google("u1"), "l1", "u1", 2));
    await assertSucceeds(report(google("u2"), "l1", "u2", 2));
    // The third report must hide it.
    const u3 = google("u3");
    const sneaky = writeBatch(u3);
    sneaky.set(doc(u3, "library", "l1", "reports", "u3"), { at: serverTimestamp() });
    sneaky.update(doc(u3, "library", "l1"), { reports: 3, hidden: false });
    await assertFails(sneaky.commit());
    await assertSucceeds(report(google("u3"), "l1", "u3", 3));
    await assertFails(getDoc(doc(guest("g1"), "library", "l1")));
    await assertSucceeds(getDoc(doc(google("ana"), "library", "l1")));
  });

  it("blocks guests from reporting", async () => {
    await assertFails(report(guest("g1"), "l1", "g1", 1));
  });
});

describe("library: deleting", () => {
  it("lets only the author delete", async () => {
    await publish(google("ana"), "l1", "ana");
    await assertFails(deleteDoc(doc(google("bo"), "library", "l1")));
    await assertSucceeds(deleteDoc(doc(google("ana"), "library", "l1")));
  });
});
