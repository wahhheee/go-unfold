export type DataCase = 'value' | 'empty' | 'closed' | 'nil' | 'closed-send';
export type SelectCandidate = { id: 'data' | 'cancel' | 'default'; label: string; result: string };
export function selectCandidates(
  data: DataCase,
  canceled: boolean,
  withDefault: boolean,
): SelectCandidate[] {
  const candidates: SelectCandidate[] = [];
  if (data === 'value')
    candidates.push({
      id: 'data',
      label: '数据接收',
      result: '收到任务 7；之后是否执行工作由业务逻辑决定。',
    });
  if (data === 'closed')
    candidates.push({
      id: 'data',
      label: '关闭后的接收',
      result: '收到 0, ok=false；这个分支持续就绪。',
    });
  if (data === 'closed-send')
    candidates.push({
      id: 'data',
      label: '向已关闭通道发送',
      result: 'panic：取消分支不会自动保护这个发送。',
    });
  if (canceled)
    candidates.push({
      id: 'cancel',
      label: '取消通知',
      result: '观察到取消；其他任务不会因此被自动强杀。',
    });
  if (candidates.length === 0 && withDefault)
    candidates.push({
      id: 'default',
      label: 'default',
      result: '没有就绪通信，执行 default；循环中反复如此可能忙等。',
    });
  return candidates;
}
