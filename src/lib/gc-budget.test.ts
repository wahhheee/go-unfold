import { expect, it } from 'vitest';
import { gcBudget } from './gc-budget';
it('官方指南的根集合参与堆目标计算', () => {
  expect(gcBudget(8, 2, 100, 20)).toEqual({ headroom: 10, goal: 18, cyclesPerSecond: 2 });
});
it('提高 GOGC 扩大增长预算，不把存活堆本身翻倍', () => {
  const normal = gcBudget(8, 2, 100, 20),
    higher = gcBudget(8, 2, 200, 20);
  expect(higher.goal).toBe(28);
  expect(higher.headroom).toBe(2 * normal.headroom);
  expect(higher.cyclesPerSecond).toBe(normal.cyclesPerSecond / 2);
});
