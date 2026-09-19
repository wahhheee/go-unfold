import { describe, expect, it } from 'vitest';
import { advancePool, initialPool, poolFinished, stopPool } from './pool-model';
import type { PoolConfig, PoolState } from './pool-model';
const accounted = (s: PoolState) =>
  s.completed +
  s.rejected +
  s.canceled +
  s.queue.length +
  s.outside.length +
  s.running.filter(Boolean).length;

describe('任务池的容量与生命周期', () => {
  it('全部界面参数组合保持数量守恒和内部容量边界', () => {
    for (const policy of ['reject', 'spawn'] as const)
      for (let workers = 1; workers <= 4; workers++)
        for (let capacity = 0; capacity <= 6; capacity++)
          for (let arrivals = 0; arrivals <= 8; arrivals++) {
            const config: PoolConfig = { policy, workers, capacity, arrivals };
            let state = initialPool(workers);
            for (let tick = 0; tick < 20; tick++) {
              state = advancePool(state, config);
              expect(accounted(state)).toBe(state.arrived);
              expect(state.queue.length).toBeLessThanOrEqual(capacity);
              expect(state.running.length).toBe(workers);
              if (policy === 'reject') expect(state.outside).toHaveLength(0);
            }
          }
  });
  it('队列上限不阻止外部提交者积累', () => {
    const config: PoolConfig = { workers: 1, capacity: 1, arrivals: 5, policy: 'spawn' };
    let state = initialPool(1);
    for (let i = 0; i < 10; i++) state = advancePool(state, config);
    expect(state.queue).toHaveLength(1);
    expect(state.outside.length).toBeGreaterThan(30);
    expect(state.rejected).toBe(0);
  });
  it('停止准入拒绝外部等待者，排空已有工作不丢账', () => {
    const config: PoolConfig = { workers: 2, capacity: 3, arrivals: 8, policy: 'spawn' };
    let state = advancePool(initialPool(2), config);
    const accepted = state.running.filter(Boolean).length + state.queue.length;
    state = stopPool(state, 'draining');
    expect(state.outside).toHaveLength(0);
    for (let i = 0; i < 12; i++) state = advancePool(state, config);
    expect(poolFinished(state)).toBe(true);
    expect(state.arrived).toBe(8);
    expect(state.completed).toBe(accepted);
    expect(accounted(state)).toBe(8);
  });
  it('从排空升级为中止后，未完成工作明确计入取消', () => {
    const config: PoolConfig = { workers: 2, capacity: 3, arrivals: 8, policy: 'spawn' };
    let state = stopPool(advancePool(initialPool(2), config), 'draining');
    state = stopPool(state, 'aborted');
    expect(state.canceled).toBe(5);
    expect(state.rejected).toBe(3);
    expect(poolFinished(state)).toBe(true);
    expect(accounted(state)).toBe(state.arrived);
    expect(advancePool(state, config)).toBe(state);
  });
});
