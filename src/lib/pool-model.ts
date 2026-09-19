export type PoolConfig = {
  workers: number;
  capacity: number;
  arrivals: number;
  policy: 'reject' | 'spawn';
};
type RunningJob = { id: number; remaining: number };
export type PoolState = {
  tick: number;
  mode: 'open' | 'draining' | 'aborted';
  running: (RunningJob | null)[];
  queue: number[];
  outside: number[];
  arrived: number;
  completed: number;
  rejected: number;
  canceled: number;
};
export const serviceTicks = 2;
export function initialPool(workers: number): PoolState {
  return {
    tick: 0,
    mode: 'open',
    running: Array.from({ length: workers }, () => null),
    queue: [],
    outside: [],
    arrived: 0,
    completed: 0,
    rejected: 0,
    canceled: 0,
  };
}
export function poolFinished(state: PoolState) {
  return (
    state.mode !== 'open' &&
    state.running.every((job) => !job) &&
    !state.queue.length &&
    !state.outside.length
  );
}
export function advancePool(state: PoolState, config: PoolConfig): PoolState {
  if (poolFinished(state)) return state;
  const next: PoolState = {
    ...state,
    tick: state.tick + 1,
    queue: [...state.queue],
    outside: [...state.outside],
    running: state.running.map((job) => (job ? { ...job, remaining: job.remaining - 1 } : null)),
  };
  for (let i = 0; i < next.running.length; i++) {
    if (next.running[i]?.remaining === 0) {
      next.completed++;
      next.running[i] = null;
    }
  }
  // 先接纳已经等待的任务，保持队列与外部提交者的先后关系。
  for (let i = 0; i < next.running.length; i++) {
    if (next.running[i]) continue;
    const id = next.queue.shift() ?? next.outside.shift();
    if (id !== undefined) next.running[i] = { id, remaining: serviceTicks };
  }
  while (next.outside.length && next.queue.length < config.capacity)
    next.queue.push(next.outside.shift()!);
  if (next.mode === 'open')
    for (let i = 0; i < config.arrivals; i++) {
      const id = ++next.arrived;
      const idle = next.running.findIndex((job) => job === null);
      if (idle !== -1) next.running[idle] = { id, remaining: serviceTicks };
      else if (next.queue.length < config.capacity) next.queue.push(id);
      else if (config.policy === 'spawn') next.outside.push(id);
      else next.rejected++;
    }
  return next;
}
export function stopPool(state: PoolState, mode: 'draining' | 'aborted'): PoolState {
  if (state.mode === 'aborted' || (state.mode === 'draining' && mode === 'draining')) return state;
  const next = { ...state, mode, outside: [], rejected: state.rejected + state.outside.length };
  if (mode === 'aborted')
    return {
      ...next,
      queue: [],
      running: state.running.map(() => null),
      canceled: state.canceled + state.queue.length + state.running.filter(Boolean).length,
    };
  return next;
}
