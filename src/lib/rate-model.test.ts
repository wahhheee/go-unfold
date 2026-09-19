import { describe, expect, it } from 'vitest';
import { initialBucket, refillBucket, requestTokens } from './rate-model';

describe('有限正速率的 AllowN 教学模型', () => {
  it('与真实 Go 限流器的时间向量一致', () => {
    const config = { rate: 2, burst: 3 };
    let state = initialBucket(config);
    const cases = [
      [0, 3, true, 0],
      [0, 1, false, 0],
      [250, 1, false, 0.5],
      [500, 1, true, 0],
      [10000, 4, false, 3],
      [10000, 3, true, 0],
    ] as const;
    for (const [ms, count, allowed, tokens] of cases) {
      state = refillBucket(state, config, ms - state.ms);
      state = requestTokens(state, config, count);
      expect(state.last).toBe(allowed ? 'allowed' : 'rejected');
      expect(state.tokens).toBe(tokens);
    }
  });
  it('全部界面参数下补充与申请都保持容量边界', () => {
    for (let rate = 1; rate <= 8; rate++)
      for (let burst = 1; burst <= 10; burst++) {
        const config = { rate, burst };
        let state = initialBucket(config);
        for (let i = 1; i <= 48; i++) {
          state = refillBucket(state, config, 250);
          state = requestTokens(state, config, (i % 12) + 1);
          expect(state.tokens).toBeGreaterThanOrEqual(0);
          expect(state.tokens).toBeLessThanOrEqual(burst);
          expect(state.allowed + state.rejected).toBe(i);
        }
      }
  });
  it('拒绝不消耗令牌，闲置不能突破突发额度', () => {
    const config = { rate: 2, burst: 3 };
    const full = initialBucket(config);
    expect(requestTokens(full, config, 4).tokens).toBe(3);
    expect(refillBucket(full, config, 1000000).tokens).toBe(3);
    expect(() => refillBucket(full, config, -1)).toThrow();
    expect(() => requestTokens(full, config, 0)).toThrow();
  });
});
