import { type DeviceModelStatus, hasPromptApi, initDeviceModel } from "../ai/device";
import type { BackdropPainter, SpeechSource } from "../audio/media-sources";
import { unavailableBackdrops, unavailableSpeech } from "../audio/media-sources";
import { type BlobStore, cachedBlobSource, createCacheStorageStore } from "../cache/blob-cache";
import { type LessonGenerator, unavailableGenerator } from "../lesson/generator";
import { type SentenceExplainer, unavailableExplainer } from "../lesson/sentence-breakdown";
import { type Grader, unavailableGrader } from "../lesson/grader";
import { type VoiceGrader, unavailableVoiceGrader } from "../lesson/voice-grader";
import { createLiveGrader } from "./live-grader";
import { type ModelMonitor, createModelMonitor, monitored } from "../monitor/model-monitor";

export interface DeviceSetup {
  isSupported: () => boolean;
  initialize: (onStatus: (status: DeviceModelStatus) => void, options?: { signal?: AbortSignal }) => Promise<DeviceModelStatus>;
}

/** Real setup even in stub mode: it reports "not-supported" or "unavailable" on its own when it can't run. */
export const browserDeviceSetup: DeviceSetup = {
  isSupported: () => hasPromptApi(),
  initialize: (onStatus, options) => initDeviceModel(onStatus, options),
};

/** Every AI-backed capability the UI uses. Real implementations replace the stubs in `createAppServices`. */
export interface AppServices {
  grader: Grader;
  voiceGrader: VoiceGrader;
  generator: LessonGenerator;
  speech: SpeechSource;
  backdrops: BackdropPainter;
  explainer: SentenceExplainer;
  deviceSetup: DeviceSetup;
  /** False while `speech` is the stub, so the UI can say the AI voice is coming. */
  speechConnected: boolean;
  monitor: ModelMonitor;
}

export interface RawServices {
  grader: Grader;
  voiceGrader: VoiceGrader;
  generator: LessonGenerator;
  speech: SpeechSource;
  backdrops: BackdropPainter;
  explainer: SentenceExplainer;
  deviceSetup: DeviceSetup;
}

export const STUB_SERVICES: RawServices = {
  grader: unavailableGrader,
  voiceGrader: unavailableVoiceGrader,
  generator: unavailableGenerator,
  speech: unavailableSpeech,
  backdrops: unavailableBackdrops,
  explainer: unavailableExplainer,
  deviceSetup: browserDeviceSetup,
};

/** Stubs plus every capability that's wired to real AI so far. */
export const createLiveServices = (): RawServices => ({
  ...STUB_SERVICES,
  grader: createLiveGrader(),
});

export interface ServiceStores {
  speech: BlobStore;
  backdrops: BlobStore;
}

const defaultStores = (): ServiceStores => ({
  speech: createCacheStorageStore("scenespeak-tts-v1"),
  backdrops: createCacheStorageStore("scenespeak-backdrops-v1"),
});

/** Adds monitoring to every call and generate-once caching to cloud media (TTS clips, backdrops). */
export const createAppServices = (raw: RawServices = STUB_SERVICES, stores: ServiceStores = defaultStores()): AppServices => {
  const monitor = createModelMonitor();
  return {
    monitor,
    deviceSetup: raw.deviceSetup,
    speechConnected: raw.speech !== unavailableSpeech,
    grader: monitored(monitor, "grade", raw.grader, (r) => r.source, "on_device"),
    voiceGrader: monitored(monitor, "grade-voice", raw.voiceGrader, (r) => r.source, "in_cloud"),
    generator: monitored(monitor, "generate", raw.generator, () => "in_cloud", "in_cloud"),
    explainer: monitored(monitor, "explain", raw.explainer, (r) => r.source, "on_device"),
    speech: cachedBlobSource(monitored(monitor, "speak", raw.speech, () => "in_cloud", "in_cloud"), stores.speech),
    backdrops: cachedBlobSource(monitored(monitor, "paint", raw.backdrops, () => "in_cloud", "in_cloud"), stores.backdrops),
  };
};
