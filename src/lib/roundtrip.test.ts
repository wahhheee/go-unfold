import { expect, it } from 'vitest';
import { parseByteSample, roundTrip } from './roundtrip';
it('用最小反例揭示前导零丢失，而普通样例无法揭示', () => {
  expect(roundTrip([1, 2, 3], 'broken').passed).toBe(true);
  expect(roundTrip([0], 'broken')).toEqual({ encoded: '[]', decoded: [], passed: false });
  expect(roundTrip([0], 'correct').passed).toBe(true);
});
it('正确实现保留空序列、零和边界值', () => {
  for (const values of [[], [0], [255], [0, 1, 0]])
    expect(roundTrip(values, 'correct').decoded).toEqual(values);
});
it('结构化输入拒绝错误形状和字节范围', () => {
  for (const source of [
    '{',
    '{}',
    '[256]',
    '[-1]',
    '[1.5]',
    '["1"]',
    JSON.stringify(Array(65).fill(0)),
  ])
    expect(() => parseByteSample(source)).toThrow();
  expect(parseByteSample('[0,255]')).toEqual([0, 255]);
});
