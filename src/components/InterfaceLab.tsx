import { useState } from 'react';
import { ArrowRight, FlaskConical, Play } from 'lucide-react';
import { useLearning } from '../state/learning';
import { interfaceCases as cases } from '../lib/interfaces';

export function InterfaceLab() {
  const [selected, setSelected] = useState<keyof typeof cases>('pointer');
  const [ran, setRan] = useState(false);
  const { update } = useLearning();
  const sample = cases[selected];
  return (
    <section className="framed-tool concept-lab" aria-label="接口状态实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>接口状态实验</strong>
        </div>
        <span className="live-label">规范语义</span>
      </div>
      <div className="concept-controls">
        <label>
          接口中放什么
          <select
            aria-label="接口中的值"
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value as keyof typeof cases);
              setRan(false);
            }}
          >
            {Object.entries(cases).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button small"
          onClick={() => {
            setRan(true);
            update({ labRan: true });
          }}
        >
          <Play size={14} />
          验证判断
        </button>
      </div>
      <div className="interface-diagram">
        <div>
          <span>静态类型</span>
          <strong>any</strong>
        </div>
        <ArrowRight size={20} />
        <div>
          <span>动态类型</span>
          <strong>{sample.type}</strong>
        </div>
        <div>
          <span>动态值</span>
          <strong>{sample.value}</strong>
        </div>
      </div>
      <div className="comparison-results">
        <div>
          <code>x == nil</code>
          <strong>{ran ? sample.equalNil : '待验证'}</strong>
        </div>
        <div>
          <code>x == x</code>
          <strong className={ran && sample.equalSelf === 'panic' ? 'panic-result' : ''}>
            {ran ? sample.equalSelf : '待验证'}
          </strong>
        </div>
      </div>
      <p className="concept-result" role="status">
        {ran ? sample.reason : '先看动态类型，再预测两种比较的结果。'}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          这是四个固定 Go 场景的语义展示，真实输出由 examples/go/interfaces
          测试核验。动态类型与动态值是逻辑模型，不是对运行时内存字节布局的承诺；实验不执行用户输入的
          Go 代码。
        </p>
      </details>
    </section>
  );
}
