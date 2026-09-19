export type UpdateMode = 'split' | 'add';
export type Operation = { actor: 'A' | 'B'; kind: 'load' | 'store' | 'add' };
export type CounterFrame = { value: number; a: number | null; b: number | null };

export function enumerateSchedules(mode: UpdateMode): Operation[][] {
  const kinds: Operation['kind'][] = mode === 'split' ? ['load', 'store'] : ['add'];
  const a: Operation[] = kinds.map((kind) => ({ actor: 'A', kind }));
  const b: Operation[] = kinds.map((kind) => ({ actor: 'B', kind }));
  const schedules: Operation[][] = [];
  function visit(i: number, j: number, prefix: Operation[]) {
    if (i === a.length && j === b.length) {
      schedules.push(prefix);
      return;
    }
    if (i < a.length) visit(i + 1, j, [...prefix, a[i]]);
    if (j < b.length) visit(i, j + 1, [...prefix, b[j]]);
  }
  visit(0, 0, []);
  return schedules;
}

export function executeSchedule(operations: Operation[]): CounterFrame[] {
  const frames: CounterFrame[] = [{ value: 0, a: null, b: null }];
  for (const operation of operations) {
    const next = { ...frames.at(-1)! };
    const local = operation.actor === 'A' ? 'a' : 'b';
    if (operation.kind === 'load') next[local] = next.value;
    else if (operation.kind === 'add') next.value++;
    else {
      if (next[local] === null) throw new Error('写回前必须读取局部快照');
      next.value = next[local] + 1;
    }
    frames.push(next);
  }
  return frames;
}
export function operationLabel(operation: Operation) {
  return `${operation.actor}.${operation.kind === 'load' ? 'Load' : operation.kind === 'store' ? 'Store' : 'Add'}`;
}
