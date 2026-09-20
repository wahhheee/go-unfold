import { useState } from 'react';
import { defaultRequestBudget, requestView } from '../lib/request-budget';
import type { RequestBudget } from '../lib/request-budget';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';
export function RequestBudgetLab() {
  const [config, setConfig] = useState({ ...defaultRequestBudget });
  const [now, setNow] = useState(0);
  const { update } = useLearning();
  const view = requestView(config, now);
  function change(p: Partial<RequestBudget>) {
    setConfig({ ...config, ...p });
    setNow(0);
  }
  return (
    <NetworkLabShell
      title="请求阶段、预算与结果未知实验"
      badge={`${now} ms`}
      message={view.message}
      assumptions="单次请求、固定串行阶段，无重定向、代理、并行拨号或重试；请求发送时间并入处理阶段起点，服务端在处理阶段一半处提交，业务确认放在完整响应体中。所有时长都是教学输入，不是基准；到期与完成同刻时模型优先超时。服务端真相仅供教学观察，真实客户端看不到它；超时后的服务器演化未模拟。"
    >
      <div className="concept-controls">
        <label>
          预算范围
          <select
            value={config.scope}
            onChange={(e) => change({ scope: e.target.value as RequestBudget['scope'] })}
          >
            <option value="total">整个请求，包括响应体</option>
            <option value="headers">仅等待响应头</option>
          </select>
        </label>
        <label>
          预算毫秒
          <select value={config.budget} onChange={(e) => change({ budget: +e.target.value })}>
            {[100, 300, 500, 1000].map((n) => (
              <option key={n} value={n}>
                {n} ms
              </option>
            ))}
          </select>
        </label>
        <label>
          变慢的阶段
          <select
            value={config.slow}
            onChange={(e) => change({ slow: e.target.value as RequestBudget['slow'] })}
          >
            <option value="dns">DNS ×3</option>
            <option value="connect">建连 ×3</option>
            <option value="tls">握手 ×3</option>
            <option value="server">处理 ×3</option>
            <option value="body">响应体 ×3</option>
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={config.reused}
            onChange={(e) => change({ reused: e.target.checked })}
          />
          复用已有连接
        </label>
      </div>
      <div className="request-timeline" aria-label="各阶段耗时与进度">
        {view.phases.map((p) => {
          const skipped = p.duration === 0;
          const progress = skipped ? 0 : Math.max(0, Math.min(1, (now - p.start) / p.duration));
          return (
            <div className="request-phase" key={p.id}>
              <div>
                <strong>{p.name}</strong>
                <span>
                  {skipped
                    ? '复用时跳过'
                    : `${p.start}–${p.end} ms · ${now >= p.end ? '完成' : now >= p.start ? '进行中' : '未开始'}`}
                </span>
              </div>
              <div className="request-phase-track">
                <span style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <NetworkCells
        cells={[
          { title: '客户端能下的结论', value: view.client, active: view.timeout },
          {
            title: '服务端真相 · 全知模型',
            value: view.committed ? '已提交' : '此时尚未提交',
            detail: `设定的提交时刻 ${view.commitAt} ms`,
          },
          {
            title: '本次计时截止点',
            value: Number.isFinite(view.deadline) ? `${view.deadline} ms` : '响应头后无总上限',
            detail: `无超时时完整结果在 ${view.total} ms 到达`,
          },
        ]}
      />
      <div className="concept-controls">
        <button
          className="button small"
          disabled={now >= view.stop}
          onClick={() => {
            setNow(view.next);
            update({ labRan: true });
          }}
        >
          推进到下一事件
        </button>
        <button
          className="button small secondary"
          disabled={now >= view.stop}
          onClick={() => {
            setNow(view.stop);
            update({ labRan: true });
          }}
        >
          运行到本次结束
        </button>
        <button className="button small secondary" onClick={() => setNow(0)}>
          重放当前配置
        </button>
        <button
          className="button small secondary"
          onClick={() => {
            setConfig({ ...defaultRequestBudget });
            setNow(0);
          }}
        >
          恢复默认预算
        </button>
      </div>
    </NetworkLabShell>
  );
}
