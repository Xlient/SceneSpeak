import type { BackdropTheme } from "../audio/media-sources";

/** Bump when the backdrop prompt or model changes, so the shared cache starts fresh. */
export const SHARED_BACKDROP_VERSION = 2;

const normalize = (text: string): string => text.toLowerCase().replace(/\s+/g, " ").trim();

const toHex = (digest: ArrayBuffer): string =>
  Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

/** Same scene → same key for every user: SHA-256 as 64 hex chars, matching the security rules. */
export const sharedBackdropKey = async ({
  setting,
  theme,
  model,
}: {
  setting: string;
  theme: BackdropTheme;
  model: string;
}): Promise<string> => {
  const text = `v${SHARED_BACKDROP_VERSION}|${model}|${theme.room}|${normalize(setting)}`;
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
};
