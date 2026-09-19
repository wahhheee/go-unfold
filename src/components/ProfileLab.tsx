import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { profileSample } from '../lib/profiles';
import type { ProfileMetric } from '../lib/profiles';
import { useLearning } from '../state/learning';
export function ProfileLab() {
  const [metric, setMetric] = useState<ProfileMetric>('inuse_space'),
    [retention, setRetention] = useState(95);
  const { update } = useLearning();
  const rows = profileSample(metric, retention),
    total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <section className="framed-tool concept-lab" aria-label="内存画像视角实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>内存画像视角实验</strong>
        </div>
        <span className="live-label">教学样本</span>
      </div>
      <fieldset className="profile-modes">
        <legend>统计口径</legend>
        {(['inuse_space', 'alloc_space'] as const).map((mode) => (
          <label key={mode}>
            <input
              type="radio"
              name="profile-metric"
              checked={mode === metric}
              onChange={() => {
                setMetric(mode);
                update({ labRan: true });
              }}
            />
            {mode === 'inuse_space' ? '当前存量' : '累计分配'} · {mode}
          </label>
        ))}
      </fieldset>
      <div className="profile-bars">
        {rows.map((row) => (
          <div className="profile-row" key={row.site}>
            <div>
              <code>{row.site}</code>
              <strong>{row.value.toFixed(1)} MiB</strong>
            </div>
            <div className="profile-bar" aria-hidden="true">
              <span style={{ width: `${(row.value / rows[0].value) * 100}%` }} />
            </div>
          </div>
        ))}
        <p>所选口径合计：{total.toFixed(1)} MiB</p>
      </div>
      <label className="profile-retention">
        缓存保留比例 <strong>{retention}%</strong>
        <input
          aria-label="缓存保留比例"
          type="range"
          min="0"
          max="100"
          step="5"
          value={retention}
          onChange={(e) => {
            setRetention(Number(e.target.value));
            update({ labRan: true });
          }}
        />
      </label>
      <p className="concept-result" role="status">
        {metric === 'alloc_space'
          ? 'decodeBuffer 的分配流量最大。降低临时分配可能减少 GC 工作，即使这些对象大部分已经回收。'
          : `当前最多存量来自 ${rows[0].site}。这显示分配位置，不直接告诉你是谁一直持有对象。`}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          数值是人工构造的同一时间窗口样本，不是本机 pprof 数据，不含采样误差和 GC
          统计延迟。调整缓存保留比例只改变其存活量，历史累计分配保持不变；真实程序要使用匹配窗口、构建与采样方式比较。
        </p>
      </details>
    </section>
  );
}
