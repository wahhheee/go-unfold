export type PublicationMode = 'close' | 'atomic' | 'sleep' | 'late';
type Event = 'write' | 'publish' | 'observe' | 'read';
export function publicationOrder(mode: PublicationMode) {
  const reader: Event[] = mode === 'late' ? ['read', 'observe'] : ['observe', 'read'];
  const edges: [Event, Event][] = [
    ['write', 'publish'],
    [reader[0], reader[1]],
  ];
  if (mode !== 'sleep') edges.push(['publish', 'observe']);
  const reached = new Set<Event>(['write']);
  for (let i = 0; i < 4; i++)
    for (const [from, to] of edges) if (reached.has(from)) reached.add(to);
  const labels: Record<Event, string> = {
    write: 'W：data = 42',
    publish: mode === 'atomic' ? 'P：ready.Store(true)' : 'P：close(done)',
    observe:
      mode === 'atomic'
        ? 'O：Load 观察到 true'
        : mode === 'sleep'
          ? 'O：Sleep 返回'
          : 'O：接收观察到关闭',
    read: 'R：读取 data',
  };
  return {
    writer: ['write', 'publish'].map((event) => labels[event as Event]),
    reader: reader.map((event) => labels[event]),
    synchronized: mode !== 'sleep',
    ordered: reached.has('read'),
    note:
      mode === 'late'
        ? '同步发生得太晚：W 到 O 有路径，但不能倒着走到 R。提前读取仍然存在竞态。'
        : mode === 'sleep'
          ? 'Sleep 不建立跨 goroutine 的同步边。看起来等够了时间，仍不能证明读取有序。'
          : 'W → P → O → R 建立顺序。这里 data 只写一次，发布之后也不再修改。',
  };
}
