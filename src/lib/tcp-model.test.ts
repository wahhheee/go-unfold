import { expect, it } from 'vitest';
import { newStream, readStream } from './tcp-model';
it('所有读取粒度都还原相同消息，EOF 不产生空消息', () => {
  for (let amount = 1; amount <= 7; amount++) {
    let s = newStream();
    while (!s.ended) s = readStream(s, amount, true, false);
    expect(s.messages).toEqual(['CAT', 'OK']);
    expect(s.error).toBeNull();
    expect(readStream(s, amount, true, false)).toBe(s);
  }
});
it('截断只交付第一帧，错误方案暴露读取边界', () => {
  let s = newStream();
  while (!s.ended) s = readStream(s, 7, true, true);
  expect(s.messages).toEqual(['CAT']);
  expect(s.error).toContain('截断');
  expect(readStream(newStream(), 7, false, false).messages).toEqual(['?CAT?OK']);
});
