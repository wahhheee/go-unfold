import { describe, it, expect } from 'vitest';
import { newReadiness, readinessStep as step } from './readiness-model';
describe('就绪与读取分离', () => {
  it('ET 部分读取后没有新事件仍可排空，随后继续接收', () => {
    let s = step(newReadiness(), 'arrive', 'et');
    s = step(s, 'wait', 'et');
    expect(s.buffer).toHaveLength(4);
    s = step(s, 'read', 'et');
    s = step(s, 'wait', 'et');
    expect(s.notice).toBe('本次没有新事件');
    expect(s.buffer).toHaveLength(2);
    s = step(s, 'drain', 'et');
    expect(s.message).toContain('EAGAIN');
    expect(s.read).toBe(4);
    s = step(s, 'arrive', 'et');
    expect(step(s, 'wait', 'et').notice).toBe('收到就绪事件');
  });
  it('LT 仍可读时持续通知，EOF 与暂时无数据分开', () => {
    let s = step(newReadiness(), 'arrive', 'lt');
    s = step(s, 'wait', 'lt');
    s = step(s, 'read', 'lt');
    expect(step(s, 'wait', 'lt').notice).toBe('收到就绪事件');
    s = step(s, 'eof', 'lt');
    expect(s.buffer).toHaveLength(2);
    s = step(s, 'drain', 'lt');
    expect(s.message).toContain('EOF');
    expect(s.read).toBe(4);
    expect(step(s, 'wait', 'lt').notice).toBe('收到就绪事件');
    expect(step(s, 'arrive', 'lt')).toEqual(s);
  });
});
