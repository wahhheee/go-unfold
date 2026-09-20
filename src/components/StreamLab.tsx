import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { newStream, readStream, wireBytes } from '../lib/tcp-model';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';
export function StreamLab() {
  const [amount, setAmount] = useState(2);
  const [framing, setFraming] = useState(true);
  const [truncate, setTruncate] = useState(false);
  const [state, setState] = useState(newStream);
  const { update } = useLearning();
  const wire = truncate ? wireBytes.slice(0, -1) : wireBytes;
  return (
    <NetworkLabShell
      title="TCP 字节流与消息定界实验"
      badge={`${state.cursor} / ${wire.length} 字节`}
      message={
        state.error ??
        (state.ended
          ? '已观察到 EOF；接收方向结束，不能据此推断业务提交成功。'
          : framing
            ? '长度前缀解码器只交付完整消息；改变每次读取量，最终消息应保持 CAT、OK。'
            : '错误方案：把每次 Read 当成消息，输出跟随读取边界变化，问号表示误读的长度字节。')
      }
      assumptions="采用一字节长度前缀和固定 ASCII 载荷；每次读取量由你控制，表示合法的流切分，不对应 TCP 包大小。未模拟握手、内核缓冲、重传或超时；长度上限由编码自身限定，真实协议仍需配置业务上限。"
    >
      <div className="concept-controls">
        <label>
          每次最多读取：{amount} 字节
          <input
            aria-label="每次读取字节数"
            type="range"
            min="1"
            max="7"
            value={amount}
            onChange={(e) => {
              setAmount(+e.target.value);
              setState(newStream());
            }}
          />
        </label>
        <label>
          解码方式
          <select
            value={framing ? 'frame' : 'read'}
            onChange={(e) => {
              setFraming(e.target.value === 'frame');
              setState(newStream());
            }}
          >
            <option value="frame">按长度前缀累积</option>
            <option value="read">错误：每次 Read 一条</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={truncate}
            onChange={(e) => {
              setTruncate(e.target.checked);
              setState(newStream());
            }}
          />
          截断最后一个字节
        </label>
      </div>
      <div className="network-track" aria-label="发送字节序列">
        {wire.map((b, i) => (
          <div className={`network-token ${i < state.cursor ? 'is-active' : ''}`} key={i}>
            <small>{i}</small>
            <br />
            {b < 32 ? `长度 ${b}` : String.fromCharCode(b)}
          </div>
        ))}
      </div>
      <NetworkCells
        cells={[
          {
            title: '已发生的 Read',
            value: state.reads.join(' / ') || '尚未读取',
            detail: '斜线表示读取边界',
          },
          {
            title: '暂存字节',
            value:
              state.pending.map((b) => (b < 32 ? `[${b}]` : String.fromCharCode(b))).join('') ||
              '空',
            detail: '不完整消息留到下一次',
          },
          {
            title: '交付应用的消息',
            value: state.messages.join('、') || '尚无完整消息',
            active: !!state.messages.length,
          },
        ]}
      />
      <div className="concept-controls">
        <button
          className="button small"
          disabled={state.ended}
          onClick={() => {
            setState(readStream(state, amount, framing, truncate));
            update({ labRan: true });
          }}
        >
          读取一次
        </button>
        <button className="button small secondary" onClick={() => setState(newStream())}>
          <RotateCcw size={15} />
          重置字节流
        </button>
      </div>
    </NetworkLabShell>
  );
}
