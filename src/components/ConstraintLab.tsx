import { useState } from 'react';
import { Check, FlaskConical, Play, X } from 'lucide-react';
import { constraintCases, constraintTypes } from '../lib/constraints';
import type { ConstraintChoice } from '../lib/constraints';
import { useLearning } from '../state/learning';

export function ConstraintLab() {
  const [choice, setChoice] = useState<ConstraintChoice>('exact');
  const [ran, setRan] = useState(false);
  const { update } = useLearning();
  const rule = constraintCases[choice];
  return (
    <section className="framed-tool concept-lab" aria-label="类型约束实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>类型约束实验</strong>
        </div>
        <span className="live-label">Go 1.27</span>
      </div>
      <div className="concept-controls">
        <label>
          约束
          <select
            aria-label="选择类型约束"
            value={choice}
            onChange={(event) => {
              setChoice(event.target.value as ConstraintChoice);
              setRan(false);
            }}
          >
            {Object.entries(constraintCases).map(([key, item]) => (
              <option value={key} key={key}>
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
          检查类型实参
        </button>
      </div>
      <div className="constraint-grid">
        {constraintTypes.map((type, index) => (
          <div className="constraint-row" key={type}>
            <code>{type}</code>
            <span>
              {ran ? (
                <>
                  {rule.accepted[index] ? <Check size={15} /> : <X size={15} />}{' '}
                  {rule.accepted[index] ? '满足' : '不满足'}
                </>
              ) : (
                '待检查'
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="concept-result" role="status">
        {ran ? rule.note : '前提：type UserID int。先预测哪些类型可以作为 T 的实参。'}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          这里检查七个固定类型与四种约束的关系，不解析任意 Go 代码。28 组关系由 examples/go/generics
          中的 go/types 测试逐一核验；“满足”只代表可用于实例化。
        </p>
      </details>
    </section>
  );
}
