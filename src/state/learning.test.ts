import { describe, expect, it } from 'vitest';
import { parseLearningRecords, parseLearningState } from './learning';

describe('学习记录恢复', () => {
  it('旧版序章记录迁移后保留笔记和进度', () => {
    expect(
      parseLearningRecords(null, JSON.stringify({ notes: '我的笔记', completed: true })).preface,
    ).toMatchObject({ notes: '我的笔记', completed: true });
  });
  it('各章节的笔记和收藏互相隔离', () => {
    const records = parseLearningRecords(
      JSON.stringify({
        version: 2,
        lessons: {
          preface: { notes: '序章', bookmarked: true },
          'go-basics': { notes: '语言基础', completed: true },
        },
      }),
      null,
    );
    expect(records.preface).toMatchObject({ notes: '序章', bookmarked: true, completed: false });
    expect(records['go-basics']).toMatchObject({
      notes: '语言基础',
      bookmarked: false,
      completed: true,
    });
  });
  it.each([null, 'broken', 'null', '42'])('损坏记录回退为空状态', (raw) => {
    expect(parseLearningState(raw)).toMatchObject({
      answers: {},
      notes: '',
      bookmarked: false,
      completed: false,
    });
  });
  it('仅接受已知题目中合法的答案', () => {
    expect(
      parseLearningState(
        JSON.stringify({
          answers: { 'atomic-acquire': 1, 'lease-expiry': 99, 'database-defaults': -1, unknown: 0 },
          notes: '租约不是永久互斥',
          completed: true,
        }),
      ).answers,
    ).toEqual({ 'atomic-acquire': 1 });
  });
  it('保留合法状态，并限制异常笔记长度', () => {
    const state = parseLearningState(
      JSON.stringify({
        notes: 'a'.repeat(30000),
        bookmarked: true,
        completed: 'true',
        labRan: true,
      }),
    );
    expect(state.notes).toHaveLength(20000);
    expect(state.bookmarked).toBe(true);
    expect(state.completed).toBe(false);
    expect(state.labRan).toBe(true);
  });
});
