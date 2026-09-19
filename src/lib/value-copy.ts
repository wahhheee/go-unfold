export type ValueRecord = { score: number; ageCell: string };
export type ValueCopyState = {
  original: ValueRecord;
  copy: ValueRecord | null;
  cells: Record<string, number>;
};
export function initialValueCopy(): ValueCopyState {
  return { original: { score: 10, ageCell: 'age-1' }, copy: null, cells: { 'age-1': 20 } };
}
export function copyRecord(state: ValueCopyState, independent: boolean): ValueCopyState {
  const ageCell = independent ? 'age-2' : state.original.ageCell;
  return {
    ...state,
    copy: { ...state.original, ageCell },
    cells: { ...state.cells, [ageCell]: state.cells[state.original.ageCell] },
  };
}
export function editCopy(
  state: ValueCopyState,
  field: 'score' | 'age',
  value: number,
): ValueCopyState {
  if (!Number.isInteger(value) || value < 0 || value > 99)
    throw new Error('示例值必须是 0 到 99 的整数');
  if (!state.copy) throw new Error('请先复制结构体');
  return field === 'score'
    ? { ...state, copy: { ...state.copy, score: value } }
    : { ...state, cells: { ...state.cells, [state.copy.ageCell]: value } };
}
