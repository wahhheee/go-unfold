import { describe, expect, it } from 'vitest';
import { copyRecord, editCopy, initialValueCopy } from './value-copy';

describe('值复制与可达对象', () => {
  it('修改副本值字段不会改原字段', () => {
    const result = editCopy(copyRecord(initialValueCopy(), false), 'score', 99);
    expect(result.original.score).toBe(10);
    expect(result.copy?.score).toBe(99);
  });
  it('复制指针值后共享同一个对象，源状态不被修改', () => {
    const initial = copyRecord(initialValueCopy(), false);
    const result = editCopy(initial, 'age', 30);
    expect(result.cells[result.original.ageCell]).toBe(30);
    expect(initial.cells['age-1']).toBe(20);
  });
  it('另分配对象后修改副本不影响原对象', () => {
    const result = editCopy(copyRecord(initialValueCopy(), true), 'age', 30);
    expect(result.cells[result.original.ageCell]).toBe(20);
    expect(result.cells[result.copy!.ageCell]).toBe(30);
  });
});
