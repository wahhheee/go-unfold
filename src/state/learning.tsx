import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { questions } from '../content/questions';

export type LearningState = {
  answers: Record<string, number>;
  notes: string;
  bookmarked: boolean;
  completed: boolean;
  labRan: boolean;
};
const emptyState: LearningState = {
  answers: {},
  notes: '',
  bookmarked: false,
  completed: false,
  labRan: false,
};
const storageKey = 'go-deeper:learning:v2';
export type LearningRecords = Record<string, LearningState>;

export function parseLearningState(raw: string | null): LearningState {
  try {
    const data: unknown = JSON.parse(raw || 'null');
    if (!data || typeof data !== 'object') return emptyState;
    const value = data as Record<string, unknown>;
    const answers: Record<string, number> = {};
    if (value.answers && typeof value.answers === 'object') {
      for (const question of questions) {
        const answer = (value.answers as Record<string, unknown>)[question.id];
        if (
          typeof answer === 'number' &&
          Number.isInteger(answer) &&
          answer >= 0 &&
          answer < question.options.length
        )
          answers[question.id] = answer;
      }
    }
    return {
      answers,
      notes: typeof value.notes === 'string' ? value.notes.slice(0, 20000) : '',
      bookmarked: value.bookmarked === true,
      completed: value.completed === true,
      labRan: value.labRan === true,
    };
  } catch {
    return emptyState;
  }
}

export function parseLearningRecords(raw: string | null, legacy: string | null): LearningRecords {
  try {
    if (raw !== null) {
      const data = JSON.parse(raw);
      if (data?.version === 2 && data.lessons && typeof data.lessons === 'object') {
        return Object.fromEntries(
          Object.entries(data.lessons)
            .filter(([id]) => /^[a-z0-9][a-z0-9-]{0,79}$/.test(id))
            .map(([id, value]) => [id, parseLearningState(JSON.stringify(value))]),
        );
      }
    }
  } catch {
    /* 损坏的新记录仍可从上一版记录恢复。 */
  }
  return legacy ? { preface: parseLearningState(legacy) } : {};
}

const LearningContext = createContext<{
  records: LearningRecords;
  updateLesson: (id: string, patch: Partial<LearningState>) => void;
  answerQuestion: (lessonId: string, id: string, choice: number | null) => void;
  storageAvailable: boolean;
} | null>(null);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState(() => {
    try {
      return parseLearningRecords(
        localStorage.getItem(storageKey),
        localStorage.getItem('go-deeper:learning:v1'),
      );
    } catch {
      return {};
    }
  });
  const [storageAvailable, setStorageAvailable] = useState(true);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 2, lessons: records }));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [records]);
  function answerQuestion(lessonId: string, id: string, choice: number | null) {
    setRecords((previous) => {
      const record = previous[lessonId] || emptyState;
      const answers = { ...record.answers };
      if (choice === null) delete answers[id];
      else answers[id] = choice;
      return { ...previous, [lessonId]: { ...record, answers } };
    });
  }
  return (
    <LearningContext.Provider
      value={{
        records,
        updateLesson: (id, patch) =>
          setRecords((previous) => ({
            ...previous,
            [id]: { ...(previous[id] || emptyState), ...patch },
          })),
        answerQuestion,
        storageAvailable,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearningRecords() {
  const context = useContext(LearningContext);
  if (!context) throw new Error('学习状态必须在 LearningProvider 中使用');
  return context;
}

export function useLearning(explicitLessonId?: string) {
  const context = useLearningRecords();
  const location = useLocation();
  const lessonId =
    explicitLessonId || location.pathname.match(/^\/learn\/([^/]+)/)?.[1] || 'preface';
  return {
    state: context.records[lessonId] || emptyState,
    update: (patch: Partial<LearningState>) => context.updateLesson(lessonId, patch),
    answer: (id: string, choice: number | null) => context.answerQuestion(lessonId, id, choice),
    storageAvailable: context.storageAvailable,
  };
}
