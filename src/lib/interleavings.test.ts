import { describe, expect, it } from 'vitest';
import { enumerateSchedules, executeSchedule, operationLabel } from './interleavings';

describe('顺序一致原子操作的有限交错', () => {
  it('枚举六种且不改变任一参与者的程序顺序', () => {
    const schedules = enumerateSchedules('split');
    expect(schedules).toHaveLength(6);
    expect(new Set(schedules.map((s) => s.map(operationLabel).join(','))).size).toBe(6);
    for (const schedule of schedules)
      for (const actor of ['A', 'B'])
        expect(schedule.filter((op) => op.actor === actor).map((op) => op.kind)).toEqual([
          'load',
          'store',
        ]);
  });
  it('分别原子读取和写回仍有四种丢失更新的交错', () => {
    const results = enumerateSchedules('split').map((s) => executeSchedule(s).at(-1)!.value);
    expect(results.filter((value) => value === 1)).toHaveLength(4);
    expect(results.filter((value) => value === 2)).toHaveLength(2);
    expect(results.every((value) => value === 1 || value === 2)).toBe(true);
  });
  it('单次 Add 的两种交错都保留两次更新', () => {
    const schedules = enumerateSchedules('add');
    expect(schedules).toHaveLength(2);
    for (const schedule of schedules) expect(executeSchedule(schedule).at(-1)!.value).toBe(2);
  });
  it('拒绝没有局部快照的写回，保留各步状态', () => {
    expect(() => executeSchedule([{ actor: 'A', kind: 'store' }])).toThrow();
    const frames = executeSchedule(enumerateSchedules('split')[1]);
    expect(frames[0]).toEqual({ value: 0, a: null, b: null });
    expect(frames[2]).toEqual({ value: 0, a: 0, b: 0 });
    expect(frames.at(-1)!.value).toBe(1);
  });
});
