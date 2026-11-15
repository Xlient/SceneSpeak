import { readFileSync } from "node:fs";
import { type RulesTestEnvironment, assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// Runs against the Firestore emulator: `pnpm test:rules`.
let env: RulesTestEnvironment;

const WEEK = "2026-W46";
const row = (uid: string, week = WEEK) => `weeks/${week}/board/${uid}`;
const entry = (overrides: Record<string, unknown> = {}) => ({ displayName: "Ana", daysPractised: 3, updatedAt: serverTimestamp(), ...overrides });

const google = (uid: string) => env.authenticatedContext(uid, { firebase: { sign_in_provider: "google.com" } }).firestore();
const guest = (uid: string) => env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).firestore();
const signedOut = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-scenespeak",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
beforeEach(() => env.clearFirestore());
afterAll(() => env.cleanup());

describe("weekly board: reading", () => {
  it("lets Google users and guests read", async () => {
    await assertSucceeds(getDoc(doc(google("ana"), row("ana"))));
    await assertSucceeds(getDoc(doc(guest("g1"), row("ana"))));
  });

  it("blocks signed-out readers", async () => {
    await assertFails(getDoc(doc(signedOut(), row("ana"))));
  });
});

describe("weekly board: writing", () => {
  it("lets a Google user write and delete their own row", async () => {
    await assertSucceeds(setDoc(doc(google("ana"), row("ana")), entry()));
    await assertSucceeds(setDoc(doc(google("ana"), row("ana")), entry({ daysPractised: 4 })));
    await assertSucceeds(deleteDoc(doc(google("ana"), row("ana"))));
  });

  it("blocks guests and signed-out users from writing", async () => {
    await assertFails(setDoc(doc(guest("g1"), row("g1")), entry()));
    await assertFails(setDoc(doc(signedOut(), row("ana")), entry()));
  });

  it("blocks writing or deleting someone else's row", async () => {
    await assertSucceeds(setDoc(doc(google("ana"), row("ana")), entry()));
    await assertFails(setDoc(doc(google("bo"), row("ana")), entry({ displayName: "Bo" })));
    await assertFails(deleteDoc(doc(google("bo"), row("ana"))));
  });

  it("rejects impossible or malformed scores", async () => {
    const db = google("ana");
    await assertFails(setDoc(doc(db, row("ana")), entry({ daysPractised: 8 })));
    await assertFails(setDoc(doc(db, row("ana")), entry({ daysPractised: -1 })));
    await assertFails(setDoc(doc(db, row("ana")), entry({ daysPractised: 2.5 })));
    await assertFails(setDoc(doc(db, row("ana")), entry({ daysPractised: "7" })));
  });

  it("rejects bad names, extra fields and a client-set timestamp", async () => {
    const db = google("ana");
    await assertFails(setDoc(doc(db, row("ana")), entry({ displayName: "" })));
    await assertFails(setDoc(doc(db, row("ana")), entry({ displayName: "x".repeat(41) })));
    await assertFails(setDoc(doc(db, row("ana")), entry({ email: "ana@example.com" })));
    await assertFails(setDoc(doc(db, row("ana")), entry({ updatedAt: new Date(2020, 0, 1) })));
  });

  it("rejects a malformed week id", async () => {
    await assertFails(setDoc(doc(google("ana"), row("ana", "forever")), entry()));
  });
});

describe("everything else", () => {
  it("is closed, even to Google users", async () => {
    const db = google("ana");
    await assertFails(getDoc(doc(db, "users/ana")));
    await assertFails(setDoc(doc(db, "users/ana"), { anything: true }));
    await assertFails(setDoc(doc(db, `weeks/${WEEK}`), { anything: true }));
  });
});
