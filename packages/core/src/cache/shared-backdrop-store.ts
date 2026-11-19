import { z } from "zod";
import type { BlobStore } from "./blob-cache";

/** Matches storage.rules: anything bigger is refused there, so don't try. */
export const MAX_SHARED_BYTES = 2 * 1024 * 1024;
export const SHARED_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

/** What `backdrops/{key}` holds in Firestore (createdAt is set by the server). */
export const BackdropEntry = z.object({
  path: z.string(),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});
export type BackdropEntry = z.infer<typeof BackdropEntry>;

/** The four Firebase calls the store needs. Tests pass fakes; `firebase-backdrop-port.ts` is the real one. */
export interface BackdropCloudPort {
  /** Firestore `backdrops/{key}` data, or undefined if there's no doc. Unvalidated. */
  readEntry: (key: string) => Promise<unknown>;
  /** Firestore create of `backdrops/{key}` with `{ ...entry, createdAt: serverTimestamp() }`. */
  createEntry: (key: string, entry: BackdropEntry) => Promise<void>;
  /** Cloud Storage download. */
  download: (path: string) => Promise<Blob>;
  /** Cloud Storage upload with that content type. */
  upload: (path: string, blob: Blob, contentType: string) => Promise<void>;
}

const pathFor = (key: string, ext: string): string => `backdrops/${key}.${ext}`;

type SharedType = keyof typeof SHARED_TYPES;
const isSharedType = (type: string): type is SharedType => Object.hasOwn(SHARED_TYPES, type);

/** Shared backdrop cache: the index lives in Firestore, the image in Cloud Storage. */
export const createSharedBackdropStore = (port: BackdropCloudPort): BlobStore => ({
  async get(key) {
    const raw = await port.readEntry(key);
    if (raw === undefined) return undefined;
    // Other users wrote this entry, so it's untrusted: it must point at this key's own file.
    const parsed = BackdropEntry.safeParse(raw);
    if (!parsed.success) return undefined;
    const { path, contentType } = parsed.data;
    if (path !== pathFor(key, SHARED_TYPES[contentType])) return undefined;
    const blob = await port.download(path);
    return new Blob([blob], { type: contentType });
  },

  async set(key, blob) {
    const contentType = blob.type;
    if (!isSharedType(contentType) || blob.size === 0 || blob.size > MAX_SHARED_BYTES) return;
    const path = pathFor(key, SHARED_TYPES[contentType]);
    // File first, then the index, so an entry never points at nothing.
    await port.upload(path, blob, contentType);
    await port.createEntry(key, { path, contentType });
  },
});
