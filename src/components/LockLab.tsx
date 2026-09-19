import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  Braces,
  Check,
  ChevronRight,
  FlaskConical,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SkipForward,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { defaultConfig, parseConfig, simulateLock } from '../lib/lock-simulation';
import type { LockConfig } from '../lib/lock-simulation';
import { useLearning } from '../state/learning';

const JsonEditor = lazy(() =>
  import('./JsonEditor').then((module) => ({ default: module.JsonEditor })),
);
const presets: { title: string; patch: Partial<LockConfig> }[] = [
  { title: '过期后继续写', patch: {} },
  { title: '误删别人的锁', patch: { safeUnlock: false } },
  { title: '续租遇上长暂停', patch: { renew: true } },
  { title: '资源拒绝旧写入', patch: { fencing: true } },
];

export function LockLab() {
  const [config, setConfig] = useState<LockConfig>(defaultConfig);
  const [source, setSource] = useState(JSON.stringify(defaultConfig, null, 2));
  const [mode, setMode] = useState<'params' | 'code'>('params');
  const [error, setError] = useState('');
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [preset, setPreset] = useState(0);
  const { update } = useLearning();
  const simulation = useMemo(() => simulateLock(config), [config]);
  const current = simulation.events[step];
  const visibleEvents = simulation.events.slice(0, step + 1);
  const aAttemptedWrite = visibleEvents.some(
    (event) => event.actor === 'A' && (event.kind === 'write' || event.kind === 'reject'),
  );
  const bHasAcquired = visibleEvents.some(
    (event) => event.actor === 'B' && event.kind === 'acquire',
  );
  const done = step === simulation.events.length - 1;
  const time = current?.time ?? 0;
  useEffect(() => {
    if (!playing) return;
    const timeout = window.setTimeout(() => {
      if (step < simulation.events.length - 1) {
        setStep((value) => value + 1);
        if (step + 1 === simulation.events.length - 1) setPlaying(false);
      } else setPlaying(false);
    }, 750);
    return () => window.clearTimeout(timeout);
  }, [playing, step, simulation.events.length]);
  function change(patch: Partial<LockConfig>) {
    const next = { ...config, ...patch };
    setConfig(next);
    setSource(JSON.stringify(next, null, 2));
    setStep(-1);
    setPlaying(false);
    setError('');
    setPreset(-1);
  }
  function run() {
    if (mode === 'code') {
      try {
        const next = parseConfig(source);
        setConfig(next);
        setError('');
      } catch (cause) {
        setError((cause as Error).message);
        return;
      }
    }
    setStep(0);
    setPlaying(true);
    update({ labRan: true });
  }
  const toggles: { key: 'renew' | 'pause' | 'safeUnlock' | 'fencing'; label: string }[] = [
    { key: 'renew', label: '自动续租' },
    { key: 'pause', label: 'A 发生长暂停' },
    { key: 'safeUnlock', label: '解锁校验 token' },
    { key: 'fencing', label: '资源校验 fencing' },
  ];
  return (
    <section className="lock-lab framed-tool" aria-label="分布式锁实验室">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>分布式锁实验室</strong>
        </div>
        <span className="live-label">
          <span />
          本地模拟
        </span>
      </div>
      <div className="lab-presets" aria-label="实验场景">
        {presets.map((item, index) => (
          <button
            key={item.title}
            className={preset === index ? 'active' : ''}
            aria-pressed={preset === index}
            onClick={() => {
              const next = { ...defaultConfig, ...item.patch };
              setConfig(next);
              setSource(JSON.stringify(next, null, 2));
              setPreset(index);
              setStep(-1);
              setPlaying(false);
              setError('');
            }}
          >
            {String(index + 1).padStart(2, '0')}
            <span>{item.title}</span>
          </button>
        ))}
      </div>
      <div className="lab-config">
        <div className="lab-config-heading">
          <span>实验配置</span>
          <div className="segmented">
            <button
              className={mode === 'params' ? 'active' : ''}
              aria-pressed={mode === 'params'}
              onClick={() => {
                if (mode === 'code') {
                  try {
                    setConfig(parseConfig(source));
                    setStep(-1);
                    setPlaying(false);
                    setError('');
                  } catch (cause) {
                    setError((cause as Error).message);
                    return;
                  }
                }
                setMode('params');
              }}
            >
              <Settings2 size={13} />
              参数
            </button>
            <button
              className={mode === 'code' ? 'active' : ''}
              aria-pressed={mode === 'code'}
              onClick={() => setMode('code')}
            >
              <Braces size={13} />
              JSON
            </button>
          </div>
        </div>
        {mode === 'params' ? (
          <>
            <div className="lab-sliders">
              <label>
                <span>
                  租约时长 TTL{' '}
                  <b>
                    {config.ttl}
                    <small> 秒</small>
                  </b>
                </span>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={config.ttl}
                  onChange={(event) => change({ ttl: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>
                  A 完成写入的时刻{' '}
                  <b>
                    {config.work}
                    <small> 秒</small>
                  </b>
                </span>
                <input
                  type="range"
                  min="3"
                  max="14"
                  step="1"
                  value={config.work}
                  onChange={(event) => change({ work: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="lab-toggles">
              {toggles.map(({ key, label }) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={config[key]}
                    onChange={(event) => change({ [key]: event.target.checked })}
                  />
                  <span className="toggle-track">
                    <span />
                  </span>
                  {label}
                </label>
              ))}
            </div>
          </>
        ) : (
          <Suspense fallback={<div className="editor-loading">正在加载编辑器…</div>}>
            <JsonEditor
              value={source}
              onChange={(value) => {
                setSource(value);
                setPlaying(false);
                setStep(-1);
                setError('');
              }}
            />
          </Suspense>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="lab-scene">
        <div className="scene-status">
          <span>
            <Timer size={14} /> t = {time.toFixed(1)} s
          </span>
          <span>
            {step < 0 ? '等待运行' : playing ? '模拟进行中' : done ? '模拟完成' : '已暂停'}
          </span>
        </div>
        <div className="system-nodes">
          <div className={`system-node ${current?.owner === 'A' ? 'owns a' : ''}`}>
            <span className="node-icon">A</span>
            <strong>请求 A</strong>
            <small>
              {aAttemptedWrite
                ? '业务已恢复并尝试写入'
                : step < 0
                  ? '待获取租约'
                  : config.pause && time >= 1
                    ? '进程暂停中'
                    : '处理业务中'}
            </small>
          </div>
          <div className="node-connection">
            <span />
            <ChevronRight size={15} />
          </div>
          <div className="system-node redis-node">
            <LockKeyhole size={25} />
            <strong>Redis 租约</strong>
            <small>{current?.owner ? `当前持有者 ${current.owner}` : '无持有者'}</small>
          </div>
          <div className="node-connection">
            <span />
            <ChevronRight size={15} />
          </div>
          <div className={`system-node ${current?.owner === 'B' ? 'owns b' : ''}`}>
            <span className="node-icon">B</span>
            <strong>请求 B</strong>
            <small>
              {time < config.ttl + 1
                ? '等待发起请求'
                : bHasAcquired
                  ? '已取得过新租约'
                  : '未取得租约'}
            </small>
          </div>
        </div>
        <div className="timeline" aria-label="模拟事件时间轴">
          <div className="timeline-track">
            <div style={{ width: `${(time / simulation.duration) * 100}%` }} />
            {simulation.events.map((event, index) => (
              <button
                key={index}
                title={`${event.time.toFixed(1)}s · ${event.text}`}
                aria-label={`跳到事件 ${index + 1}：${event.text}`}
                className={`${index <= step ? 'visited' : ''} ${event.kind === 'reject' || event.kind === 'expire' ? 'critical' : ''}`}
                style={{ left: `${(event.time / simulation.duration) * 100}%` }}
                onClick={() => {
                  setStep(index);
                  setPlaying(false);
                  update({ labRan: true });
                }}
              />
            ))}
          </div>
          <div className="timeline-labels">
            <span>0 s</span>
            <span>{simulation.duration.toFixed(1)} s</span>
          </div>
        </div>
        <div
          className={`event-display ${current?.kind === 'reject' ? 'protected' : ''}`}
          aria-live="polite"
        >
          <span className="event-tag">{current?.actor ?? 'READY'}</span>
          <span>{current?.text ?? 'A 先拿到锁。如果它停顿太久，会发生什么？'}</span>
        </div>
        <div className="resource-state">
          <ShieldCheck size={14} />
          <span>受保护资源</span>
          <span>
            最后写入：<b>{current?.lastWriter ?? '暂无'}</b>
          </span>
          <span>
            最大 fence：<b>{current?.highestFence || '—'}</b>
          </span>
        </div>
      </div>
      <div className="lab-controls">
        <button
          className="button"
          onClick={() => {
            if (playing) setPlaying(false);
            else if (step >= 0 && !done) setPlaying(true);
            else run();
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          {playing ? '暂停' : step >= 0 && !done ? '继续运行' : done ? '重新运行' : '运行实验'}
        </button>
        <button
          className="icon-button"
          aria-label="下一步"
          title="下一步"
          disabled={done || (mode === 'code' && step < 0)}
          onClick={() => {
            setStep((value) => Math.min(value + 1, simulation.events.length - 1));
            setPlaying(false);
            update({ labRan: true });
          }}
        >
          <SkipForward size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="重置实验进度"
          title="重置实验进度"
          onClick={() => {
            setStep(-1);
            setPlaying(false);
          }}
        >
          <RotateCcw size={16} />
        </button>
        <span>
          {step + 1} / {simulation.events.length} 个事件
        </span>
      </div>
      {done && (
        <div
          className={`lab-result ${simulation.staleWrite || simulation.wrongUnlock ? 'warning' : 'success'}`}
          role="status"
        >
          {simulation.staleWrite || simulation.wrongUnlock ? (
            <TriangleAlert size={18} />
          ) : (
            <Check size={18} />
          )}
          <div>
            <strong>
              {simulation.wrongUnlock
                ? '旧持有者误删了新租约。'
                : simulation.staleWrite
                  ? '锁没有被误删，旧写入仍然成功了。'
                  : simulation.events.some((event) => event.kind === 'reject')
                    ? '资源端拒绝了过期持有者的写入。'
                    : '本次时间安排下，没有出现旧写入。'}
            </strong>
            <p>
              {simulation.overlap
                ? 'A 与 B 的业务生命周期发生重叠。租约到期不会终止 A 的代码。'
                : '一次模拟成功不代表所有故障下都正确；试试增加业务耗时或开启长暂停。'}
            </p>
          </div>
        </div>
      )}
      <details className="lab-assumptions">
        <summary>模型假设与边界</summary>
        <p>
          这是确定性的离散事件模拟，不连接真实 Redis，也不执行 Go。B 在 TTL + 1 秒尝试一次，成功后
          0.5 秒写入、4 秒后释放；A 的长暂停从第 1 秒持续到写入时刻。续租间隔为初始 TTL 的
          60%，暂停时无法续租。fence=41/42
          是理想单调发号器提供的示例值；实验不模拟复制、时钟漂移、网络超时或发号器故障。
        </p>
        <p>
          fencing 只拒绝资源已经观察到的较新 token
          之前的旧写入；它不会回滚过去的副作用，也不是通用的“业务恰好执行一次”保证。
        </p>
      </details>
    </section>
  );
}
