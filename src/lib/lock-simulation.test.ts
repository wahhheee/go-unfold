import { describe, expect, it } from 'vitest';
import { defaultConfig, parseConfig, simulateLock } from './lock-simulation';

describe('分布式锁的边界', () => {
  it('所有权校验防止误删，但不能阻止过期持有者写入', () => {
    const result = simulateLock(defaultConfig);
    expect(result.overlap).toBe(true);
    expect(result.staleWrite).toBe(true);
    expect(result.wrongUnlock).toBe(false);
    expect(
      result.events.find((event) => event.actor === 'A' && event.kind === 'blocked')?.owner,
    ).toBe('B');
  });
  it('直接删除会破坏新持有者的租约', () => {
    const result = simulateLock({ ...defaultConfig, safeUnlock: false });
    expect(result.wrongUnlock).toBe(true);
    expect(
      result.events.find((event) => event.actor === 'A' && event.kind === 'release')?.owner,
    ).toBeNull();
  });
  it('资源见过新 token 后，拒绝旧 token 的写入', () => {
    const result = simulateLock({ ...defaultConfig, fencing: true });
    expect(result.staleWrite).toBe(false);
    expect(result.events.find((event) => event.kind === 'reject')).toMatchObject({
      actor: 'A',
      lastWriter: 'B',
      highestFence: 42,
    });
  });
  it('尚未观察到更高 token 时，fencing 不会预知后续写入', () => {
    const result = simulateLock({ ...defaultConfig, work: 6, fencing: true });
    expect(result.events.some((event) => event.actor === 'A' && event.kind === 'write')).toBe(true);
    expect(result.events.at(-1)?.lastWriter).toBe('B');
  });
  it('长暂停时续租也停顿', () => {
    expect(simulateLock({ ...defaultConfig, renew: true }).staleWrite).toBe(true);
  });
  it('正常续租阻止 B 获取租约', () => {
    const result = simulateLock({ ...defaultConfig, renew: true, pause: false });
    expect(result.bAcquired).toBe(false);
    expect(result.staleWrite).toBe(false);
    expect(result.events.some((event) => event.kind === 'renew')).toBe(true);
  });
  it('到期边界不能继续被视为持有租约', () => {
    const result = simulateLock({ ...defaultConfig, ttl: 3, work: 3, pause: false });
    const expiration = result.events.findIndex((event) => event.kind === 'expire');
    const write = result.events.findIndex((event) => event.actor === 'A' && event.kind === 'write');
    expect(expiration).toBeLessThan(write);
    expect(result.events[write].owner).toBeNull();
    expect(result.staleWrite).toBe(true);
  });
  it('在全部参数组合中保持时间单调与事件数量有界', () => {
    for (let ttl = 2; ttl <= 10; ttl++)
      for (let work = 3; work <= 14; work++)
        for (const renew of [true, false])
          for (const pause of [true, false]) {
            const result = simulateLock({ ...defaultConfig, ttl, work, renew, pause });
            expect(result.events.length).toBeLessThan(30);
            expect(result.events.map((event) => event.time)).toEqual(
              result.events.map((event) => event.time).sort((a, b) => a - b),
            );
            expect(result.events.at(-1)?.owner).toBeNull();
          }
  });
});

describe('实验配置验证', () => {
  it('接受完整有效配置', () =>
    expect(parseConfig(JSON.stringify(defaultConfig))).toEqual(defaultConfig));
  it.each([
    '{',
    'null',
    '[]',
    '{}',
    JSON.stringify({ ...defaultConfig, ttl: 0 }),
    JSON.stringify({ ...defaultConfig, work: 15 }),
    JSON.stringify({ ...defaultConfig, renew: 'false' }),
    JSON.stringify({ ...defaultConfig, unknown: true }),
  ])('拒绝不合法配置 %s', (raw) => {
    expect(() => parseConfig(raw)).toThrow();
  });
});
