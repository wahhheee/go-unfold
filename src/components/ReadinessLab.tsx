import { useState } from 'react';
import { newReadiness, readinessStep } from '../lib/readiness-model';
import type { PollMode } from '../lib/readiness-model';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';
export function ReadinessLab() {
  const [mode, setMode] = useState<PollMode>('et');
  const [state, setState] = useState(newReadiness);
  const { update } = useLearning();
  function act(a: Parameters<typeof readinessStep>[1]) {
    setState(readinessStep(state, a, mode));
    update({ labRan: true });
  }
  return (
    <NetworkLabShell
      title="就绪通知与缓冲排空实验"
      badge={mode === 'et' ? '边缘触发 ET' : '水平触发 LT'}
      message={state.message}
      assumptions="一个非阻塞字节流、一个读取者；每批到达/写方向关闭产生一个可合并的边缘通知，等待按钮立即观察，不在浏览器里阻塞。省略并发读者、错误、ONESHOT、重注册与不同设备差异；ET 不承诺每个包一次通知，也不等于所有 Linux 场景都只在空变非空时触发。"
    >
      <div className="concept-controls">
        <label>
          通知方式
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as PollMode);
              setState(newReadiness());
            }}
          >
            <option value="et">ET · 观察变化通知</option>
            <option value="lt">LT · 观察当前就绪</option>
          </select>
        </label>
      </div>
      <NetworkCells
        cells={[
          {
            title: '内核缓冲',
            value: `${state.buffer.length} 字节`,
            detail: state.eof ? '对端已关闭写方向' : '写方向仍打开',
            active: state.buffer.length > 0,
          },
          { title: '最近一次取事件', value: state.notice, detail: '通知不会消耗缓冲里的字节' },
          { title: '应用累计读入', value: `${state.read} 字节`, detail: 'Read 才发生实际读取' },
        ]}
      />
      <div className="network-lane">
        <h4>内核 → 应用 · 剩余字节</h4>
        <div className="network-track">
          {state.buffer.length ? (
            state.buffer.map((n) => (
              <span className="network-token is-active" key={n}>
                B{n}
              </span>
            ))
          ) : (
            <span>
              {state.eof ? '缓冲空；下一次 Read 返回 EOF' : '缓冲空；下一次非阻塞 Read 返回 EAGAIN'}
            </span>
          )}
        </div>
      </div>
      <div className="concept-controls">
        <button
          className="button small"
          disabled={state.eof || state.buffer.length > 4}
          onClick={() => act('arrive')}
        >
          到达四字节
        </button>
        <button className="button small secondary" onClick={() => act('wait')}>
          取一次就绪事件
        </button>
        <button className="button small secondary" onClick={() => act('read')}>
          只读两字节
        </button>
        <button className="button small secondary" onClick={() => act('drain')}>
          读到 EAGAIN 或 EOF
        </button>
        <button className="button small secondary" disabled={state.eof} onClick={() => act('eof')}>
          对端关闭写方向
        </button>
        <button className="button small secondary" onClick={() => setState(newReadiness())}>
          重置就绪实验
        </button>
      </div>
    </NetworkLabShell>
  );
}
