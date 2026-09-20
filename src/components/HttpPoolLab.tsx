import { useState } from 'react';
import { httpPoolStep, newHttpPool } from '../lib/http-pool';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';
export function HttpPoolLab() {
  const [max, setMax] = useState(1);
  const [state, setState] = useState(newHttpPool);
  const { update } = useLearning();
  function act(e: Parameters<typeof httpPoolStep>[2], id?: number) {
    setState(httpPoolStep(state, max, e, id));
    update({ labRan: true });
  }
  return (
    <NetworkLabShell
      title="HTTP 响应体与连接池实验"
      badge={`已读完 ${state.completed} 个响应`}
      message={state.message}
      assumptions="限定 HTTP/1.1，同源，无流水线；每个响应有三块非空载荷，最后一块同时观察 EOF 并关闭 Body。提前关闭一律丢弃连接；不模拟实现可能做的有限排空、服务端主动关闭、空响应、重试、拨号耗时与 HTTP/2 流复用。"
    >
      <div className="concept-controls">
        <label>
          总连接上限
          <select
            value={max}
            onChange={(e) => {
              setMax(+e.target.value);
              setState(newHttpPool());
            }}
          >
            <option value="1">1 条连接</option>
            <option value="2">2 条连接</option>
          </select>
        </label>
        <button
          className="button small"
          disabled={state.nextRequest > 8}
          onClick={() => act('request')}
        >
          发起新请求
        </button>
        <button className="button small secondary" onClick={() => act('closeIdle')}>
          关闭空闲连接
        </button>
        <button className="button small secondary" onClick={() => setState(newHttpPool())}>
          重置连接池
        </button>
      </div>
      <NetworkCells
        cells={[
          { title: '已拨号', value: `${state.dials} 次`, detail: '复用不会增加拨号次数' },
          {
            title: '等待连接',
            value: state.waiting.map((x) => `请求 ${x}`).join('、') || '无',
            active: !!state.waiting.length,
          },
          {
            title: '当前连接',
            value: `${state.slots.length} / ${max}`,
            detail: '空闲与活跃共同计入上限',
          },
        ]}
      />
      {state.slots.map((slot) => (
        <div className="network-lane" key={slot.id}>
          <h4>
            连接 {slot.id} ·{' '}
            {slot.phase === 'idle'
              ? '空闲'
              : `请求 ${slot.request} · ${slot.phase === 'headers' ? '等待响应头' : '读取响应体'}`}
          </h4>
          <div className="network-track">
            {[0, 1, 2].map((i) => (
              <span className={`network-token ${i < 3 - slot.left ? 'is-active' : ''}`} key={i}>
                块 {i + 1} · {i < 3 - slot.left ? '已读' : '待读'}
              </span>
            ))}
          </div>
          <div className="concept-controls">
            <button
              className="button small secondary"
              disabled={slot.phase !== 'headers'}
              onClick={() => act('headers', slot.id)}
            >
              收到响应头
            </button>
            <button
              className="button small"
              disabled={slot.phase !== 'body'}
              onClick={() => act('read', slot.id)}
            >
              读取一块
            </button>
            <button
              className="button small secondary"
              disabled={slot.phase !== 'body'}
              onClick={() => act('abandon', slot.id)}
            >
              提前关闭 Body
            </button>
          </div>
        </div>
      ))}
    </NetworkLabShell>
  );
}
