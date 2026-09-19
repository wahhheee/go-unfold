import { useState } from 'react';
import { ArrowRight, Ban, FlaskConical, RotateCcw } from 'lucide-react';
import { childStartsAt, contextBudget } from '../lib/context-budget';
import type { BudgetConfig, ContextMode } from '../lib/context-budget';
import { useLearning } from '../state/learning';

export function ContextBudgetLab() {
  const [config, setConfig] = useState<BudgetConfig>({
    mode: 'inherit',
    parentMs: 1000,
    childMs: 900,
  });
  const [now, setNow] = useState(childStartsAt);
  const [canceledAt, setCanceledAt] = useState<number | null>(null);
  const { update } = useLearning();
  const view = contextBudget(config, now, canceledAt);
  function reset(next = config) {
    setConfig(next);
    setNow(childStartsAt);
    setCanceledAt(null);
  }
  const message = view.child.ended
    ? `${view.child.ended.origin}，首次原因发生在 ${view.child.ended.at}ms。Context 已取消，不代表工作或清理已经结束。`
    : config.mode === 'detached'
      ? '子任务没有截止时间，Done 为 nil；父请求取消和到期都不会把它结束。'
      : `子任务剩余可用预算 ${view.child.remaining}ms。${config.mode === 'bounded' ? '这个预算独立于父请求，仍需有人管理任务完成。' : '给子任务更长的 timeout，也不能延长父请求截止时间。'}`;
  return (
    <section className="framed-tool concept-lab" aria-label="Context 预算与取消实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>Context 预算与取消实验</strong>
        </div>
        <span className="live-label">{now}ms</span>
      </div>
      <div className="concept-controls">
        <label>
          派生方式
          <select
            value={config.mode}
            onChange={(event) => reset({ ...config, mode: event.target.value as ContextMode })}
          >
            <option value="inherit">继承父请求 + 子预算</option>
            <option value="detached">仅 WithoutCancel</option>
            <option value="bounded">脱离后重新限时</option>
          </select>
        </label>
        <label>
          父预算：{config.parentMs}ms
          <input
            aria-label="父请求预算"
            type="range"
            min="500"
            max="2000"
            step="100"
            value={config.parentMs}
            onChange={(event) => reset({ ...config, parentMs: Number(event.target.value) })}
          />
        </label>
        <label>
          子预算：{config.childMs}ms
          <input
            aria-label="子任务预算"
            type="range"
            min="100"
            max="2000"
            step="100"
            disabled={config.mode === 'detached'}
            value={config.childMs}
            onChange={(event) => reset({ ...config, childMs: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="context-branches">
        {(
          [
            ['父请求', view.parent],
            ['子任务', view.child],
          ] as const
        ).map(([name, state]) => (
          <div
            className="context-branch"
            key={name}
            data-testid={name === '父请求' ? 'context-parent' : 'context-child'}
          >
            <h3>{name}</h3>
            <dl>
              <dt>截止时刻</dt>
              <dd>{state.deadline === null ? '无' : `${state.deadline}ms`}</dd>
              <dt>可用预算</dt>
              <dd>{state.remaining === null ? '未设置' : `${state.remaining}ms`}</dd>
              <dt>Done</dt>
              <dd>{state.done}</dd>
              <dt>Err()</dt>
              <dd>
                <code>{state.error}</code>
              </dd>
              <dt>Cause()</dt>
              <dd>
                <code>{state.cause}</code>
              </dd>
            </dl>
          </div>
        ))}
      </div>
      <div className="concept-controls">
        <button
          className="button small"
          disabled={now >= 2500}
          onClick={() => {
            setNow(now + 100);
            update({ labRan: true });
          }}
        >
          推进 100ms
          <ArrowRight size={15} />
        </button>
        <button
          className="button small secondary"
          disabled={!!view.parent.ended}
          onClick={() => {
            setCanceledAt(now);
            update({ labRan: true });
          }}
        >
          <Ban size={15} />
          取消父请求
        </button>
        <button
          className="icon-button"
          title="重置时间"
          aria-label="重置时间"
          onClick={() => reset()}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <p className="concept-result" role="status">
        {message}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          父请求从 0ms 开始，子任务固定在 300ms
          创建。时间由按钮推进；配置改变会重置本次执行。主动取消使用 WithCancelCause
          的自定义原因。模型把截止与取消传播视为即时事件，不模拟定时器调度延迟、网络时钟和任务清理，也不把
          Context 状态当成工作已退出。
        </p>
      </details>
    </section>
  );
}
