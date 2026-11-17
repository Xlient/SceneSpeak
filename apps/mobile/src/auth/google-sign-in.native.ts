import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import type { FirebaseApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, linkWithCredential, signInWithCredential, signOut as firebaseSignOut } from "firebase/auth";
import { linkOrSignIn } from "./link-google";

// The Firebase project's auto-created "Web client" ID: Google issues the ID token Firebase verifies for it.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const googleSignInAvailable = Boolean(WEB_CLIENT_ID);

let configured = false;
const configure = () => {
  if (configured || !WEB_CLIENT_ID) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
};

/** Native Google sign-in → Firebase credential. Resolves without signing in if the user cancels. */
export const signInWithGoogle = async (app: FirebaseApp): Promise<void> => {
  configure();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response) || !response.data.idToken) return;
  const credential = GoogleAuthProvider.credential(response.data.idToken);
  const auth = getAuth(app);
  await linkOrSignIn(credential, {
    isGuest: () => auth.currentUser?.isAnonymous === true,
    link: (c) => {
      const user = auth.currentUser;
      return user ? linkWithCredential(user, c) : signInWithCredential(auth, c);
    },
    signIn: (c) => signInWithCredential(auth, c),
  });
};

export const signOut = async (app: FirebaseApp): Promise<void> => {
  await GoogleSignin.signOut().catch(() => undefined);
  await firebaseSignOut(getAuth(app));
};
