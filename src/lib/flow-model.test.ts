import { expect, it } from 'vitest';
import { flowStep, flowView, newFlow } from './flow-model';
it('丢失留下确认缺口，修补后 ACK 跨过已收到的后续段', () => {
  const c = { cwnd: 4, capacity: 4, loss: true };
  let s = flowStep(newFlow(), c, 'send');
  s = flowStep(s, c, 'deliver');
  expect(s.ack).toBe(1);
  expect(s.received).toEqual([0, 2, 3]);
  expect(flowView(s, c).sendable).toBe(0);
  s = flowStep(flowStep(s, c, 'repair'), c, 'deliver');
  expect(s.ack).toBe(4);
  expect(s.consumed).toBe(0);
  expect(flowView(s, c).rwnd).toBe(0);
  s = flowStep(s, c, 'consume');
  expect(flowView(s, c).sendable).toBe(4);
});
it('较小窗口与已发未确认共同限制发送，读数据不越过缺口', () => {
  const c = { cwnd: 2, capacity: 8, loss: true };
  let s = flowStep(newFlow(), c, 'send');
  expect(s.next).toBe(2);
  expect(flowView(s, c).sendable).toBe(0);
  s = flowStep(s, c, 'deliver');
  s = flowStep(s, c, 'consume');
  expect(s.consumed).toBe(1);
  expect(flowView(s, c).sendable).toBe(1);
});
it('完整传输不会超出总量或接收容量', () => {
  for (let capacity = 1; capacity <= 8; capacity++)
    for (let cwnd = 1; cwnd <= 8; cwnd++) {
      const c = { cwnd, capacity, loss: false };
      let s = newFlow();
      for (let i = 0; i < 12; i++) {
        s = flowStep(s, c, 'send');
        expect(s.next - s.consumed).toBeLessThanOrEqual(capacity);
        s = flowStep(s, c, 'deliver');
        s = flowStep(s, c, 'consume');
      }
      expect(s.consumed).toBe(12);
    }
});
