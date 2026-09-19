import { useState } from 'react';
import { FlaskConical, Play, RotateCcw } from 'lucide-react';
import { probeFrames, probeGroups, probeTargets } from '../lib/map-probe';
import { useLearning } from '../state/learning';
export function MapProbeLab() {
  const [target, setTarget] = useState('k42');
  const [step, setStep] = useState(-1);
  const { update } = useLearning();
  const frames = probeFrames(target);
  const frame = frames[step];
  return (
    <section className="framed-tool concept-lab" aria-label="哈希探测实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>哈希探测实验</strong>
        </div>
        <span className="live-label">H2 = 37</span>
      </div>
      <div className="concept-controls">
        <label>
          目标键
          <select
            aria-label="查找的键"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setStep(-1);
            }}
          >
            {probeTargets.map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>
        </label>
        <button
          className="button small"
          disabled={step === frames.length - 1}
          onClick={() => {
            setStep(step + 1);
            update({ labRan: true });
          }}
        >
          <Play size={14} />
          {step === frames.length - 1 ? '探测完成' : '推进一步'}
        </button>
        <button
          className="icon-button"
          aria-label="重置哈希实验"
          title="重置哈希实验"
          onClick={() => setStep(-1)}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="probe-groups">
        {probeGroups.map((slots, g) => (
          <div className="probe-group" key={g}>
            <strong>
              组 {g} {frame?.group === g ? '· 正在检查' : ''}
            </strong>
            <div className="probe-slots">
              {slots.map((slot, i) => {
                const active = frame?.group === g;
                const candidate = active && frame.candidates.includes(i);
                const found = active && frame.found === i;
                return (
                  <div
                    key={i}
                    className={`probe-slot ${found ? 'found' : candidate ? 'candidate' : ''}`}
                  >
                    <small>{'key' in slot ? `H2 ${slot.h2}` : slot.state}</small>
                    <b>{'key' in slot ? slot.key : '空位'}</b>
                    <span>
                      {found ? '键匹配' : candidate ? (frame.compared ? '键不同' : '候选') : ' '}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="concept-result" role="status">
        {frame?.reason ?? '先比较一组控制字节，再比较候选完整键。目标键的短哈希均设为 37。'}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          两组、每组八槽的教学探测片段，短哈希与探测路径人为固定，不是运行 Go
          后提取的布局。省略随机种子、H1 计算、目录、扩容与小 map
          特例；展示的是“筛选再比较”和“墓碑不终止”的机制。
        </p>
      </details>
    </section>
  );
}
