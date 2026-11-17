import { authErrorCode } from "@scenespeak/core/auth/auth-state";

export interface LinkGoogleDeps<Credential> {
  /** True when a guest (anonymous) user is signed in. */
  isGuest: () => boolean;
  link: (credential: Credential) => Promise<unknown>;
  signIn: (credential: Credential) => Promise<unknown>;
}

/**
 * Same rule as the web client: a guest is upgraded in place (keeping their uid); if that Google
 * account already has a user, switch to it and leave the guest behind.
 */
export const linkOrSignIn = async <Credential>(credential: Credential, deps: LinkGoogleDeps<Credential>): Promise<void> => {
  if (!deps.isGuest()) {
    await deps.signIn(credential);
    return;
  }
  try {
    await deps.link(credential);
  } catch (error) {
    if (authErrorCode(error) !== "auth/credential-already-in-use") throw error;
    await deps.signIn(credential);
  }
};
