export type ProfileMetric = 'inuse_space' | 'alloc_space';
export function profileSample(metric: ProfileMetric, cacheRetention: number) {
  const retained = Math.min(100, Math.max(0, cacheRetention));
  return [
    { site: 'decodeBuffer', allocated: 1200, live: 12 },
    { site: 'sessionCache', allocated: 80, live: (80 * retained) / 100 },
    { site: 'workerState', allocated: 60, live: 10 },
  ]
    .map((row) => ({ ...row, value: metric === 'alloc_space' ? row.allocated : row.live }))
    .sort((a, b) => b.value - a.value);
}
