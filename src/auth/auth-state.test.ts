import { describe, expect, it } from "vitest";
import { authErrorMessage, authStatusOf, describeAccount, isProviderDisabled, toAuthUser } from "./auth-state";

describe("toAuthUser", () => {
  it("keeps only the fields the app uses", () => {
    expect(toAuthUser({ uid: "u1", isAnonymous: false, displayName: " Ana ", email: "x@y.z" })).toEqual({
      uid: "u1",
      isAnonymous: false,
      displayName: "Ana",
    });
  });

  it("drops a blank or null display name", () => {
    expect(toAuthUser({ uid: "u1", isAnonymous: true, displayName: null })).toEqual({ uid: "u1", isAnonymous: true });
    expect(toAuthUser({ uid: "u1", isAnonymous: true, displayName: "  " })).toEqual({ uid: "u1", isAnonymous: true });
  });

  it("rejects malformed users", () => {
    expect(toAuthUser(null)).toBeNull();
    expect(toAuthUser({ uid: "", isAnonymous: true })).toBeNull();
  });
});

describe("authErrorMessage", () => {
  it("stays quiet when the user closes the popup", () => {
    expect(authErrorMessage({ code: "auth/popup-closed-by-user" })).toBeUndefined();
  });

  it("explains a blocked popup and a disabled provider", () => {
    expect(authErrorMessage({ code: "auth/popup-blocked" })).toMatch(/pop-ups/);
    expect(authErrorMessage({ code: "auth/operation-not-allowed" })).toMatch(/isn't enabled/);
  });

  it("falls back to a generic message", () => {
    expect(authErrorMessage(new Error("boom"))).toBe("Sign-in didn't work. Please try again.");
  });
});

describe("isProviderDisabled", () => {
  it("spots a provider switched off in the console", () => {
    expect(isProviderDisabled({ code: "auth/admin-restricted-operation" })).toBe(true);
    expect(isProviderDisabled({ code: "auth/operation-not-allowed" })).toBe(true);
    expect(isProviderDisabled({ code: "auth/network-request-failed" })).toBe(false);
  });
});

describe("describeAccount", () => {
  it("offers Google to a guest", () => {
    expect(describeAccount(authStatusOf({ uid: "g", isAnonymous: true }))).toEqual({
      label: "Guest",
      action: { kind: "google", text: "Sign in with Google" },
    });
  });

  it("greets a member by name and offers sign out", () => {
    expect(describeAccount(authStatusOf({ uid: "m", isAnonymous: false, displayName: "Ana" }))).toEqual({
      label: "Ana",
      action: { kind: "sign-out", text: "Sign out" },
    });
  });

  it("shows loading before the first callback and Google when signed out", () => {
    expect(describeAccount(authStatusOf(undefined))).toEqual({ label: "Signing in…" });
    expect(describeAccount(authStatusOf(null)).action?.kind).toBe("google");
  });
});
