export type ProbeSlot = { key: string; h2: number } | { state: 'empty' | 'deleted' };
export const probeGroups: ProbeSlot[][] = [
  [
    { key: 'k17', h2: 37 },
    { key: 'k99', h2: 37 },
    { key: 'k8', h2: 12 },
    { key: 'k22', h2: 9 },
    { state: 'deleted' },
    { key: 'k54', h2: 63 },
    { key: 'k61', h2: 4 },
    { key: 'k78', h2: 81 },
  ],
  [
    { key: 'k42', h2: 37 },
    { key: 'k9', h2: 20 },
    { key: 'k13', h2: 45 },
    { state: 'empty' },
    { state: 'empty' },
    { state: 'empty' },
    { state: 'empty' },
    { state: 'empty' },
  ],
];
export const probeTargets = ['k17', 'k42', 'k77'] as const;
export type ProbeFrame = {
  group: number;
  candidates: number[];
  found: number | null;
  compared: boolean;
  reason: string;
};
export function probeFrames(key: string): ProbeFrame[] {
  if (!(probeTargets as readonly string[]).includes(key)) throw new Error('未定义的演示键');
  const frames: ProbeFrame[] = [];
  for (let group = 0; group < probeGroups.length; group++) {
    const slots = probeGroups[group];
    const candidates = slots.flatMap((slot, i) => ('key' in slot && slot.h2 === 37 ? [i] : []));
    frames.push({
      group,
      candidates,
      found: null,
      compared: false,
      reason: `组 ${group}：H2=37 筛出 ${candidates.length} 个候选，但还没有比较完整键。`,
    });
    const found = candidates.find((i) => 'key' in slots[i] && slots[i].key === key) ?? null;
    const hasEmpty = slots.some((slot) => 'state' in slot && slot.state === 'empty');
    frames.push({
      group,
      candidates,
      found,
      compared: true,
      reason:
        found !== null
          ? `完整键匹配 ${key}，查找成功。短哈希相同的其他键不是结果。`
          : hasEmpty
            ? '候选完整键均不匹配，且该组有 empty，查找结束：键不存在。'
            : '候选完整键均不匹配；deleted 不是 empty，必须继续探测下一组。',
    });
    if (found !== null || hasEmpty) break;
  }
  return frames;
}
