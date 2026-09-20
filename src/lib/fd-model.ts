export type Descriptor = { process: '父进程' | '子进程'; fd: number; description: number };
export type FdState = {
  fds: Descriptor[];
  descriptions: { id: number; offset: number }[];
  next: number;
  forked: boolean;
  message: string;
};
export const newFd = (): FdState => ({
  fds: [{ process: '父进程', fd: 3, description: 1 }],
  descriptions: [{ id: 1, offset: 0 }],
  next: 2,
  forked: false,
  message: '父进程 fd 3 引用打开文件描述 O1；文件内容为 ABCDEFGH。',
});
export function fdStep(
  s: FdState,
  action: 'open' | 'dup' | 'fork' | 'read' | 'close',
  process: Descriptor['process'],
  fd: number,
): FdState {
  const selected = s.fds.find((x) => x.process === process && x.fd === fd);
  const nextFd = () => {
    let n = 3;
    while (s.fds.some((x) => x.process === process && x.fd === n)) n++;
    return n;
  };
  if (process === '子进程' && !s.forked) return s;
  if (action === 'fork')
    return s.forked
      ? s
      : {
          ...s,
          forked: true,
          fds: [
            ...s.fds,
            ...s.fds
              .filter((x) => x.process === '父进程')
              .map((x) => ({ ...x, process: '子进程' as const })),
          ],
          message: '子进程得到独立的描述符表，表项仍引用相同的打开文件描述，偏移继续共享。',
        };
  if (action === 'open')
    return {
      ...s,
      fds: [...s.fds, { process, fd: nextFd(), description: s.next }],
      descriptions: [...s.descriptions, { id: s.next, offset: 0 }],
      next: s.next + 1,
      message: '重新 open 同一个路径：创建新的打开文件描述，读取偏移独立，从 0 开始。',
    };
  if (!selected) return { ...s, message: '这个描述符已关闭，请选择一个仍存在的表项。' };
  if (action === 'dup')
    return {
      ...s,
      fds: [...s.fds, { ...selected, fd: nextFd() }],
      message: `dup 新增引用，仍指向 O${selected.description}；它不复制读取偏移。`,
    };
  if (action === 'close') {
    const fds = s.fds.filter((x) => x !== selected);
    return {
      ...s,
      fds,
      descriptions: s.descriptions.filter((d) => fds.some((x) => x.description === d.id)),
      message: `关闭 ${process} fd ${fd}；其他引用仍可使用，整数编号以后可以被重新分配。`,
    };
  }
  const d = s.descriptions.find((x) => x.id === selected.description)!;
  const content = 'ABCDEFGH'.slice(d.offset, d.offset + 2);
  return {
    ...s,
    descriptions: s.descriptions.map((x) =>
      x.id === d.id ? { ...x, offset: Math.min(8, x.offset + 2) } : x,
    ),
    message: `${process} fd ${fd} 读到 ${content || 'EOF'}；所有指向 O${d.id} 的引用观察到同一偏移 ${Math.min(8, d.offset + 2)}。`,
  };
}
