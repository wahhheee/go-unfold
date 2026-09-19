import { expect, it } from 'vitest';
import { probeFrames } from './map-probe';
it('短哈希命中还要排除完整键碰撞', () => {
  const frames = probeFrames('k17');
  expect(frames).toHaveLength(2);
  expect(frames[0].candidates).toEqual([0, 1]);
  expect(frames[1].found).toBe(0);
});
it('墓碑不能终止探测', () => {
  const frames = probeFrames('k42');
  expect(frames).toHaveLength(4);
  expect(frames[1].found).toBeNull();
  expect(frames[3].group).toBe(1);
  expect(frames[3].found).toBe(0);
});
it('有空槽且没有完整键匹配才确认不存在', () => {
  const frames = probeFrames('k77');
  expect(frames).toHaveLength(4);
  expect(frames[3].found).toBeNull();
  expect(frames[3].reason).toContain('键不存在');
});
