import { useCallback, useMemo, useState } from "react";
import { type PracticeStore, localPracticeStore } from "../progress/practice-store";
import { type FinishedLesson, activeStreak, dayKey, recordLesson } from "../progress/streak";
import { weekStrip, weeklySummary } from "../progress/weekly";

export const usePractice = (store?: PracticeStore) => {
  const practiceStore = useMemo(() => store ?? localPracticeStore(), [store]);
  const [practice, setPractice] = useState(() => practiceStore.load());

  const finishLesson = useCallback(
    (lesson?: FinishedLesson) => {
      setPractice((current) => {
        const next = recordLesson(current, dayKey(new Date()), lesson);
        practiceStore.save(next);
        return next;
      });
    },
    [practiceStore],
  );

  const today = dayKey(new Date());
  return {
    streak: activeStreak(practice, today),
    best: practice.best,
    lessonsDone: practice.lessonsDone,
    xp: practice.xp,
    week: weekStrip(practice, today),
    summary: weeklySummary(practice, today),
    finishLesson,
  };
};
