export type PollMode = 'lt' | 'et';
export type ReadinessState = {
  buffer: number[];
  next: number;
  edge: boolean;
  eof: boolean;
  read: number;
  notice: string;
  message: string;
};
export const newReadiness = (): ReadinessState => ({
  buffer: [],
  next: 1,
  edge: false,
  eof: false,
  read: 0,
  notice: '尚未取事件',
  message: '先让四字节到达，再取一次就绪事件。事件本身不会把字节搬到应用缓冲区。',
});
export function readinessStep(
  s: ReadinessState,
  action: 'arrive' | 'wait' | 'read' | 'drain' | 'eof',
  mode: PollMode,
): ReadinessState {
  if (action === 'arrive') {
    if (s.eof || s.buffer.length > 4) return s;
    return {
      ...s,
      buffer: [...s.buffer, ...Array.from({ length: 4 }, (_, i) => s.next + i)],
      next: s.next + 4,
      edge: true,
      message: '四字节进入内核缓冲；还没有发生应用读取。',
    };
  }
  if (action === 'eof')
    return s.eof
      ? s
      : {
          ...s,
          eof: true,
          edge: true,
          message: '对端关闭写方向。先读完已有字节，后续读取才返回 EOF。',
        };
  if (action === 'wait') {
    const ready = mode === 'lt' ? s.buffer.length > 0 || s.eof : s.edge;
    return {
      ...s,
      edge: false,
      notice: ready ? '收到就绪事件' : '本次没有新事件',
      message: ready
        ? '就绪提示现在可以尝试 I/O；仍须处理实际 Read 的数据、EOF 或错误。'
        : s.buffer.length
          ? '没有新事件，但缓冲仍有字节！ET 不能把“只读了一部分”当成已经排空。'
          : '当前没有新通知；实际程序可等待，不应空转轮询。',
    };
  }
  const count = action === 'read' ? Math.min(2, s.buffer.length) : s.buffer.length;
  const buffer = s.buffer.slice(count);
  const terminal = action === 'drain' || count === 0;
  return {
    ...s,
    buffer,
    read: s.read + count,
    message: terminal
      ? `读取 ${count} 字节后得到 ${s.eof ? 'EOF：读方向结束' : 'EAGAIN：当前暂时无数据，可以等待下一次事件'}。`
      : `读取 ${count} 字节，缓冲还剩 ${buffer.length} 字节；一次成功 Read 不证明已经排空。`,
  };
}
