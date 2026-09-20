import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { dnsStep, newDnsState } from '../lib/dns-model';
import type { DnsEvent } from '../lib/dns-model';
import { NetworkCells, NetworkLabShell } from './NetworkLabShell';
import { useLearning } from '../state/learning';

export function DnsLab() {
  const [ttl, setTtl] = useState(30);
  const [state, setState] = useState(newDnsState);
  const { update } = useLearning();
  function act(event: DnsEvent) {
    setState(dnsStep(state, event, ttl));
    update({ labRan: true });
  }
  return (
    <NetworkLabShell
      title="DNS 缓存与连接路由实验"
      badge={`${state.now}s`}
      message={state.message}
      assumptions="只模拟一个递归解析器、一条 A 记录和一条可复用的空闲连接；固定 TTL，不启用预取、serve-stale、负缓存、CNAME、代理或双栈竞速。查询次数指缓存未命中后向权威查询的次数，不代表真实 DNS 报文数。真实 Go Resolver 不保证提供这里的进程内 TTL 缓存。"
    >
      <div className="concept-controls">
        <label>
          缓存 TTL：{ttl}s
          <input
            aria-label="缓存 TTL"
            type="range"
            min="10"
            max="60"
            step="10"
            value={ttl}
            onChange={(e) => {
              setTtl(Number(e.target.value));
              setState(newDnsState());
            }}
          />
        </label>
      </div>
      <NetworkCells
        cells={[
          {
            title: '权威记录',
            value: state.authority,
            detail: 'api.example.test → A',
            active: state.path.includes('权威 DNS'),
          },
          {
            title: '递归缓存',
            value: state.cache?.address ?? '尚未缓存',
            detail: state.cache
              ? `剩余 ${Math.max(0, state.cache.expires - state.now)}s${state.now >= state.cache.expires ? ' · 已过期' : ''}`
              : '等待第一次解析',
            active: state.path.includes('递归缓存'),
          },
          {
            title: '连接目的地址',
            value: state.connection ?? '尚无连接',
            detail: '地址在建立连接时确定',
            active: !!state.connection,
          },
        ]}
      />
      <div className="network-route" aria-label="本次请求路径">
        {state.path.length ? (
          state.path.map((node, i) => (
            <span key={`${i}-${node}`}>
              {i > 0 && <ArrowRight size={16} aria-hidden="true" />}
              {node}
            </span>
          ))
        ) : (
          <span>等待下一次操作</span>
        )}
      </div>
      <div className="concept-controls">
        <button className="button small" onClick={() => act('request')}>
          发起请求
        </button>
        <button className="button small secondary" onClick={() => act('switch')}>
          切换权威地址
        </button>
        <button className="button small secondary" onClick={() => act('tick')}>
          推进 10 秒
        </button>
        <button
          className="button small secondary"
          disabled={!state.connection}
          onClick={() => act('close')}
        >
          关闭空闲连接
        </button>
        <button
          className="icon-button"
          aria-label="重置 DNS 实验"
          onClick={() => setState(newDnsState())}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <p className="network-caption">
        向权威查询：<strong data-testid="dns-queries">{state.queries}</strong> 次
      </p>
    </NetworkLabShell>
  );
}
