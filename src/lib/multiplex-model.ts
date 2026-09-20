export type MuxProtocol = 'h2' | 'h3';
export const muxPackets = [
  { stream: 'A', part: 0 },
  { stream: 'B', part: 0 },
  { stream: 'A', part: 1 },
  { stream: 'B', part: 1 },
  { stream: 'C', part: 0 },
  { stream: 'C', part: 1 },
] as const;
export function muxView(protocol: MuxProtocol, step: number, loss: number, qpack: boolean) {
  const received = muxPackets.map((_, i) => i < Math.min(step, 6) && (i !== loss || step === 7));
  let prefix = 0;
  while (received[prefix]) prefix++;
  const delivered = muxPackets.map(
    (p, i) =>
      received[i] &&
      (protocol === 'h2'
        ? i < prefix
        : muxPackets.every(
            (before, j) => before.stream !== p.stream || before.part >= p.part || received[j],
          )) &&
      !(protocol === 'h3' && qpack && step < 7),
  );
  const streams = ['A', 'B', 'C'].map((name) => ({
    name,
    received: muxPackets.filter((p, i) => p.stream === name && received[i]).length,
    delivered: muxPackets.filter((p, i) => p.stream === name && delivered[i]).length,
  }));
  const message =
    step === 7
      ? '缺失数据与所选依赖已补齐，三个流均可交付。'
      : protocol === 'h2' && step > loss
        ? 'TCP 字节缺口挡住后续交付，即使它们属于其他 HTTP/2 流。'
        : protocol === 'h3' && qpack
          ? '传输可独立交付，但这里所有响应头引用了尚未到达的 QPACK 动态条目，应用仍需等待。'
          : protocol === 'h3'
            ? '各 QUIC 流分别保证有序，某流缺口不会强制其他无依赖流等待相同字节。'
            : '按网络到达顺序推进，观察接收与交付之间的差别。';
  return { received, delivered, streams, message };
}
