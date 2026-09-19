export function gcBudget(live: number, roots: number, gogc: number, allocationRate: number) {
  if (
    ![live, roots, gogc, allocationRate].every(Number.isFinite) ||
    live <= 0 ||
    roots < 0 ||
    gogc <= 0 ||
    allocationRate < 0
  )
    throw new Error('GC 模型参数无效');
  const headroom = ((live + roots) * gogc) / 100;
  return { headroom, goal: live + headroom, cyclesPerSecond: allocationRate / headroom };
}
