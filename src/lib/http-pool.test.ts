import { expect, it } from 'vitest';
import { httpPoolStep, newHttpPool } from './http-pool';
it('响应头不释放连接，EOF 后等待者复用同一连接', () => {
  let s = httpPoolStep(newHttpPool(), 1, 'request');
  s = httpPoolStep(s, 1, 'request');
  s = httpPoolStep(s, 1, 'headers', 1);
  expect(s.waiting).toEqual([2]);
  for (let i = 0; i < 3; i++) s = httpPoolStep(s, 1, 'read', 1);
  expect(s.dials).toBe(1);
  expect(s.completed).toBe(1);
  expect(s.slots[0]).toMatchObject({ request: 2, phase: 'headers', left: 3 });
  expect(s.waiting).toEqual([]);
});
it('丢弃 Body 后重新拨号，关闭空闲不取消活跃请求', () => {
  let s = httpPoolStep(newHttpPool(), 1, 'request');
  s = httpPoolStep(s, 1, 'request');
  s = httpPoolStep(s, 1, 'headers', 1);
  s = httpPoolStep(s, 1, 'abandon', 1);
  expect(s.dials).toBe(2);
  expect(s.slots[0].id).toBe(2);
  s = httpPoolStep(s, 1, 'closeIdle');
  expect(s.slots).toHaveLength(1);
  expect(s.completed).toBe(0);
});
