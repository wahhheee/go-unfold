export type DnsState = {
  now: number;
  authority: string;
  cache: { address: string; expires: number } | null;
  connection: string | null;
  queries: number;
  path: string[];
  message: string;
};
export const newDnsState = (): DnsState => ({
  now: 0,
  authority: '192.0.2.10',
  cache: null,
  connection: null,
  queries: 0,
  path: [],
  message: '先发起请求，建立缓存与连接，再切换权威地址。',
});
export type DnsEvent = 'request' | 'switch' | 'tick' | 'close';
export function dnsStep(state: DnsState, event: DnsEvent, ttl: number): DnsState {
  if (event === 'tick')
    return {
      ...state,
      now: state.now + 10,
      path: [],
      message: '时间前进 10 秒。TTL 到期使缓存不可用于新解析，但不会关闭已有连接。',
    };
  if (event === 'switch')
    return {
      ...state,
      authority: state.authority === '192.0.2.10' ? '192.0.2.20' : '192.0.2.10',
      path: ['权威 DNS'],
      message: '权威记录已切换；已缓存的记录与已建立的连接都不会被主动推送更新。',
    };
  if (event === 'close')
    return {
      ...state,
      connection: null,
      path: [],
      message: '关闭实验中的空闲连接；下一次请求需要重新选择地址。缓存仍可能有效。',
    };
  if (state.connection)
    return {
      ...state,
      path: ['应用', '已有连接', state.connection],
      message: `复用连接，仍访问 ${state.connection}；本次没有触发 DNS 查询。`,
    };
  const hit = state.cache !== null && state.now < state.cache.expires;
  const address = hit ? state.cache!.address : state.authority;
  return {
    ...state,
    connection: address,
    cache: hit ? state.cache : { address, expires: state.now + ttl },
    queries: state.queries + (hit ? 0 : 1),
    path: hit ? ['应用', '递归缓存', address] : ['应用', '递归解析器', '权威 DNS', address],
    message: `${hit ? '缓存命中' : '查询权威并缓存'}，新建连接到 ${address}。`,
  };
}
