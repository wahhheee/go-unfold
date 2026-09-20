import { useState } from 'react';
import { fdStep, newFd } from '../lib/fd-model';
import type { Descriptor } from '../lib/fd-model';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';
export function DescriptorLab() {
  const [state, setState] = useState(newFd);
  const [process, setProcess] = useState<Descriptor['process']>('父进程');
  const [fd, setFd] = useState(3);
  const { update } = useLearning();
  const entries = state.fds.filter((x) => x.process === process);
  const current = entries.some((x) => x.fd === fd) ? fd : (entries[0]?.fd ?? -1);
  function act(a: Parameters<typeof fdStep>[1]) {
    setState(fdStep(state, a, process, current));
    update({ labRan: true });
  }
  return (
    <NetworkLabShell
      title="进程描述符与共享偏移实验"
      badge={`${state.fds.length} 个引用`}
      message={state.message}
      assumptions="Linux 风格普通文件，预留 0/1/2；每次读取最多两字节，不模拟并发系统调用、文件状态标志、CLOEXEC、权限、文件锁或 socket 的半关闭。fork 只演示描述符表复制与共享引用，不代表 Go 中可以安全直接调用裸 fork。"
    >
      <div className="concept-controls">
        <label>
          操作进程
          <select
            value={process}
            onChange={(e) => setProcess(e.target.value as Descriptor['process'])}
          >
            <option>父进程</option>
            <option disabled={!state.forked}>子进程</option>
          </select>
        </label>
        <label>
          操作描述符
          <select value={current} onChange={(e) => setFd(+e.target.value)}>
            {entries.length ? (
              entries.map((x) => (
                <option key={x.fd} value={x.fd}>
                  fd {x.fd} → O{x.description}
                </option>
              ))
            ) : (
              <option value="-1">没有打开的描述符</option>
            )}
          </select>
        </label>
      </div>
      <div className="network-cells">
        {(['父进程', '子进程'] as const).map((p) => (
          <div className="network-cell" key={p}>
            <span>{p}的描述符表</span>
            {p === '子进程' && !state.forked ? (
              <strong>尚未创建</strong>
            ) : (
              state.fds
                .filter((x) => x.process === p)
                .map((x) => (
                  <strong key={x.fd}>
                    fd {x.fd} → O{x.description}
                  </strong>
                ))
            )}
          </div>
        ))}
      </div>
      <NetworkCells
        cells={state.descriptions.map((d) => ({
          title: `打开文件描述 O${d.id}`,
          value: `偏移 ${d.offset} / 8`,
          detail: `${state.fds.filter((x) => x.description === d.id).length} 个引用 · 下次 ${'ABCDEFGH'.slice(d.offset, d.offset + 2) || 'EOF'}`,
          active: state.fds.some(
            (x) => x.process === process && x.fd === current && x.description === d.id,
          ),
        }))}
      />
      <div className="concept-controls">
        <button className="button small" disabled={current < 0} onClick={() => act('read')}>
          读取两字节
        </button>
        <button
          className="button small secondary"
          disabled={current < 0 || entries.length >= 6}
          onClick={() => act('dup')}
        >
          复制描述符 dup
        </button>
        <button
          className="button small secondary"
          disabled={entries.length >= 6}
          onClick={() => act('open')}
        >
          重新 open 文件
        </button>
        <button
          className="button small secondary"
          disabled={state.forked}
          onClick={() => act('fork')}
        >
          创建子进程视图
        </button>
        <button
          className="button small secondary"
          disabled={current < 0}
          onClick={() => act('close')}
        >
          关闭所选描述符
        </button>
        <button
          className="button small secondary"
          onClick={() => {
            setState(newFd());
            setProcess('父进程');
            setFd(3);
          }}
        >
          重置描述符
        </button>
      </div>
    </NetworkLabShell>
  );
}
