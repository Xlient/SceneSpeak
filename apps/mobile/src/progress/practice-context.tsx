import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EMPTY_PRACTICE, type FinishedLesson, type Practice, activeStreak, dayKey, recordLesson } from "@scenespeak/core/progress/streak";
import { type WeekDay, weekStrip } from "@scenespeak/core/progress/weekly";
import { asyncPracticeStore } from "./async-practice-store";

interface PracticeView {
  streak: number;
  best: number;
  lessonsDone: number;
  xp: number;
  week: readonly WeekDay[];
  practisedDays: readonly string[];
  finishLesson: (lesson: FinishedLesson) => void;
  /** Forgets in-memory progress after the stored copy was deleted. */
  reset: () => void;
}

const store = asyncPracticeStore(AsyncStorage);

const PracticeContext = createContext<PracticeView | null>(null);

/** Streaks, points and history, stored on this device only (same format as the web app). */
export const PracticeProvider = ({ children }: { children: ReactNode }) => {
  const [practice, setPractice] = useState<Practice>(EMPTY_PRACTICE);

  useEffect(() => {
    let live = true;
    void store.load().then((loaded) => {
      if (live) setPractice(loaded);
    });
    return () => {
      live = false;
    };
  }, []);

  const finishLesson = useCallback((lesson: FinishedLesson) => {
    setPractice((current) => {
      const next = recordLesson(current, dayKey(new Date()), lesson);
      void store.save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => setPractice(EMPTY_PRACTICE), []);

  const value = useMemo((): PracticeView => {
    const today = dayKey(new Date());
    return {
      streak: activeStreak(practice, today),
      best: practice.best,
      lessonsDone: practice.lessonsDone,
      xp: practice.xp,
      week: weekStrip(practice, today),
      practisedDays: practice.history.filter((day) => day.lessons > 0).map((day) => day.day),
      finishLesson,
      reset,
    };
  }, [practice, finishLesson, reset]);

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
};

export const usePractice = (): PracticeView => {
  const value = useContext(PracticeContext);
  if (!value) throw new Error("usePractice needs a PracticeProvider");
  return value;
};
