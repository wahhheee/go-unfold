import { expect, it } from 'vitest';
import { tlsView } from './tls-model';
const good = { trust: true, name: true, valid: true, alpn: true };
it('每个独立验证条件都能阻止应用数据，ALPN 在更早阶段失败', () => {
  for (const key of ['trust', 'name', 'valid', 'alpn'] as const) {
    const c = { ...good, [key]: false };
    const v = tlsView(c, 4);
    expect(v.failed).toBe(true);
    expect(v.complete).toBe(false);
    expect(v.actual).toBe(key === 'alpn' ? 2 : 3);
  }
});
it('通过验证不等于握手已完成', () => {
  expect(tlsView(good, 3).complete).toBe(false);
  expect(tlsView(good, 4).complete).toBe(true);
});
