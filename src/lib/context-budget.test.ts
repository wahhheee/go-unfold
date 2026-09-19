import { describe, expect, it } from 'vitest';
import { contextBudget } from './context-budget';

describe('父子预算与取消原因', () => {
  it('子预算从创建时计算，但不能延长父请求', () => {
    const view = contextBudget({ mode: 'inherit', parentMs: 1000, childMs: 900 }, 300, null);
    expect(view.child.deadline).toBe(1000);
    expect(view.child.remaining).toBe(700);
    expect(
      contextBudget({ mode: 'inherit', parentMs: 1000, childMs: 700 }, 1000, null).child.ended
        ?.origin,
    ).toBe('父子共同截止时间到期');
  });
  it('自身到期发生在父取消前时，保留首次原因', () => {
    const view = contextBudget({ mode: 'inherit', parentMs: 1000, childMs: 100 }, 700, 600);
    expect(view.parent.error).toBe('context.Canceled');
    expect(view.child.error).toBe('context.DeadlineExceeded');
    expect(view.child.ended?.at).toBe(400);
  });
  it('继承取消时 Err 与业务 Cause 不同', () => {
    const view = contextBudget({ mode: 'inherit', parentMs: 1000, childMs: 900 }, 500, 500);
    expect(view.child.error).toBe('context.Canceled');
    expect(view.child.cause).toBe('调用方取消');
  });
  it('WithoutCancel 不留下旧预算，重新限时才有新截止时间', () => {
    const config = { parentMs: 1000, childMs: 900 };
    const detached = contextBudget({ ...config, mode: 'detached' }, 1500, 500).child;
    expect(detached.deadline).toBeNull();
    expect(detached.done).toBe('nil');
    expect(detached.cause).toBe('nil');
    const bounded = contextBudget({ ...config, mode: 'bounded' }, 1100, 500).child;
    expect(bounded.remaining).toBe(100);
    expect(contextBudget({ ...config, mode: 'bounded' }, 1200, 500).child.error).toBe(
      'context.DeadlineExceeded',
    );
  });
});
