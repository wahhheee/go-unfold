export type SliceMode = 'share' | 'limit' | 'copy';
export function sliceSnapshot(mode: SliceMode, length: number, appended: number, stage: number) {
  if (!Number.isInteger(length) || length < 1 || length > 4 || !Number.isFinite(appended))
    throw new Error('切片实验参数无效');
  const original = [10, 20, 30, 40];
  const shared = mode !== 'copy' && (stage === 0 || (mode === 'share' && length < 4));
  let b = original.slice(0, length);
  if (stage >= 1) {
    b = [...b, appended];
    if (shared) original[length] = appended;
  }
  if (stage >= 2) {
    b[0] = 7;
    if (shared) original[0] = 7;
  }
  return {
    original,
    b,
    shared,
    a: original.slice(0, length),
    bCapacity:
      stage === 0 ? String(mode === 'share' ? 4 : length) : shared ? '4' : `至少 ${length + 1}`,
  };
}
