import { describe, it, expect } from 'vitest';
import { defaultRequestBudget as base, requestTimeline, requestView } from './request-budget';
describe('请求预算与观察边界', () => {
  it('响应体期间总预算到期，提交不回滚', () => {
    const t = requestTimeline(base);
    const v = requestView(base, t.stop);
    expect(v.timeout).toBe(true);
    expect(v.committed).toBe(true);
    expect(v.client).toBe('结果未知');
    expect(v.stop).toBe(500);
  });
  it('响应头预算不覆盖响应体，复用跳过新握手', () => {
    const c = { ...base, scope: 'headers' as const };
    const t = requestTimeline(c);
    expect(t.deadline).toBe(Infinity);
    expect(requestView(c, t.total).complete).toBe(true);
    const reused = requestTimeline({ ...c, reused: true });
    expect(reused.total).toBe(t.total - 150);
    expect(reused.phases.slice(1, 4).every((p) => p.duration === 0)).toBe(true);
  });
  it('响应头超时从请求写完开始，提交前超时也不能断言最终未提交', () => {
    const c = { ...base, scope: 'headers' as const, slow: 'server' as const, budget: 100 };
    const t = requestTimeline(c);
    expect(t.deadline).toBe(t.sentAt + 100);
    const v = requestView(c, t.stop);
    expect(v.committed).toBe(false);
    expect(v.client).toBe('结果未知');
    const cold = { ...base, budget: 100 };
    expect(requestView(cold, 100).client).toBe('本次尚未发出请求');
  });
});
