export type HttpSlot = {
  id: number;
  phase: 'idle' | 'headers' | 'body';
  left: number;
  request: number | null;
};
export type HttpPool = {
  slots: HttpSlot[];
  waiting: number[];
  nextRequest: number;
  nextConn: number;
  dials: number;
  completed: number;
  message: string;
};
export const newHttpPool = (): HttpPool => ({
  slots: [],
  waiting: [],
  nextRequest: 1,
  nextConn: 1,
  dials: 0,
  completed: 0,
  message: '发起两个请求：先观察响应头返回后连接仍被响应体占用。',
});
function dispatch(s: HttpPool, max: number): HttpPool {
  const next = { ...s, slots: s.slots.map((x) => ({ ...x })), waiting: [...s.waiting] };
  while (next.waiting.length) {
    let slot = next.slots.find((x) => x.phase === 'idle');
    if (!slot) {
      if (next.slots.length >= max) break;
      slot = { id: next.nextConn++, phase: 'idle', left: 0, request: null };
      next.slots.push(slot);
      next.dials++;
    }
    slot.request = next.waiting.shift()!;
    slot.phase = 'headers';
    slot.left = 3;
  }
  return next;
}
export function httpPoolStep(
  s: HttpPool,
  max: number,
  event: 'request' | 'headers' | 'read' | 'abandon' | 'closeIdle',
  id?: number,
): HttpPool {
  if (event === 'request')
    return dispatch(
      {
        ...s,
        waiting: [...s.waiting, s.nextRequest],
        nextRequest: s.nextRequest + 1,
        message: '请求进入连接获取；没有空闲连接且达到总连接上限时等待。',
      },
      max,
    );
  if (event === 'closeIdle')
    return {
      ...s,
      slots: s.slots.filter((x) => x.phase !== 'idle'),
      message: '只关闭空闲连接；活跃响应体仍由调用方负责。',
    };
  const slot = s.slots.find((x) => x.id === id);
  if (!slot) return s;
  if (event === 'headers' && slot.phase === 'headers')
    return {
      ...s,
      slots: s.slots.map((x) => (x.id === id ? { ...x, phase: 'body' } : x)),
      message: '响应头已返回，Body 仍未读完；HTTP/1.1 连接还不能交给下一个请求。',
    };
  if (slot.phase !== 'body') return s;
  if (event === 'abandon')
    return dispatch(
      {
        ...s,
        slots: s.slots.filter((x) => x.id !== id),
        message: '提前关闭未读完的 Body；本模型丢弃该 HTTP/1.1 连接，等待请求需要重新拨号。',
      },
      max,
    );
  const finished = slot.left === 1;
  return dispatch(
    {
      ...s,
      completed: s.completed + (finished ? 1 : 0),
      slots: s.slots.map((x) =>
        x.id === id
          ? {
              ...x,
              left: x.left - 1,
              phase: finished ? 'idle' : 'body',
              request: finished ? null : x.request,
            }
          : x,
      ),
      message: finished
        ? '读到 EOF 并关闭 Body；连接可复用，等待请求取得连接。'
        : '读了一块响应体，尚未到 EOF。',
    },
    max,
  );
}
