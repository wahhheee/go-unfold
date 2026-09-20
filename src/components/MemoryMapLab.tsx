import { useState } from 'react';
import { newVm, vmStep, vmStats } from '../lib/vm-model';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';
export function MemoryMapLab() {
  const [state, setState] = useState(() => newVm());
  const [process, setProcess] = useState<'parent' | 'child'>('parent');
  const [page, setPage] = useState(0);
  const { update } = useLearning();
  const stats = vmStats(state);
  function act(a: Parameters<typeof vmStep>[1]) {
    setState(vmStep(state, a, process, page));
    if (a === 'release') setProcess('parent');
    update({ labRan: true });
  }
  return (
    <NetworkLabShell
      title="虚拟页、驻留与写时复制实验"
      badge={`模型缺页 ${state.faults} 次`}
      message={state.message}
      assumptions="每页固定 4 KiB，只计算四个教学虚拟页对应的数据帧；首次操作为写入，省略读共享零页、页表、TLB、文件缓存、换出、预取、大页与分配器保留。RSS 数字是映射驻留量的概念演示，不是实际 Go 进程测量，也不表示缺页一定访问磁盘。"
    >
      <div className="concept-controls">
        <label>
          操作进程
          <select
            value={process}
            onChange={(e) => setProcess(e.target.value as 'parent' | 'child')}
          >
            <option value="parent">父进程</option>
            <option value="child" disabled={!state.child}>
              子进程
            </option>
          </select>
        </label>
        <label>
          虚拟页
          <select value={page} onChange={(e) => setPage(+e.target.value)}>
            {state.parent.map((_, i) => (
              <option value={i} key={i}>
                页 {i} · 偏移 {i * 4} KiB
              </option>
            ))}
          </select>
        </label>
      </div>
      <NetworkCells
        cells={[
          {
            title: '父 / 子驻留量',
            value: `${stats.parent} / ${stats.child} KiB`,
            detail: '共享帧可被两个 RSS 重复计入',
          },
          {
            title: '去重物理帧',
            value: `${stats.physical} KiB`,
            detail: `虚拟范围每进程 ${state.parent.length * 4} KiB`,
            active: true,
          },
        ]}
      />
      {(['parent', 'child'] as const).map((p) => (
        <div className="network-lane" key={p}>
          <h4>{p === 'parent' ? '父进程' : '子进程'}映射</h4>
          <div className="network-track">
            {state[p]?.map((id, i) => (
              <div key={i} className={`network-token ${id !== null ? 'is-active' : ''}`}>
                <strong>页 {i}</strong>
                <br />
                {id === null ? '未驻留' : `→ F${id}`}
                <br />
                <small>值 {id === null ? 0 : state.frames.find((f) => f.id === id)?.value}</small>
              </div>
            )) ?? '尚未创建'}
          </div>
        </div>
      ))}
      <div className="concept-controls">
        <button className="button small" onClick={() => act('write')}>
          写入所选页 +1
        </button>
        <button
          className="button small secondary"
          disabled={!!state.child}
          onClick={() => act('fork')}
        >
          派生子进程映射
        </button>
        <button
          className="button small secondary"
          disabled={!state.child}
          onClick={() => act('release')}
        >
          释放子进程映射
        </button>
        <button
          className="button small secondary"
          onClick={() => {
            setState(newVm());
            setProcess('parent');
            setPage(0);
          }}
        >
          重置虚拟内存
        </button>
      </div>
    </NetworkLabShell>
  );
}
