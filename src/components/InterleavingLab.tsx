import { useState } from 'react';
import { ScenarioPlayer } from './ScenarioPlayer';
import { enumerateSchedules, executeSchedule, operationLabel } from '../lib/interleavings';
import type { UpdateMode } from '../lib/interleavings';
import type { Scenario } from '../lib/scenarios';

function scenariosFor(mode: UpdateMode): Scenario[] {
  return enumerateSchedules(mode).map((schedule, index) => ({
    id: `${mode}-${index}`,
    label: `${index + 1} · ${schedule.map(operationLabel).join(' → ')}`,
    frames: executeSchedule(schedule).map((frame, step) => ({
      title: step === 0 ? '共享计数器从 0 开始' : operationLabel(schedule[step - 1]),
      lanes: [
        { label: '共享计数器', value: String(frame.value) },
        { label: 'A 局部值', value: frame.a === null ? '尚未读取' : String(frame.a) },
        { label: 'B 局部值', value: frame.b === null ? '尚未读取' : String(frame.b) },
      ],
      note:
        step === schedule.length
          ? frame.value === 2
            ? '本次保留了两次更新。仍应检查这个有限模型中的其他交错，不能只看一次成功。'
            : '所有共享访问都是原子操作，却只得到 1。两个局部快照都是 0，后一次 Store 覆盖了前一次更新。'
          : step === 0
            ? '每个 G 的内部顺序固定，跨 G 的操作可以交错。这里每次 Load、Store 或 Add 都视为一个不可分割的原子动作。'
            : schedule[step - 1].kind === 'load'
              ? '读取共享值保存到局部快照；之后其他 G 修改共享值，不会自动更新这个局部数值。'
              : schedule[step - 1].kind === 'store'
                ? '用之前的局部快照加一写回；Store 原子，不代表此前的 Load 与它合成一个原子事务。'
                : '一次原子 Add 完成读、改、写；另一个 Add 只能排在它之前或之后。',
    })),
  }));
}
const scenarios = { split: scenariosFor('split'), add: scenariosFor('add') };

export function InterleavingLab() {
  const [mode, setMode] = useState<UpdateMode>('split');
  return (
    <div className="interleaving-lab">
      <div className="concept-controls">
        <label>
          更新方式
          <select
            aria-label="更新方式"
            value={mode}
            onChange={(e) => setMode(e.target.value as UpdateMode)}
          >
            <option value="split">atomic Load 后 Store</option>
            <option value="add">atomic Add</option>
          </select>
        </label>
        <span className="interleaving-summary">
          {mode === 'split' ? '6 种交错 · 4 种丢失更新' : '2 种交错 · 均得到 2'}
        </span>
      </div>
      <ScenarioPlayer
        key={mode}
        title="交错执行实验"
        scenarios={scenarios[mode]}
        boundary="只枚举两个 G、初值 0、各加一且无其他访问时的顺序一致原子操作交错。枚举条数不是概率，未模拟真实调度器、普通变量的数据竞争、CAS 重试或其他输入。真实 Go 的原子丢失更新反例另在 happensbefore 示例包中验证。"
      />
    </div>
  );
}
