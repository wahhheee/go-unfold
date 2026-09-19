import { expect, it } from 'vitest';
import { publicationOrder } from './happens-before';
it('关闭通知和观察到原子发布均连接写入与随后读取', () => {
  expect(publicationOrder('close').ordered).toBe(true);
  expect(publicationOrder('atomic').ordered).toBe(true);
});
it('等待时长和读取之后才同步都无法建立所需顺序', () => {
  expect(publicationOrder('sleep').ordered).toBe(false);
  expect(publicationOrder('late').ordered).toBe(false);
  expect(publicationOrder('late').synchronized).toBe(true);
});
