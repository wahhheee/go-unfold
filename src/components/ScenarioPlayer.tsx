import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, FlaskConical, Pause, Play, RotateCcw } from 'lucide-react';
import type { Scenario } from '../lib/scenarios';
import { useLearning } from '../state/learning';
export function ScenarioPlayer({
  title,
  scenarios,
  boundary,
}: {
  title: string;
  scenarios: Scenario[];
  boundary: string;
}) {
  const [selected, setSelected] = useState(scenarios[0].id);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { update } = useLearning();
  const scenario = scenarios.find((item) => item.id === selected) ?? scenarios[0];
  const frame = scenario.frames[index];
  const last = index === scenario.frames.length - 1;
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (index >= scenario.frames.length - 2) setPlaying(false);
      setIndex((i) => Math.min(i + 1, scenario.frames.length - 1));
    }, 1200);
    return () => clearTimeout(timer);
  }, [playing, index, scenario]);
  return (
    <section className="framed-tool concept-lab" aria-label={title}>
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>{title}</strong>
        </div>
        <span className="live-label">
          {index + 1} / {scenario.frames.length}
        </span>
      </div>
      <div className="concept-controls">
        <label>
          场景
          <select
            aria-label={`${title}场景`}
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setIndex(0);
              setPlaying(false);
            }}
          >
            {scenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="icon-button"
          disabled={last}
          aria-label={playing ? '暂停播放' : '自动播放'}
          title={playing ? '暂停播放' : '自动播放'}
          onClick={() => {
            setPlaying(!playing);
            update({ labRan: true });
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          className="icon-button"
          aria-label="重新播放"
          title="重新播放"
          onClick={() => {
            setIndex(0);
            setPlaying(false);
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="scenario-stage">
        <h3>{frame.title}</h3>
        <div className="scenario-lanes">
          {frame.lanes.map((lane) => (
            <div key={lane.label}>
              <strong>{lane.label}</strong>
              <span>{lane.value}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="concept-result" role="status">
        {frame.note}
      </p>
      <div className="scenario-navigation">
        <button
          className="icon-button"
          aria-label="上一步"
          title="上一步"
          disabled={index === 0}
          onClick={() => {
            setIndex(index - 1);
            setPlaying(false);
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <span>步骤 {index + 1}</span>
        <button
          className="button small"
          disabled={last}
          onClick={() => {
            setIndex(index + 1);
            setPlaying(false);
            update({ labRan: true });
          }}
        >
          下一步
          <ArrowRight size={14} />
        </button>
      </div>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>{boundary}</p>
      </details>
    </section>
  );
}
