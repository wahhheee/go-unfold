import { useState } from 'react';
import { ArrowDown, ArrowRight, FlaskConical, Network } from 'lucide-react';
import { publicationOrder } from '../lib/happens-before';
import type { PublicationMode } from '../lib/happens-before';
import { useLearning } from '../state/learning';
export function HappensBeforeLab() {
  const [mode, setMode] = useState<PublicationMode>('sleep');
  const [checked, setChecked] = useState(false);
  const { update } = useLearning();
  const model = publicationOrder(mode);
  return (
    <section className="framed-tool concept-lab" aria-label="发布顺序实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>发布顺序实验</strong>
        </div>
        <span className="live-label">W → R ?</span>
      </div>
      <div className="concept-controls">
        <label>
          同步方式
          <select
            aria-label="发布同步方式"
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as PublicationMode);
              setChecked(false);
            }}
          >
            <option value="sleep">读取前 Sleep</option>
            <option value="close">先接收关闭通知，再读取</option>
            <option value="atomic">观察到原子发布，再读取</option>
            <option value="late">先读取，后接收通知</option>
          </select>
        </label>
        <button
          className="button small"
          onClick={() => {
            setChecked(true);
            update({ labRan: true });
          }}
        >
          <Network size={15} />
          检查顺序
        </button>
      </div>
      <div className="hb-diagram">
        {[model.writer, model.reader].map((events, index) => (
          <div className="hb-lane" key={index}>
            <strong>{index === 0 ? 'G1 · 发布者' : 'G2 · 读取者'}</strong>
            <code>{events[0]}</code>
            <ArrowDown size={19} aria-hidden="true" />
            <code>{events[1]}</code>
          </div>
        ))}
      </div>
      <div className="hb-connection">
        <ArrowRight size={17} />
        <span>{model.synchronized ? 'P → O：同步边' : 'P 与 O：没有同步边'}</span>
      </div>
      <p className="concept-result" role="status">
        {checked
          ? `${model.ordered ? '读取有序。' : '不能证明读取有序。'}${model.note}`
          : '沿有向边检查：能否从写 data 走到读 data？'}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          四个事件的关系图，不是 CPU 或 Go 调度模拟。原子模式以 Load 实际观察到 Store(true)
          为前提；data
          只写一次。图中没有路径不能预测实际输出，也不能把有竞态程序的可能行为缩减为这里四个方框。
        </p>
      </details>
    </section>
  );
}
