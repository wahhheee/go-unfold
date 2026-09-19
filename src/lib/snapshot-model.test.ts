import { describe, expect, it } from 'vitest';
import { advanceSnapshot, initialSnapshot } from './snapshot-model';

describe('快照的身份与发布边界', () => {
  it('独立 map 让旧读者跨发布保留旧版本', () => {
    let state = initialSnapshot('clone');
    for (let i = 0; i < 3; i++) state = advanceSnapshot(state, 40);
    expect(state.current.version).toBe(2);
    expect(state.maps[state.reader.map]).toBe(10);
    expect(state.maps[state.current.map]).toBe(40);
  });
  it('浅复制在原子发布之前就污染旧读者', () => {
    let state = initialSnapshot('alias');
    state = advanceSnapshot(state, 40);
    state = advanceSnapshot(state, 40);
    expect(state.current.version).toBe(1);
    expect(state.maps[state.reader.map]).toBe(40);
  });
  it('发布前克隆不能保护发布后的写入', () => {
    let state = initialSnapshot('clone');
    for (let i = 0; i < 3; i++) state = advanceSnapshot(state, 40);
    const retained = state.current;
    state = advanceSnapshot(state, 70);
    expect(state.maps[retained.map]).toBe(70);
    expect(state.maps[state.reader.map]).toBe(10);
  });
});
