export type VmState = {
  parent: (number | null)[];
  child: (number | null)[] | null;
  frames: { id: number; value: number }[];
  next: number;
  faults: number;
  message: string;
};
export const newVm = (pages = 4): VmState => ({
  parent: Array(pages).fill(null),
  child: null,
  frames: [],
  next: 1,
  faults: 0,
  message: '已保留虚拟页范围；尚未触碰，不为这些页分配私有物理帧。',
});
export function vmStats(s: VmState) {
  return {
    parent: s.parent.filter((x) => x !== null).length * 4,
    child: (s.child?.filter((x) => x !== null).length ?? 0) * 4,
    physical: s.frames.length * 4,
  };
}
export function vmStep(
  s: VmState,
  action: 'fork' | 'release' | 'write',
  process: 'parent' | 'child',
  page: number,
): VmState {
  if (action === 'fork')
    return s.child
      ? s
      : {
          ...s,
          child: [...s.parent],
          message: '复制虚拟映射；已有物理帧暂时共享，首次写入共享页才需要私有副本。',
        };
  if (action === 'release') {
    const frames = s.frames.filter((f) => s.parent.includes(f.id));
    return {
      ...s,
      child: null,
      frames,
      message: '子进程映射已释放；仅被子进程引用的帧被回收，父进程数据仍在。',
    };
  }
  const mapping = s[process];
  if (!mapping || page < 0 || page >= mapping.length) return s;
  const current = mapping[page];
  const other = process === 'parent' ? s.child : s.parent;
  const shared = current !== null && !!other?.includes(current);
  if (current === null || shared) {
    const id = s.next;
    const nextMapping = [...mapping];
    nextMapping[page] = id;
    const old = current === null ? 0 : s.frames.find((f) => f.id === current)!.value;
    return {
      ...s,
      [process]: nextMapping,
      frames: [...s.frames, { id, value: old + 1 }],
      next: id + 1,
      faults: s.faults + 1,
      message:
        current === null
          ? `首次写入虚拟页 ${page}：缺页处理分配 F${id}，写入值 1。`
          : `写时复制：共享 F${current} 的内容复制到 F${id} 后再修改；另一进程仍保留旧值。`,
    };
  }
  return {
    ...s,
    frames: s.frames.map((f) => (f.id === current ? { ...f, value: f.value + 1 } : f)),
    message: `F${current} 已是私有页，直接修改，不需要新的物理帧。`,
  };
}
