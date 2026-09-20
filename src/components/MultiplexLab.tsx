import { useState } from 'react';
import { muxView, muxPackets } from '../lib/multiplex-model';
import type { MuxProtocol } from '../lib/multiplex-model';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';
export function MultiplexLab() {
  const [protocol, setProtocol] = useState<MuxProtocol>('h2');
  const [step, setStep] = useState(0);
  const [loss, setLoss] = useState(0);
  const [qpack, setQpack] = useState(false);
  const { update } = useLearning();
  const v = muxView(protocol, step, loss, qpack);
  return (
    <NetworkLabShell
      title="HTTP 多路复用与队头阻塞实验"
      badge={`${step} / 7 步`}
      message={v.message}
      assumptions="三条流各有两块数据；每个简化传输包只承载一块，一个包首次丢失，第七步补齐。HTTP/2 的块映射到连续 TCP 字节范围；HTTP/3 按 QUIC 流独立重组。忽略加密、共享拥塞控制、窗口、调度和实际包大小。可选 QPACK 分支假设所有头依赖同一未到达条目，不表示所有 HTTP/3 都会阻塞。"
    >
      <div className="concept-controls">
        <label>
          承载协议
          <select
            value={protocol}
            onChange={(e) => {
              setProtocol(e.target.value as MuxProtocol);
              setStep(0);
            }}
          >
            <option value="h2">HTTP/2 · 一条 TCP 字节流</option>
            <option value="h3">HTTP/3 · QUIC 独立流</option>
          </select>
        </label>
        <label>
          丢失位置
          <select
            value={loss}
            onChange={(e) => {
              setLoss(+e.target.value);
              setStep(0);
            }}
          >
            {muxPackets.map((p, i) => (
              <option value={i} key={i}>
                包 {i + 1} · {p.stream}
                {p.part + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            disabled={protocol !== 'h3'}
            checked={qpack}
            onChange={(e) => {
              setQpack(e.target.checked);
              setStep(0);
            }}
          />
          加入 QPACK 依赖
        </label>
      </div>
      <div className="network-track" aria-label="传输包到达序列">
        {muxPackets.map((p, i) => (
          <div
            className={`network-token ${v.received[i] ? 'is-active' : ''} ${i === loss && step > i && step < 7 ? 'is-blocked' : ''}`}
            key={i}
          >
            <strong>
              {p.stream}
              {p.part + 1}
            </strong>
            <br />
            <small>{v.received[i] ? '已到达' : step > i ? '丢失' : '待到达'}</small>
          </div>
        ))}
      </div>
      <NetworkCells
        cells={v.streams.map((s) => ({
          title: `流 ${s.name}`,
          value: `可交付 ${s.delivered} / 2`,
          detail: `传输已收到 ${s.received} 块`,
          active: s.delivered === 2,
        }))}
      />
      <div className="concept-controls">
        <button
          className="button small"
          disabled={step === 7}
          onClick={() => {
            setStep(step + 1);
            update({ labRan: true });
          }}
        >
          {step === 6 ? '补齐丢失与依赖' : '推进一个到达事件'}
        </button>
        <button
          className="button small secondary"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          回退一步
        </button>
        <button className="button small secondary" onClick={() => setStep(0)}>
          重置多路复用
        </button>
      </div>
    </NetworkLabShell>
  );
}
