import { expect, it } from 'vitest';
import { dnsStep, newDnsState } from './dns-model';
it('缓存到期不会迁移连接，关闭后才重新解析', () => {
  let s = dnsStep(newDnsState(), 'request', 10);
  s = dnsStep(s, 'switch', 10);
  s = dnsStep(s, 'tick', 10);
  s = dnsStep(s, 'request', 10);
  expect(s.connection).toBe('192.0.2.10');
  expect(s.queries).toBe(1);
  s = dnsStep(dnsStep(s, 'close', 10), 'request', 10);
  expect(s.connection).toBe('192.0.2.20');
  expect(s.queries).toBe(2);
});
it('TTL 到期前新建连接仍取缓存，命中不会续期', () => {
  let s = dnsStep(newDnsState(), 'request', 30);
  s = dnsStep(dnsStep(s, 'switch', 30), 'tick', 30);
  s = dnsStep(dnsStep(s, 'close', 30), 'request', 30);
  expect(s.connection).toBe('192.0.2.10');
  expect(s.cache?.expires).toBe(30);
  expect(s.queries).toBe(1);
});
