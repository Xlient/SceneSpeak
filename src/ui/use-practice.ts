import { useCallback, useMemo, useState } from "react";
import { type PracticeStore, localPracticeStore } from "../progress/practice-store";
import { activeStreak, dayKey, recordLesson } from "../progress/streak";

export const usePractice = (store?: PracticeStore) => {
  const practiceStore = useMemo(() => store ?? localPracticeStore(), [store]);
  const [practice, setPractice] = useState(() => practiceStore.load());

  const finishLesson = useCallback(() => {
    setPractice((current) => {
      const next = recordLesson(current, dayKey(new Date()));
      practiceStore.save(next);
      return next;
    });
  }, [practiceStore]);

  return { streak: activeStreak(practice, dayKey(new Date())), best: practice.best, lessonsDone: practice.lessonsDone, finishLesson };
};
