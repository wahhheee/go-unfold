import { describe, expect, it } from 'vitest';
import { sliceSnapshot } from './slices';
describe('切片别名模型', () => {
  it('有容量时追加覆盖原数组，随后元素修改可见', () => {
    expect(sliceSnapshot('share', 2, 99, 2).original).toEqual([7, 20, 99, 40]);
    expect(sliceSnapshot('share', 2, 99, 2).a).toEqual([7, 20]);
  });
  it('限制容量不立即复制，追加后才与原数组分离', () => {
    expect(sliceSnapshot('limit', 2, 99, 0).shared).toBe(true);
    expect(sliceSnapshot('limit', 2, 99, 2).original).toEqual([10, 20, 30, 40]);
    expect(sliceSnapshot('limit', 2, 99, 2).b).toEqual([7, 20, 99]);
  });
  it('复制模式与原数组独立，满容量也需要新数组', () => {
    expect(sliceSnapshot('copy', 2, 99, 0).shared).toBe(false);
    expect(sliceSnapshot('share', 4, 99, 2).original).toEqual([10, 20, 30, 40]);
  });
});
