import { expect, it } from 'vitest';
import { newVm, vmStep, vmStats } from './vm-model';
it('保留范围不分配帧，派生共享驻留，写入才复制', () => {
  let s = newVm();
  expect(vmStats(s).physical).toBe(0);
  s = vmStep(s, 'write', 'parent', 0);
  s = vmStep(s, 'fork', 'parent', 0);
  expect(vmStats(s)).toEqual({ parent: 4, child: 4, physical: 4 });
  s = vmStep(s, 'write', 'child', 0);
  expect(vmStats(s).physical).toBe(8);
  expect(s.frames.map((f) => f.value)).toEqual([1, 2]);
  expect(s.parent[0]).not.toBe(s.child![0]);
  s = vmStep(s, 'write', 'child', 0);
  expect(s.faults).toBe(2);
  expect(s.frames).toHaveLength(2);
});
it('父先写也隔离，释放子映射只回收无引用帧', () => {
  let s = vmStep(vmStep(newVm(), 'write', 'parent', 0), 'fork', 'parent', 0);
  s = vmStep(s, 'write', 'parent', 0);
  expect(s.frames).toHaveLength(2);
  s = vmStep(s, 'release', 'parent', 0);
  expect(s.frames).toEqual([{ id: 2, value: 2 }]);
  expect(s.child).toBeNull();
});
