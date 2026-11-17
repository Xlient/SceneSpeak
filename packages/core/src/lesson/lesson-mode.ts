export const LESSON_MODES = ["typing", "speaking"] as const;
export type LessonMode = (typeof LESSON_MODES)[number];

export interface ModeSettings {
  label: string;
  icon: string;
  /** Character lines play aloud as soon as they appear. */
  autoPlay: boolean;
  showTranslation: boolean;
  /** The mic is the main way to answer; typing is tucked away as a fallback. */
  voiceFirst: boolean;
  /** Move on by itself when a character's voice line finishes. */
  autoAdvance: boolean;
}

export const MODE_SETTINGS: Readonly<Record<LessonMode, ModeSettings>> = {
  typing: { label: "Typing", icon: "⌨️", autoPlay: true, showTranslation: true, voiceFirst: false, autoAdvance: false },
  // Listening and speaking only: English is hidden so the learner has to listen.
  speaking: { label: "Speaking", icon: "🎙️", autoPlay: true, showTranslation: false, voiceFirst: true, autoAdvance: true },
};

export const isLessonMode = (value: unknown): value is LessonMode => LESSON_MODES.some((mode) => mode === value);
