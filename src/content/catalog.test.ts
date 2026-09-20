import { expect, it } from 'vitest';
import { modules } from './curriculum';
import { lessons } from './lessons';
import { questions } from './questions';

it('章节身份、目录锚点与模块归属不会互相覆盖', () => {
  expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length);
  expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);
  for (const lesson of lessons) {
    expect(lesson.id).toMatch(/^[a-z0-9-]+$/);
    expect(lesson.path).toBe(`/learn/${lesson.id}`);
    expect(modules.some((module) => module.id === lesson.moduleId)).toBe(true);
    expect(new Set(lesson.sections.map((section) => section.id)).size).toBe(lesson.sections.length);
    expect(lesson.sections.some((section) => section.id === 'sources')).toBe(true);
    expect(lesson.sources.length).toBeGreaterThan(0);
    for (const source of lesson.sources) expect(new URL(source.url).protocol).toBe('https:');
  }
  for (const module of modules.filter((item) => item.contentComplete))
    expect(lessons.some((lesson) => lesson.moduleId === module.id)).toBe(true);
});

it('每个题目都归属已发布章节，答案与逐项解释对应有效选项', () => {
  expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
  for (const question of questions) {
    expect(lessons.some((lesson) => lesson.id === question.lessonId)).toBe(true);
    expect(question.options.length).toBeGreaterThanOrEqual(2);
    expect(Number.isInteger(question.answer)).toBe(true);
    expect(question.answer).toBeGreaterThanOrEqual(0);
    expect(question.answer).toBeLessThan(question.options.length);
    expect(question.explanations).toHaveLength(question.options.length);
    expect(question.explanations.every((explanation) => explanation.trim().length > 0)).toBe(true);
    expect(question.takeaway.trim().length).toBeGreaterThan(0);
  }
});

it('全局练习按课程顺序排列，新增章节不会插到序章之前', () => {
  const positions = questions.map((question) =>
    lessons.findIndex((lesson) => lesson.id === question.lessonId),
  );
  expect(positions.every((position, i) => i === 0 || position >= positions[i - 1])).toBe(true);
});
