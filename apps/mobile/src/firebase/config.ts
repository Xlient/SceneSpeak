import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((value) => value || undefined);

// Unset optionals are removed (not left as undefined) to fit FirebaseOptions.
const FirebaseEnv = z
  .object({
    apiKey: z.string().min(1),
    authDomain: z.string().min(1),
    projectId: z.string().min(1),
    storageBucket: optional,
    messagingSenderId: optional,
    appId: z.string().min(1),
  })
  .transform(({ storageBucket, messagingSenderId, ...required }) => ({
    ...required,
    ...(storageBucket ? { storageBucket } : {}),
    ...(messagingSenderId ? { messagingSenderId } : {}),
  }));
export type FirebaseEnv = z.output<typeof FirebaseEnv>;

/** Parses the EXPO_PUBLIC_FIREBASE_* values; null when they're missing (the app then runs offline). */
export const parseFirebaseEnv = (env: Readonly<Record<string, string | undefined>>): FirebaseEnv | null => {
  const parsed = FirebaseEnv.safeParse({
    apiKey: env.apiKey,
    authDomain: env.authDomain,
    projectId: env.projectId,
    storageBucket: env.storageBucket,
    messagingSenderId: env.messagingSenderId,
    appId: env.appId,
  });
  return parsed.success ? parsed.data : null;
};

// Expo only inlines EXPO_PUBLIC_* when each is read by its full literal name.
export const readFirebaseEnv = (): FirebaseEnv | null =>
  parseFirebaseEnv({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  });
