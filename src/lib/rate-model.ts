export type BucketConfig = { rate: number; burst: number };
export type BucketState = {
  ms: number;
  tokens: number;
  allowed: number;
  rejected: number;
  last: 'ready' | 'allowed' | 'rejected';
};
export function initialBucket(config: BucketConfig): BucketState {
  return { ms: 0, tokens: config.burst, allowed: 0, rejected: 0, last: 'ready' };
}
export function refillBucket(state: BucketState, config: BucketConfig, ms: number): BucketState {
  if (!Number.isFinite(ms) || ms < 0) throw new Error('时间只能向前推进');
  return {
    ...state,
    ms: state.ms + ms,
    tokens: Math.min(config.burst, state.tokens + (config.rate * ms) / 1000),
    last: 'ready',
  };
}
export function requestTokens(
  state: BucketState,
  config: BucketConfig,
  count: number,
): BucketState {
  if (!Number.isInteger(count) || count < 1) throw new Error('申请量必须为正整数');
  if (count > config.burst || count > state.tokens)
    return { ...state, rejected: state.rejected + 1, last: 'rejected' };
  return { ...state, tokens: state.tokens - count, allowed: state.allowed + 1, last: 'allowed' };
}
