import { useState } from 'react';
import { FlaskConical, Play, RotateCcw } from 'lucide-react';
import { sliceSnapshot } from '../lib/slices';
import type { SliceMode } from '../lib/slices';
import { useLearning } from '../state/learning';

export function SliceLab() {
  const [mode, setMode] = useState<SliceMode>('share');
  const [length, setLength] = useState(2);
  const [value, setValue] = useState(99);
  const [stage, setStage] = useState(0);
  const { update } = useLearning();
  const state = sliceSnapshot(mode, length, value, stage);
  return (
    <section className="framed-tool concept-lab" aria-label="切片别名实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>切片别名实验</strong>
        </div>
        <span className="live-label">第 {stage} / 2 步</span>
      </div>
      <div className="concept-controls">
        <label>
          b 的来源
          <select
            aria-label="切片构造方式"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as SliceMode);
              setStage(0);
            }}
          >
            <option value="share">b = a</option>
            <option value="limit">b = a[:len(a):len(a)]</option>
            <option value="copy">make + copy</option>
          </select>
        </label>
        <label>
          初始长度
          <input
            aria-label="初始切片长度"
            type="number"
            min="1"
            max="4"
            value={length}
            onChange={(e) => {
              setLength(Math.min(4, Math.max(1, Math.trunc(Number(e.target.value)))));
              setStage(0);
            }}
          />
        </label>
        <label>
          追加值
          <input
            aria-label="追加的整数"
            type="number"
            min="-999"
            max="999"
            value={value}
            onChange={(e) => {
              setValue(Math.min(999, Math.max(-999, Math.trunc(Number(e.target.value)))));
              setStage(0);
            }}
          />
        </label>
      </div>
      <div className="slice-memory">
        <div>
          <strong>原数组</strong>
          <div className="memory-cells">
            {state.original.map((item, i) => (
              <span key={i}>
                <small>{i}</small>
                <b>{item}</b>
              </span>
            ))}
          </div>
        </div>
        <div className="slice-descriptors">
          <span>
            a · len={length} · cap=4
            <br />
            <code>[{state.a.join(' ')}]</code>
          </span>
          <span>
            b · len={state.b.length} · cap={state.bCapacity}
            <br />
            <code>[{state.b.join(' ')}]</code>
          </span>
        </div>
        <p>{state.shared ? 'a 与 b 指向同一个底层数组' : 'b 已拥有另一个底层数组'}</p>
      </div>
      <div className="concept-controls">
        <button
          className="button small"
          disabled={stage === 2}
          onClick={() => {
            setStage(stage + 1);
            update({ labRan: true });
          }}
        >
          <Play size={14} />
          {stage === 0 ? '执行 append' : stage === 1 ? '执行 b[0] = 7' : '执行完成'}
        </button>
        <button
          className="icon-button"
          aria-label="重置切片实验"
          title="重置切片实验"
          onClick={() => setStage(0)}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <p className="concept-result" role="status">
        {stage === 0
          ? '还没有追加。限制容量不会复制已有元素。'
          : stage === 1
            ? state.shared
              ? 'append 复用原数组，覆盖了 a 长度之外的那个位置；a 的长度仍未改变。'
              : 'append 后 b 不再共享原数组；新容量的精确值不属于本实验承诺。'
            : state.shared
              ? '改 b[0] 也改了 a[0]，因为元素仍然共享。'
              : '改 b[0] 没有改变 a[0]，两份元素已分离。'}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          整数切片、单
          goroutine、固定原数组。只模拟规范规定的共享和分配条件，不模拟运行时增长倍率、分配器尺寸分级或
          GC。实际 Go 验证位于 examples/go/sequences。
        </p>
      </details>
    </section>
  );
}
