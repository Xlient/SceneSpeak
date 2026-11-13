import type { BackdropPainter, SpeechSource } from "../audio/media-sources";
import { unavailableBackdrops, unavailableSpeech } from "../audio/media-sources";
import { type BlobStore, cachedBlobSource, createCacheStorageStore } from "../cache/blob-cache";
import { type LessonGenerator, unavailableGenerator } from "../lesson/generator";
import { type Grader, unavailableGrader } from "../lesson/grader";
import { type VoiceGrader, unavailableVoiceGrader } from "../lesson/voice-grader";
import { type ModelMonitor, createModelMonitor, monitored } from "../monitor/model-monitor";

/** Every AI-backed capability the UI uses. Real implementations replace the stubs in `createAppServices`. */
export interface AppServices {
  grader: Grader;
  voiceGrader: VoiceGrader;
  generator: LessonGenerator;
  speech: SpeechSource;
  backdrops: BackdropPainter;
  monitor: ModelMonitor;
}

export interface RawServices {
  grader: Grader;
  voiceGrader: VoiceGrader;
  generator: LessonGenerator;
  speech: SpeechSource;
  backdrops: BackdropPainter;
}

export const STUB_SERVICES: RawServices = {
  grader: unavailableGrader,
  voiceGrader: unavailableVoiceGrader,
  generator: unavailableGenerator,
  speech: unavailableSpeech,
  backdrops: unavailableBackdrops,
};

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
    grader: monitored(monitor, "grade", raw.grader, (r) => r.source, "on_device"),
    voiceGrader: monitored(monitor, "grade-voice", raw.voiceGrader, (r) => r.source, "in_cloud"),
    generator: monitored(monitor, "generate", raw.generator, () => "in_cloud", "in_cloud"),
    speech: cachedBlobSource(monitored(monitor, "speak", raw.speech, () => "in_cloud", "in_cloud"), stores.speech),
    backdrops: cachedBlobSource(monitored(monitor, "paint", raw.backdrops, () => "in_cloud", "in_cloud"), stores.backdrops),
  };
};
