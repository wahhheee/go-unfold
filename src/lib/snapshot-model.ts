export type SnapshotMode = 'clone' | 'alias';
type MapId = 'M1' | 'M2';
export type SnapshotRef = { version: number; map: MapId };
export type SnapshotState = {
  mode: SnapshotMode;
  stage: number;
  maps: Record<MapId, number>;
  reader: SnapshotRef;
  current: SnapshotRef;
  draft: SnapshotRef | null;
  message: string;
};

export function initialSnapshot(mode: SnapshotMode): SnapshotState {
  return {
    mode,
    stage: 0,
    maps: { M1: 10, M2: 10 },
    reader: { version: 1, map: 'M1' },
    current: { version: 1, map: 'M1' },
    draft: null,
    message: '旧读者已持有 v1，额度为 10。它不会因为入口更新就自动换版本。',
  };
}

export function advanceSnapshot(state: SnapshotState, quota: number): SnapshotState {
  if (!Number.isInteger(quota) || quota < 1 || quota > 100)
    throw new Error('额度须为 1 至 100 的整数');
  if (state.stage === 0)
    return {
      ...state,
      stage: 1,
      draft: { version: 2, map: state.mode === 'clone' ? 'M2' : 'M1' },
      message:
        state.mode === 'clone'
          ? '新版本持有独立的 M2，旧读者继续持有 M1。'
          : '只复制外层结构体，新旧版本仍指向同一个 M1。',
    };
  if (state.stage === 1 && state.draft)
    return {
      ...state,
      stage: 2,
      maps: { ...state.maps, [state.draft.map]: quota },
      message:
        state.mode === 'clone'
          ? '草稿已修改，旧读者仍看到 10：修改尚未发布。'
          : '尚未发布，旧读者的数据已经随草稿变化。原子指针无法修复内部别名。',
    };
  if (state.stage === 2 && state.draft)
    return {
      ...state,
      stage: 3,
      current: state.draft,
      message:
        state.mode === 'clone'
          ? '入口原子切换到 v2，新读者取得新版本，旧读者保留完整的旧版本。'
          : '入口虽切换到 v2，旧读者的 v1 却已混入新额度。版本号不等于数据隔离。',
    };
  if (state.stage === 3)
    return {
      ...state,
      stage: 4,
      maps: { ...state.maps, [state.current.map]: quota },
      message:
        '发布后又修改了共享对象：已经持有它的读者也会看到变化。即使发布前克隆，发布后仍必须保持不可变。真实并发访问还可能产生数据竞争。',
    };
  return state;
}
