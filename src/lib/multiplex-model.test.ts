import { expect, it } from 'vitest';
import { muxView } from './multiplex-model';
it('TCP 的首个缺口阻塞所有后续流，QUIC 仅阻塞对应流', () => {
  expect(muxView('h2', 6, 0, false).streams.map((s) => s.delivered)).toEqual([0, 0, 0]);
  expect(muxView('h3', 6, 0, false).streams.map((s) => s.delivered)).toEqual([0, 2, 2]);
});
it('所有丢失位置均在补齐后恢复，QPACK 依赖仍能阻塞应用', () => {
  for (let loss = 0; loss < 6; loss++)
    for (const protocol of ['h2', 'h3'] as const) {
      expect(muxView(protocol, 7, loss, false).streams.map((s) => s.delivered)).toEqual([2, 2, 2]);
    }
  expect(muxView('h3', 6, 0, true).streams.map((s) => s.delivered)).toEqual([0, 0, 0]);
  expect(muxView('h3', 7, 0, true).streams.map((s) => s.delivered)).toEqual([2, 2, 2]);
});
