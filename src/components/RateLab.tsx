import { useEffect, useState } from 'react';
import { ArrowRight, Check, FlaskConical, Pause, Play, RotateCcw } from 'lucide-react';
import { initialBucket, refillBucket, requestTokens } from '../lib/rate-model';
import type { BucketConfig } from '../lib/rate-model';
import { useLearning } from '../state/learning';

export function RateLab() {
  const [config, setConfig] = useState<BucketConfig>({ rate: 2, burst: 3 });
  const [state, setState] = useState(() => initialBucket(config));
  const [count, setCount] = useState(1);
  const [playing, setPlaying] = useState(false);
  const { update } = useLearning();
  const limit = state.ms >= 60000;
  useEffect(() => {
    if (!playing || limit) return;
    const timer = setTimeout(() => setState((old) => refillBucket(old, config, 250)), 500);
    return () => clearTimeout(timer);
  }, [playing, limit, state, config]);
  function reset(next = config) {
    setConfig(next);
    setState(initialBucket(next));
    setPlaying(false);
  }
  const message =
    state.last === 'allowed'
      ? '本次已允许，令牌已扣除。工作耗时不参与此判断，令牌桶没有统计仍在执行的任务。'
      : state.last === 'rejected'
        ? '本次立即拒绝，没有排队，也没有扣除令牌。申请量超过 burst 时，等待桶补满也无法让这次 AllowN 成功。'
        : '令牌随模型时间补充，最多保留 burst 个。桶最初是满的，同一时刻可以消耗多个令牌。';
  return (
    <section className="framed-tool concept-lab" aria-label="令牌桶与突发实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>令牌桶与突发实验</strong>
        </div>
        <span className="live-label">{(state.ms / 1000).toFixed(2)}s</span>
      </div>
      <div className="concept-controls">
        <label>
          速率：{config.rate}/s
          <input
            aria-label="令牌补充速率"
            type="range"
            min="1"
            max="8"
            value={config.rate}
            onChange={(e) => reset({ ...config, rate: Number(e.target.value) })}
          />
        </label>
        <label>
          突发额度：{config.burst}
          <input
            aria-label="突发额度"
            type="range"
            min="1"
            max="10"
            value={config.burst}
            onChange={(e) => reset({ ...config, burst: Number(e.target.value) })}
          />
        </label>
        <label>
          单次申请：{count}
          <input
            aria-label="单次令牌申请量"
            type="range"
            min="1"
            max="12"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="bucket-stage">
        <div className="bucket-readout">
          <span>当前可用令牌</span>
          <strong data-testid="bucket-tokens">{state.tokens.toFixed(2)}</strong>
          <span>/ {config.burst}</span>
        </div>
        <div className="bucket-slots" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div className={i >= config.burst ? 'inactive' : ''} key={i}>
              <span style={{ height: `${Math.max(0, Math.min(1, state.tokens - i)) * 100}%` }} />
              <small>{i + 1}</small>
            </div>
          ))}
        </div>
        <div className="bucket-counts">
          <span>
            允许 <strong data-testid="bucket-allowed">{state.allowed}</strong> 次
          </span>
          <span>
            拒绝 <strong data-testid="bucket-rejected">{state.rejected}</strong> 次
          </span>
        </div>
      </div>
      <div className="concept-controls">
        <button
          className="button small"
          onClick={() => {
            setState(requestTokens(state, config, count));
            update({ labRan: true });
          }}
        >
          <Check size={15} />
          申请令牌
        </button>
        <button
          className="button small secondary"
          disabled={limit}
          onClick={() => {
            setPlaying(false);
            setState(refillBucket(state, config, 250));
            update({ labRan: true });
          }}
        >
          推进 250ms
          <ArrowRight size={15} />
        </button>
        <button
          className="icon-button"
          aria-label={playing && !limit ? '暂停时钟' : '自动推进时钟'}
          title={playing && !limit ? '暂停时钟' : '自动推进时钟'}
          disabled={limit}
          onClick={() => {
            setPlaying(!playing);
            update({ labRan: true });
          }}
        >
          {playing && !limit ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          className="icon-button"
          aria-label="重置令牌桶"
          title="重置令牌桶"
          onClick={() => reset()}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <p className="concept-result" role="status">
        {message}
      </p>
      <details className="lab-assumptions">
        <summary>模型边界</summary>
        <p>
          仅演示有限正速率、固定 burst 与正整数申请的 AllowN。模型时间最多 60
          秒，播放速度不等于真实时间；修改速率或 burst
          会重建满桶。未模拟预约、等待者、动态配置和分布式限流。时间向量与仓库中 x/time/rate v0.16.0
          的真实 Go 测试交叉核对。
        </p>
      </details>
    </section>
  );
}
