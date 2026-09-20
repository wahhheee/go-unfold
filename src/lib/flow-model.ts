export type FlowConfig = { cwnd: number; capacity: number; loss: boolean };
export type FlowState = {
  next: number;
  ack: number;
  consumed: number;
  received: number[];
  flying: number[];
  lost: number[];
  dropped: boolean;
  message: string;
};
export const newFlow = (): FlowState => ({
  next: 0,
  ack: 0,
  consumed: 0,
  received: [],
  flying: [],
  lost: [],
  dropped: false,
  message: '先发送，再交付与确认；每个方块表示一个等长数据段。',
});
export function flowView(s: FlowState, c: FlowConfig) {
  const rwnd = s.consumed + c.capacity - s.ack;
  return {
    rwnd,
    flight: s.next - s.ack,
    sendable: Math.max(0, Math.min(s.ack + c.cwnd, s.consumed + c.capacity, 12) - s.next),
  };
}
export function flowStep(
  s: FlowState,
  c: FlowConfig,
  action: 'send' | 'deliver' | 'repair' | 'consume',
): FlowState {
  if (action === 'send') {
    const n = flowView(s, c).sendable;
    if (!n) return { ...s, message: '没有新发送额度：检查拥塞窗口、接收窗口与尚未确认的数据。' };
    return {
      ...s,
      next: s.next + n,
      flying: [...s.flying, ...Array.from({ length: n }, (_, i) => s.next + i)],
      message: `发送 ${n} 段，尚未确认 ${s.next + n - s.ack} 段；发送不等于应用已读取。`,
    };
  }
  if (action === 'consume')
    return {
      ...s,
      consumed: s.ack,
      message:
        s.ack > s.consumed
          ? `应用读到位置 ${s.ack}，接收窗口右沿前移，可向发送方通告新额度。`
          : '连续数据尚未增加，应用无法越过缺口读取。',
    };
  if (action === 'repair') {
    if (!s.lost.length) return { ...s, message: '没有已知丢失段可重传。' };
    return {
      ...s,
      flying: [...s.flying, ...s.lost],
      lost: [],
      message: '重传缺失段；这里只演示补洞，不模拟丢失检测计时或拥塞算法的窗口变化。',
    };
  }
  if (!s.flying.length) return { ...s, message: '当前没有在途报文，先发送或重传。' };
  const dropped = c.loss && !s.dropped && s.flying.includes(1);
  const received = [
    ...new Set([...s.received, ...s.flying.filter((n) => !(dropped && n === 1))]),
  ].sort((a, b) => a - b);
  let ack = s.ack;
  while (received.includes(ack)) ack++;
  return {
    ...s,
    received,
    ack,
    flying: [],
    lost: dropped ? [...s.lost, 1] : s.lost,
    dropped: s.dropped || dropped,
    message: dropped
      ? `第 2 段丢失，累计确认停在 ${ack}；后到的段留在接收端，不能越过缺口交付。`
      : `累计确认前进到 ${ack}，表示此位置之前连续收到；不代表应用已经读取。`,
  };
}
