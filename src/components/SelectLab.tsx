import { useState } from 'react';
import { FlaskConical, Play, Check } from 'lucide-react';
import { selectCandidates } from '../lib/select-model';
import type { DataCase } from '../lib/select-model';
import { useLearning } from '../state/learning';
export function SelectLab() {
  const [data, setData] = useState<DataCase>('value'),
    [canceled, setCanceled] = useState(true),
    [withDefault, setWithDefault] = useState(false),
    [chosen, setChosen] = useState<string | null>(null),
    [ran, setRan] = useState(false);
  const { update } = useLearning();
  const candidates = selectCandidates(data, canceled, withDefault);
  function clear() {
    setRan(false);
    setChosen(null);
  }
  return (
    <section className="framed-tool concept-lab" aria-label="select 就绪集合实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>select 就绪集合实验</strong>
        </div>
        <span className="live-label">READY SET</span>
      </div>
      <div className="concept-controls">
        <label>
          数据分支
          <select
            aria-label="数据分支状态"
            value={data}
            onChange={(e) => {
              setData(e.target.value as DataCase);
              clear();
            }}
          >
            <option value="value">有任务可接收</option>
            <option value="empty">未关闭但为空</option>
            <option value="closed">已关闭且读空</option>
            <option value="nil">nil</option>
            <option value="closed-send">向已关闭通道发送</option>
          </select>
        </label>
        <label className="check-setting">
          <input
            type="checkbox"
            checked={canceled}
            onChange={(e) => {
              setCanceled(e.target.checked);
              clear();
            }}
          />
          取消已发生
        </label>
        <label className="check-setting">
          <input
            type="checkbox"
            checked={withDefault}
            onChange={(e) => {
              setWithDefault(e.target.checked);
              clear();
            }}
          />
          包含 default
        </label>
      </div>
      <div className="select-candidates">
        <strong>当前可选：{candidates.length} 个分支</strong>
        {candidates.length ? (
          candidates.map((candidate) => (
            <div className={chosen === candidate.id ? 'selected' : ''} key={candidate.id}>
              <span>{candidate.label}</span>
              {chosen === candidate.id && <Check size={16} />}
              <small>{candidate.result}</small>
            </div>
          ))
        ) : (
          <p>没有可选分支，将阻塞等待。</p>
        )}
      </div>
      <div className="concept-controls">
        <button
          className="button small"
          onClick={() => {
            setChosen(
              candidates.length
                ? candidates[Math.floor(Math.random() * candidates.length)].id
                : null,
            );
            setRan(true);
            update({ labRan: true });
          }}
        >
          <Play size={14} />
          推演一次选择
        </button>
      </div>
      <p className="concept-result" role="status">
        {ran
          ? chosen
            ? `本次选择：${candidates.find((x) => x.id === chosen)?.label}。${candidates.length > 1 ? '其余就绪分支也可能被选中，取消不自动优先。' : candidates[0]?.result} `
            : '没有就绪通信，也没有 default；本次 select 阻塞。'
          : '先列出全部可选分支，再观察一次选择；case 的书写顺序不表示优先级。'}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          只推演进入选择时的固定就绪集合，使用浏览器随机数演示一个可选结果，不运行 Go，也不复现 Go
          随机序列、长期公平性或调度时间。每次保留相同条件，不消耗真实任务；真实 channel
          状态可以被其他 goroutine 改变。
        </p>
      </details>
    </section>
  );
}
