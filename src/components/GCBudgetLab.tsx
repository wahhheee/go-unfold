import { useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { gcBudget } from '../lib/gc-budget';
import { useLearning } from '../state/learning';
export function GCBudgetLab() {
  const [live, setLive] = useState(8),
    [roots, setRoots] = useState(2),
    [gogc, setGogc] = useState(100),
    [rate, setRate] = useState(20);
  const { update } = useLearning();
  const model = gcBudget(live, roots, gogc, rate);
  function change(setter: (value: number) => void, value: string, min: number, max: number) {
    setter(Math.min(max, Math.max(min, Number(value))));
    update({ labRan: true });
  }
  return (
    <section className="framed-tool concept-lab" aria-label="GC 堆目标实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>GC 堆目标实验</strong>
        </div>
        <button
          className="icon-button"
          aria-label="重置 GC 参数"
          title="重置 GC 参数"
          onClick={() => {
            setLive(8);
            setRoots(2);
            setGogc(100);
            setRate(20);
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="gc-controls">
        <label>
          存活堆（MiB）
          <input
            type="number"
            aria-label="存活堆 MiB"
            min="1"
            max="512"
            value={live}
            onChange={(e) => change(setLive, e.target.value, 1, 512)}
          />
        </label>
        <label>
          根扫描量（MiB）
          <input
            type="number"
            aria-label="根扫描量 MiB"
            min="0"
            max="128"
            value={roots}
            onChange={(e) => change(setRoots, e.target.value, 0, 128)}
          />
        </label>
        <label>
          分配速率（MiB/s）
          <input
            type="number"
            aria-label="分配速率 MiB 每秒"
            min="0"
            max="1024"
            value={rate}
            onChange={(e) => change(setRate, e.target.value, 0, 1024)}
          />
        </label>
        <label className="gc-slider">
          GOGC <strong>{gogc}</strong>
          <input
            aria-label="GOGC"
            type="range"
            min="25"
            max="300"
            step="25"
            value={gogc}
            onChange={(e) => change(setGogc, e.target.value, 25, 300)}
          />
        </label>
      </div>
      <div className="gc-output">
        <div className="gc-bar" aria-hidden="true">
          <span style={{ width: `${(live / model.goal) * 100}%` }} />
          <span style={{ width: `${(model.headroom / model.goal) * 100}%` }} />
        </div>
        <div className="gc-legend">
          <span>存活堆 {live} MiB</span>
          <span>增长预算 {model.headroom.toFixed(1)} MiB</span>
        </div>
        <div className="gc-metrics">
          <div>
            <small>模型堆目标</small>
            <strong>{model.goal.toFixed(1)} MiB</strong>
          </div>
          <div>
            <small>估算周期频率</small>
            <strong>{model.cyclesPerSecond.toFixed(2)} / s</strong>
          </div>
        </div>
      </div>
      <p className="concept-result" role="status">
        {live} + ({live} + {roots}) × {gogc}% = {model.goal.toFixed(1)}{' '}
        MiB。根扫描量影响增长预算，不能直接当作堆中多出的对象。
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          这是官方 GC
          指南的稳态近似模型，不是运行时测量。假设存活量、根扫描量与分配速率固定，忽略堆下界、内存限制、并发标记耗时、辅助标记、突发分配和释放时机；周期频率不是延迟或
          CPU 占用预测。GOGC=off 和 0 不在模型范围内。
        </p>
      </details>
    </section>
  );
}
