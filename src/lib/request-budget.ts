export type RequestBudget = {
  reused: boolean;
  scope: 'total' | 'headers';
  budget: number;
  slow: 'dns' | 'connect' | 'tls' | 'server' | 'body';
};
export const defaultRequestBudget: RequestBudget = {
  reused: false,
  scope: 'total',
  budget: 500,
  slow: 'body',
};
export function requestTimeline(c: RequestBudget) {
  const definitions = [
    { id: 'queue', name: '等连接额度', duration: 40 },
    { id: 'dns', name: 'DNS 解析', duration: 30 },
    { id: 'connect', name: 'TCP 建连', duration: 50 },
    { id: 'tls', name: 'TLS 握手', duration: 70 },
    { id: 'server', name: '请求处理 → 响应头', duration: 120 },
    { id: 'body', name: '响应体读取', duration: 180 },
  ];
  let at = 0;
  const phases = definitions.map((p) => {
    const duration =
      c.reused && ['dns', 'connect', 'tls'].includes(p.id)
        ? 0
        : p.duration * (c.slow === p.id ? 3 : 1);
    const start = at;
    at += duration;
    return { ...p, start, end: at, duration };
  });
  const server = phases.find((p) => p.id === 'server')!;
  const commitAt = server.start + server.duration / 2;
  const deadline =
    c.scope === 'total'
      ? c.budget
      : server.duration >= c.budget
        ? server.start + c.budget
        : Infinity;
  const stop = Math.min(at, deadline);
  const milestones = [...new Set([...phases.map((p) => p.end), commitAt, stop])]
    .filter((t) => t > 0 && t <= stop)
    .sort((a, b) => a - b);
  return { phases, total: at, deadline, stop, commitAt, sentAt: server.start, milestones };
}
export function requestView(c: RequestBudget, now: number) {
  const t = requestTimeline(c);
  const timeout = now >= t.deadline;
  const complete = now >= t.total && !timeout;
  const committed = now >= t.commitAt;
  const sent = now >= t.sentAt;
  const client = complete
    ? '收到完整成功结果'
    : timeout
      ? sent
        ? '结果未知'
        : '本次尚未发出请求'
      : '仍在等待';
  const message = complete
    ? '本次收到了完整业务结果。实验给出的服务端提交和客户端确认终于对齐。'
    : timeout
      ? sent
        ? '客户端等待已到期，但不能用超时推导服务端回滚。先按结果未知处理，再决定查询或幂等重试。'
        : '预算在请求发出前用完。这个单次、无先前尝试的模型还没有触发业务副作用。'
      : c.scope === 'headers' && now >= t.phases[4].end
        ? '响应头已到；只设置响应头超时不会限制后面的响应体读取。'
        : '推进到下一个阶段边界，或服务端提交时刻，比较双方看到的事实。';
  return {
    ...t,
    timeout,
    complete,
    committed,
    client,
    message,
    next: t.milestones.find((x) => x > now) ?? now,
  };
}
