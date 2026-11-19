import { ImageConfigAspectRatio, ImageConfigImageSize, InferenceMode, ResponseModality, ThinkingLevel } from "firebase/ai";
import { type ImagePort, createModelBackdropPainter } from "../ai/backdrop-painter";
import { firebaseFactory } from "../ai/model";
import type { BackdropPainter } from "../audio/media-sources";

/** Nano Banana 2.1 at its fastest setting: the closest match to the old fast Imagen model. */
export const BACKDROP_MODEL = "gemini-nano-banana-2.1";

export class BackdropOfflineError extends Error {
  override readonly name = "BackdropOfflineError";

  constructor() {
    super("Painting a backdrop needs an internet connection.");
  }
}

export const createBackdropImagePort = (): ImagePort =>
  firebaseFactory({
    // Image output only exists in the cloud model (routing's capability rule for "paint").
    mode: InferenceMode.ONLY_IN_CLOUD,
    inCloudParams: {
      model: BACKDROP_MODEL,
      generationConfig: {
        responseModalities: [ResponseModality.IMAGE],
        imageConfig: { aspectRatio: ImageConfigAspectRatio.LANDSCAPE_16x9, imageSize: ImageConfigImageSize.SIZE_1K },
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    },
  });

export interface LiveBackdropDeps {
  isOnline?: () => boolean;
  makePort?: () => ImagePort;
}

/** Builds the image model on first use, so a missing Firebase config only fails painting. */
export const createLiveBackdropPainter = ({ isOnline = () => navigator.onLine, makePort = createBackdropImagePort }: LiveBackdropDeps = {}): BackdropPainter => {
  let painter: BackdropPainter | undefined;
  return (request) => {
    if (!isOnline()) return Promise.reject(new BackdropOfflineError());
    try {
      painter ??= createModelBackdropPainter(makePort());
    } catch (error) {
      return Promise.reject(error);
    }
    return painter(request);
  };
};
