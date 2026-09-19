import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { MDXProps } from 'mdx/types';
import { preface, sources } from './curriculum';
import { typesLesson } from './go/types';
import { interfacesLesson } from './go/interfaces';
import { genericsLesson } from './go/generics';
import { sequencesLesson } from './go/sequences';
import { mapsLesson } from './go/maps';
import { schedulerLesson } from './go/scheduler';
import { memoryLesson } from './go/memory';
import { performanceLesson } from './go/performance';
import { errorsLesson } from './go/errors';
import { testingLesson } from './go/testing';
import { memoryModelLesson } from './concurrency/memory-model';
import { channelsLesson } from './concurrency/channels';
import { selectLesson } from './concurrency/select';
import { mutexLesson } from './concurrency/mutex';
import { atomicLesson } from './concurrency/atomic';
import { coordinationLesson } from './concurrency/coordination';

export type LessonDefinition = {
  id: string;
  moduleId: string;
  label: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  path: string;
  description: string[];
  minutes: number;
  labCount: number;
  verifiedAt: string;
  intro?: { title: string; body: string };
  sections: { id: string; title: string; keywords?: string }[];
  sources: { title: string; note: string; url: string }[];
  Content: LazyExoticComponent<ComponentType<MDXProps>>;
};

// 只有完成内容核验的章节才进入此注册表，课程规划独立维护。
export const lessons: LessonDefinition[] = [
  {
    ...preface,
    moduleId: 'preface',
    label: '序章',
    eyebrow: 'PREFACE',
    description: [
      '越过标准答案，走进问题背后的原理。',
      '从这里开始，建立属于你的 Go 服务端知识体系。',
    ],
    labCount: 1,
    intro: {
      title: '这不是一份更长的背诵清单。',
      body: '这是一次从「知道答案」到「能够推理」的练习。',
    },
    sources,
    Content: lazy(() => import('./lessons/preface.mdx')),
  },
  typesLesson,
  interfacesLesson,
  genericsLesson,
  sequencesLesson,
  mapsLesson,
  schedulerLesson,
  memoryLesson,
  performanceLesson,
  errorsLesson,
  testingLesson,
  memoryModelLesson,
  channelsLesson,
  selectLesson,
  mutexLesson,
  atomicLesson,
  coordinationLesson,
];

export function findLesson(id: string) {
  return lessons.find((lesson) => lesson.id === id);
}
