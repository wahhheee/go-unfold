import { useState } from 'react';
import { ArrowRight, FlaskConical, RotateCcw } from 'lucide-react';
import { advanceSnapshot, initialSnapshot } from '../lib/snapshot-model';
import type { SnapshotMode, SnapshotRef } from '../lib/snapshot-model';
import { useLearning } from '../state/learning';

const actions = ['创建新版本', '修改草稿', '原子发布', '违规修改已发布对象'];
export function SnapshotLab() {
  const [state, setState] = useState(() => initialSnapshot('alias'));
  const [quota, setQuota] = useState(40);
  const { update } = useLearning();
  const describe = (ref: SnapshotRef | null) =>
    ref ? `v${ref.version} → ${ref.map} · 额度 ${state.maps[ref.map]}` : '尚未构造';
  return (
    <section className="framed-tool concept-lab" aria-label="原子快照与别名实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>原子快照与别名实验</strong>
        </div>
        <span className="live-label">{state.stage} / 4</span>
      </div>
      <div className="concept-controls">
        <label>
          复制方式
          <select
            value={state.mode}
            onChange={(event) => setState(initialSnapshot(event.target.value as SnapshotMode))}
          >
            <option value="alias">只复制外层结构体</option>
            <option value="clone">同时克隆内部 map</option>
          </select>
        </label>
        <label>
          下一次写入额度：{quota}
          <input
            type="range"
            min="1"
            max="100"
            value={quota}
            aria-label="下一次写入额度"
            onChange={(event) => setQuota(Number(event.target.value))}
          />
        </label>
        <button
          className="icon-button"
          title="重置快照"
          aria-label="重置快照"
          onClick={() => setState(initialSnapshot(state.mode))}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="scenario-stage">
        <h3>
          {
            ['保留旧读者', '草稿已构造', '草稿已修改', '新入口已发布', '发布后不再不可变'][
              state.stage
            ]
          }
        </h3>
        <div className="scenario-lanes">
          <div data-testid="snapshot-reader">
            <strong>旧读者</strong>
            <span>{describe(state.reader)}</span>
          </div>
          <div data-testid="snapshot-current">
            <strong>当前入口</strong>
            <span>{describe(state.current)}</span>
          </div>
          <div>
            <strong>{state.stage >= 3 ? '写者引用' : '待发草稿'}</strong>
            <span>{describe(state.draft)}</span>
          </div>
        </div>
      </div>
      <p className="concept-result" role="status">
        {state.message}
      </p>
      <div className="concept-controls">
        <button
          className="button small"
          disabled={state.stage === 4}
          onClick={() => {
            setState(advanceSnapshot(state, quota));
            update({ labRan: true });
          }}
        >
          {actions[state.stage] ?? '推演完成'}
          <ArrowRight size={15} />
        </button>
      </div>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          单个整数 map 元素与两代根对象的顺序身份模型，M1/M2
          表示是否共享同一份存储。它展示别名和发布点，不执行并发 map 访问，不模拟 CPU
          缓存，也不证明生产实现无竞态。真实 Go 示例单独验证原子发布和不可变读取。
        </p>
      </details>
    </section>
  );
}
