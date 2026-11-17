import { z } from "zod";
import type { AuthUser } from "./auth-client";

const FirebaseUserShape = z.object({
  uid: z.string().min(1),
  isAnonymous: z.boolean(),
  displayName: z.string().nullish(),
  photoURL: z.string().nullish(),
});

const safePhoto = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    return new URL(value).protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
};

export const toAuthUser = (raw: unknown): AuthUser | null => {
  const parsed = FirebaseUserShape.safeParse(raw);
  if (!parsed.success) return null;
  const { uid, isAnonymous, displayName, photoURL } = parsed.data;
  const name = displayName?.trim();
  const photo = safePhoto(photoURL);
  return { uid, isAnonymous, ...(name ? { displayName: name } : {}), ...(photo ? { photoURL: photo } : {}) };
};

const ErrorWithCode = z.object({ code: z.string() });

export const authErrorCode = (error: unknown): string | undefined => {
  const parsed = ErrorWithCode.safeParse(error);
  return parsed.success ? parsed.data.code : undefined;
};

/** Friendly text for an auth failure, or undefined when the user just cancelled. */
export const authErrorMessage = (error: unknown): string | undefined => {
  switch (authErrorCode(error)) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return undefined;
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.";
    case "auth/network-request-failed":
      return "Couldn't reach the sign-in service. Check your connection.";
    case "auth/operation-not-allowed":
    case "auth/admin-restricted-operation":
      return "This sign-in method isn't enabled for SceneSpeak yet.";
    case "auth/unauthorized-domain":
      return "Sign-in isn't allowed from this address.";
    default:
      return "Sign-in didn't work. Please try again.";
  }
};

/** True when the provider is switched off in the console (not worth showing to the user for guests). */
export const isProviderDisabled = (error: unknown): boolean => {
  const code = authErrorCode(error);
  return code === "auth/operation-not-allowed" || code === "auth/admin-restricted-operation";
};

export type AuthStatus =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "guest"; user: AuthUser }
  | { kind: "member"; user: AuthUser };

export const authStatusOf = (user: AuthUser | null | undefined): AuthStatus => {
  if (user === undefined) return { kind: "loading" };
  if (user === null) return { kind: "signed-out" };
  return user.isAnonymous ? { kind: "guest", user } : { kind: "member", user };
};

export interface AccountView {
  label: string;
  action?: { kind: "google" | "sign-out"; text: string };
}

export const describeAccount = (status: AuthStatus): AccountView => {
  switch (status.kind) {
    case "loading":
      return { label: "Signing in…" };
    case "signed-out":
      return { label: "Not signed in", action: { kind: "google", text: "Sign in with Google" } };
    case "guest":
      return { label: "Guest", action: { kind: "google", text: "Sign in with Google" } };
    case "member":
      return { label: status.user.displayName ?? "Signed in", action: { kind: "sign-out", text: "Sign out" } };
  }
};
