import { describe, expect, it } from "vitest";
import { parseFirebaseEnv } from "./config";

const full = { apiKey: "k", authDomain: "d.firebaseapp.com", projectId: "p", appId: "1:2:web:3" };

describe("parseFirebaseEnv", () => {
  it("accepts the required values and drops empty optionals", () => {
    expect(parseFirebaseEnv({ ...full, storageBucket: "" })).toEqual(full);
  });

  it("returns null when a required value is missing", () => {
    expect(parseFirebaseEnv({ ...full, apiKey: undefined })).toBeNull();
    expect(parseFirebaseEnv({})).toBeNull();
  });
});
