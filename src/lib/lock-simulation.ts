export type LockConfig = {
  ttl: number;
  work: number;
  renew: boolean;
  pause: boolean;
  safeUnlock: boolean;
  fencing: boolean;
};
export const defaultConfig: LockConfig = {
  ttl: 5,
  work: 9,
  renew: false,
  pause: true,
  safeUnlock: true,
  fencing: false,
};
export type LockEvent = {
  time: number;
  actor: 'A' | 'B' | 'Redis';
  kind: 'acquire' | 'expire' | 'renew' | 'write' | 'reject' | 'release' | 'blocked' | 'pause';
  text: string;
  owner: 'A' | 'B' | null;
  lastWriter: 'A' | 'B' | null;
  highestFence: number;
};
export type Simulation = {
  events: LockEvent[];
  duration: number;
  overlap: boolean;
  staleWrite: boolean;
  wrongUnlock: boolean;
  bAcquired: boolean;
};

export function parseConfig(raw: string): LockConfig {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('JSON 格式有误，请检查引号、逗号和括号。');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('配置必须是一个 JSON 对象。');
  const config = value as Record<string, unknown>;
  const allowed = Object.keys(defaultConfig);
  if (Object.keys(config).some((key) => !allowed.includes(key)))
    throw new Error('配置包含未知字段，仅支持 ttl、work、renew、pause、safeUnlock、fencing。');
  for (const [key, min, max] of [
    ['ttl', 2, 10],
    ['work', 3, 14],
  ] as const) {
    if (
      typeof config[key] !== 'number' ||
      !Number.isInteger(config[key]) ||
      config[key] < min ||
      config[key] > max
    )
      throw new Error(`${key} 必须是 ${min} 到 ${max} 之间的整数（秒）。`);
  }
  for (const key of ['renew', 'pause', 'safeUnlock', 'fencing']) {
    if (typeof config[key] !== 'boolean') throw new Error(`${key} 必须为 true 或 false。`);
  }
  return config as LockConfig;
}

export function simulateLock(config: LockConfig): Simulation {
  const { ttl, work, renew, pause, safeUnlock, fencing } = parseConfig(JSON.stringify(config));
  type Scheduled = { time: number; task: string; expiry?: number };
  const queue: Scheduled[] = [
    { time: 0, task: 'acquireA' },
    { time: work, task: 'writeA' },
    { time: work + 0.2, task: 'releaseA' },
    { time: ttl + 1, task: 'acquireB' },
  ];
  if (pause) queue.push({ time: 1, task: 'pause' });
  if (renew)
    for (let time = ttl * 0.6; time < work; time += ttl * 0.6) queue.push({ time, task: 'renew' });
  let owner: 'A' | 'B' | null = null;
  let expires = 0;
  let lastWriter: 'A' | 'B' | null = null;
  let highestFence = 0;
  let overlap = false;
  let staleWrite = false;
  let wrongUnlock = false;
  let bAcquired = false;
  const events: LockEvent[] = [];
  function record(time: number, actor: LockEvent['actor'], kind: LockEvent['kind'], text: string) {
    events.push({
      time: Math.round(time * 100) / 100,
      actor,
      kind,
      text,
      owner,
      lastWriter,
      highestFence,
    });
  }
  function expireAt(time: number) {
    expires = time;
    queue.push({ time, task: 'expire', expiry: time });
  }
  while (queue.length) {
    // 相同时刻先处理到期，使边界与租约的有效区间一致。
    queue.sort(
      (a, b) => a.time - b.time || Number(b.task === 'expire') - Number(a.task === 'expire'),
    );
    const event = queue.shift()!;
    const { time, task } = event;
    if (task === 'acquireA') {
      owner = 'A';
      expireAt(time + ttl);
      record(time, 'A', 'acquire', 'A 获得租约，所有权 token=a，fence=41。');
    } else if (task === 'pause') {
      record(time, 'A', 'pause', 'A 发生长暂停，业务与续租线程一起停下。');
    } else if (task === 'renew') {
      if (pause) continue;
      if (owner === 'A') {
        expireAt(time + ttl);
        record(time, 'A', 'renew', '原子校验 token=a 后续租成功。');
      }
    } else if (task === 'expire') {
      if (!owner || expires !== event.expiry) continue;
      const expiredOwner = owner;
      owner = null;
      record(time, 'Redis', 'expire', `${expiredOwner} 的租约到期。Redis 不会替你停止业务代码。`);
    } else if (task === 'acquireB') {
      if (owner) {
        record(time, 'B', 'blocked', 'B 尝试加锁失败，本次请求不再重试。');
      } else {
        owner = 'B';
        bAcquired = true;
        expireAt(time + ttl);
        overlap = time < work;
        record(time, 'B', 'acquire', 'B 获得新租约，所有权 token=b，fence=42。');
        queue.push({ time: time + 0.5, task: 'writeB' }, { time: time + 4, task: 'releaseB' });
      }
    } else if (task === 'writeA' || task === 'writeB') {
      const actor = task === 'writeA' ? 'A' : 'B';
      const fence = actor === 'A' ? 41 : 42;
      if (fencing && fence < highestFence) {
        record(
          time,
          actor,
          'reject',
          `资源已接受 fence=${highestFence}，拒绝 ${actor} 的旧写入（fence=${fence}）。`,
        );
      } else {
        const expiredHolder = actor === 'A' && owner !== 'A';
        if (expiredHolder) staleWrite = true;
        lastWriter = actor;
        highestFence = Math.max(highestFence, fence);
        record(
          time,
          actor,
          'write',
          `${actor} 写入成功${expiredHolder ? '：过期持有者仍然产生了副作用！' : '。'}`,
        );
      }
    } else if (task === 'releaseA' || task === 'releaseB') {
      const actor = task === 'releaseA' ? 'A' : 'B';
      if (safeUnlock && owner !== actor) {
        record(time, actor, 'blocked', `${actor} 的 token 不匹配，解锁脚本没有删除任何锁。`);
      } else {
        if (owner && owner !== actor) wrongUnlock = true;
        const wrong = owner && owner !== actor;
        owner = null;
        record(
          time,
          actor,
          'release',
          `${actor} ${safeUnlock ? '校验 token 后' : '直接 DEL'}解锁${wrong ? '，误删了 B 的租约！' : '。'}`,
        );
      }
    }
  }
  return {
    events,
    duration: Math.max(...events.map((event) => event.time)),
    overlap,
    staleWrite,
    wrongUnlock,
    bAcquired,
  };
}
