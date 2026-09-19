import { useState } from 'react';
import { ArrowRight, Copy, FlaskConical, Pencil, RotateCcw } from 'lucide-react';
import { copyRecord, editCopy, initialValueCopy } from '../lib/value-copy';
import { useLearning } from '../state/learning';

export function ValueCopyLab() {
  const [model, setModel] = useState(initialValueCopy);
  const [independent, setIndependent] = useState(false);
  const [field, setField] = useState<'score' | 'age'>('score');
  const [value, setValue] = useState(99);
  const [message, setMessage] = useState('先复制 a，再观察修改 b 会影响哪一份数据。');
  const { update } = useLearning();
  return (
    <section className="framed-tool concept-lab" aria-label="值复制实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>值复制实验</strong>
        </div>
        <span className="live-label">语义模型</span>
      </div>
      <div className="concept-controls">
        <label className="check-setting">
          <input
            type="checkbox"
            checked={independent}
            onChange={(event) => {
              setIndependent(event.target.checked);
              setModel(initialValueCopy());
              setMessage('复制策略已改变，重新复制后再修改。');
            }}
          />
          为 Age 指向的值另分配存储
        </label>
        <button
          className="button small"
          onClick={() => {
            setModel(copyRecord(model, independent));
            setMessage(
              independent
                ? 'b 的 Age 指向新单元；这是显式复制可达数据。'
                : 'b = a 复制了字段，其中 Age 的指针值保持相同。',
            );
            update({ labRan: true });
          }}
        >
          <Copy size={14} />
          复制 a 到 b
        </button>
      </div>
      <div className="value-diagram">
        {(['original', 'copy'] as const).map((key) => {
          const record = model[key];
          return (
            <div className="value-record" key={key}>
              <strong>{key === 'original' ? 'a · 原值' : 'b · 副本'}</strong>
              <div>
                <span>Score</span>
                <b>{record?.score ?? '未复制'}</b>
              </div>
              <div>
                <span>Age</span>
                <span className="pointer-cell">
                  {record ? (
                    <>
                      <ArrowRight size={13} />
                      {record.ageCell}
                    </>
                  ) : (
                    '未复制'
                  )}
                </span>
              </div>
            </div>
          );
        })}
        <div className="value-cells">
          <strong>被指向的数据</strong>
          {Object.entries(model.cells).map(([id, age]) => (
            <div key={id}>
              <code>{id}</code>
              <b>{age}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="concept-controls">
        <label>
          修改副本的
          <select
            aria-label="修改副本的字段"
            value={field}
            onChange={(event) => setField(event.target.value as 'score' | 'age')}
          >
            <option value="score">Score 字段</option>
            <option value="age">Age 指向的值</option>
          </select>
        </label>
        <label>
          新值
          <input
            aria-label="字段新值"
            type="number"
            min="0"
            max="99"
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
          />
        </label>
        <button
          className="button small"
          disabled={!model.copy || !Number.isInteger(value) || value < 0 || value > 99}
          onClick={() => {
            setModel(editCopy(model, field, value));
            setMessage(
              field === 'score'
                ? '只改变 b.Score；a.Score 没有变。'
                : independent
                  ? 'b 指向独立单元，a 的年龄没有变。'
                  : 'a.Age 与 b.Age 指向同一单元，所以两边都读到新年龄。',
            );
          }}
        >
          <Pencil size={14} />
          应用修改
        </button>
        <button
          className="icon-button"
          aria-label="重置值复制实验"
          title="重置"
          onClick={() => {
            setModel(initialValueCopy());
            setMessage('已重置，等待复制。');
          }}
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
          age-1 / age-2 是对象身份的示意标签，不是真实地址。本实验模拟 Go
          结构体及指针的赋值语义，不运行 Go，也不推断栈或堆分配；对应的真实 Go 测试位于
          examples/go/values。
        </p>
      </details>
    </section>
  );
}
