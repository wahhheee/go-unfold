import { useState } from 'react';
import { FlaskConical, Send, Download, XCircle, RotateCcw } from 'lucide-react';
import { channelStep, createChannel } from '../lib/channel-machine';
import type { ChannelAction } from '../lib/channel-machine';
import { useLearning } from '../state/learning';
export function ChannelLab() {
  const [state, setState] = useState(() => createChannel()),
    [value, setValue] = useState(7);
  const { update } = useLearning();
  function act(action: ChannelAction) {
    setState((previous) => channelStep(previous, action));
    update({ labRan: true });
  }
  return (
    <section className="framed-tool concept-lab" aria-label="Channel 状态实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>Channel 状态实验</strong>
        </div>
        <button
          className="icon-button"
          aria-label="重置通道实验"
          title="重置通道实验"
          onClick={() => setState(createChannel(state.capacity, state.nil))}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="concept-controls">
        <label>
          通道
          <select
            aria-label="通道种类"
            value={state.nil ? 'nil' : 'made'}
            onChange={(e) => setState(createChannel(1, e.target.value === 'nil'))}
          >
            <option value="made">make 创建</option>
            <option value="nil">nil</option>
          </select>
        </label>
        <label>
          容量
          <select
            aria-label="通道容量"
            value={state.capacity}
            disabled={state.nil}
            onChange={(e) => setState(createChannel(Number(e.target.value)))}
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? '0 · 无缓冲' : n}
              </option>
            ))}
          </select>
        </label>
        <label>
          发送值
          <input
            type="number"
            aria-label="发送的整数"
            value={value}
            min={0}
            max={99}
            onChange={(e) =>
              setValue(Math.trunc(Math.max(0, Math.min(99, Number(e.target.value)))))
            }
          />
        </label>
      </div>
      <div className="channel-scene">
        <div className="channel-state">
          <strong>{state.nil ? 'nil' : state.closed ? 'closed' : 'open'}</strong>
          <span>
            len {state.buffer.length} / cap {state.capacity}
          </span>
        </div>
        <div className="channel-queue">
          {Array.from({ length: 3 }, (_, i) => (
            <div className={`channel-slot ${i >= state.capacity ? 'unused' : ''}`} key={i}>
              <small>{i < state.capacity ? `槽 ${i + 1}` : '未启用'}</small>
              <b>{state.buffer[i] ?? (i < state.capacity ? '空' : '·')}</b>
            </div>
          ))}
        </div>
        <div className="channel-waiters">
          <span>发送方：{state.sender === null ? '可操作' : `阻塞 · ${state.sender}`}</span>
          <span>接收方：{state.receiver ? '阻塞' : '可操作'}</span>
        </div>
      </div>
      <div className="concept-controls">
        <button
          className="button small"
          disabled={state.sender !== null}
          onClick={() => act({ type: 'send', value })}
        >
          <Send size={14} />
          发送
        </button>
        <button
          className="button secondary small"
          disabled={state.receiver}
          onClick={() => act({ type: 'receive' })}
        >
          <Download size={14} />
          接收
        </button>
        <button className="button secondary small" onClick={() => act({ type: 'close' })}>
          <XCircle size={14} />
          关闭
        </button>
      </div>
      <p className="concept-result" role="status">
        {state.message}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          一个发送方、一个接收方和可独立发起关闭的操作方；每方最多挂起一次操作。点击推进一种合法交接，省略调度延迟、公平性及真实运行时队列。panic
          只显示为结果，真实 Go 未恢复的 panic
          会结束进程。更换通道或容量会建立全新实验，不会改变实际 Go 中既有 channel 的容量。
        </p>
      </details>
    </section>
  );
}
