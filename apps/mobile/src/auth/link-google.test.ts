import { FirebaseError } from "firebase/app";
import { describe, expect, it, vi } from "vitest";
import { linkOrSignIn } from "./link-google";

const deps = (guest: boolean, linkError?: unknown) => ({
  isGuest: () => guest,
  link: vi.fn(() => (linkError ? Promise.reject(linkError) : Promise.resolve())),
  signIn: vi.fn(() => Promise.resolve()),
});

describe("linkOrSignIn", () => {
  it("upgrades a guest in place", async () => {
    const d = deps(true);
    await linkOrSignIn("cred", d);
    expect(d.link).toHaveBeenCalledWith("cred");
    expect(d.signIn).not.toHaveBeenCalled();
  });

  it("switches to the existing account when the Google account is taken", async () => {
    const d = deps(true, new FirebaseError("auth/credential-already-in-use", "taken"));
    await linkOrSignIn("cred", d);
    expect(d.signIn).toHaveBeenCalledWith("cred");
  });

  it("rethrows other link errors", async () => {
    const d = deps(true, new FirebaseError("auth/network-request-failed", "offline"));
    await expect(linkOrSignIn("cred", d)).rejects.toThrow("offline");
    expect(d.signIn).not.toHaveBeenCalled();
  });

  it("signs in directly when nobody is a guest", async () => {
    const d = deps(false);
    await linkOrSignIn("cred", d);
    expect(d.link).not.toHaveBeenCalled();
    expect(d.signIn).toHaveBeenCalled();
  });
});
