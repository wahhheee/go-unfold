import { useState } from 'react';
import { flowStep, flowView, newFlow } from '../lib/flow-model';
import type { FlowConfig } from '../lib/flow-model';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';
export function FlowLab() {
  const [config, setConfig] = useState<FlowConfig>({ cwnd: 4, capacity: 4, loss: true });
  const [state, setState] = useState(newFlow);
  const { update } = useLearning();
  const v = flowView(state, config);
  function configure(c: FlowConfig) {
    setConfig(c);
    setState(newFlow());
  }
  function act(a: Parameters<typeof flowStep>[2]) {
    setState(flowStep(state, config, a));
    update({ labRan: true });
  }
  return (
    <NetworkLabShell
      title="TCP 窗口与丢失恢复实验"
      badge={`已交付应用 ${state.consumed} / 12`}
      message={state.message}
      assumptions="每段为一单位，序列从 0 起；接收窗口右沿等于已消费位置加固定容量，为缺口预留位置。ACK 与交付在同一步完成，cwnd 固定以隔离两个窗口，不实现 Reno/CUBIC、SACK 恢复、ACK 延迟、窗口缩放、探测计时或真实吞吐。"
    >
      <div className="concept-controls">
        <label>
          拥塞窗口：{config.cwnd} 段
          <input
            type="range"
            aria-label="拥塞窗口"
            min="1"
            max="8"
            value={config.cwnd}
            onChange={(e) => configure({ ...config, cwnd: +e.target.value })}
          />
        </label>
        <label>
          接收容量：{config.capacity} 段
          <input
            type="range"
            aria-label="接收容量"
            min="1"
            max="8"
            value={config.capacity}
            onChange={(e) => configure({ ...config, capacity: +e.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.loss}
            onChange={(e) => configure({ ...config, loss: e.target.checked })}
          />
          第 2 段首次传输丢失
        </label>
      </div>
      <NetworkCells
        cells={[
          { title: '可新发', value: `${v.sendable} 段`, detail: '减去已发未累计确认部分' },
          {
            title: '累计 ACK / 未确认',
            value: `${state.ack} / ${v.flight}`,
            detail: 'ACK 指下一个期待的位置',
          },
          {
            title: '通告接收窗口',
            value: `${v.rwnd} 段`,
            detail: `cwnd = ${config.cwnd} 段`,
            active: v.rwnd === 0,
          },
        ]}
      />
      <div className="network-track" aria-label="数据段状态">
        {Array.from({ length: 12 }, (_, i) => {
          const label =
            i < state.consumed
              ? '已读'
              : state.lost.includes(i)
                ? '丢失'
                : state.received.includes(i)
                  ? i < state.ack
                    ? '已确认'
                    : '等缺口'
                  : state.flying.includes(i)
                    ? '在途'
                    : '未发';
          return (
            <div
              key={i}
              className={`network-token ${i < state.ack ? 'is-active' : ''} ${label === '丢失' ? 'is-blocked' : ''}`}
            >
              <strong>{i}</strong>
              <br />
              <small>{label}</small>
            </div>
          );
        })}
      </div>
      <div className="concept-controls">
        <button className="button small" onClick={() => act('send')}>
          按窗口发送
        </button>
        <button
          className="button small secondary"
          disabled={!state.flying.length}
          onClick={() => act('deliver')}
        >
          交付并返回 ACK
        </button>
        <button
          className="button small secondary"
          disabled={!state.lost.length}
          onClick={() => act('repair')}
        >
          重传缺失段
        </button>
        <button className="button small secondary" onClick={() => act('consume')}>
          应用读取连续数据
        </button>
        <button className="button small secondary" onClick={() => setState(newFlow())}>
          重置窗口
        </button>
      </div>
    </NetworkLabShell>
  );
}
