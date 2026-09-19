import { useEffect, useState } from 'react';
import { ArrowRight, Ban, FlaskConical, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { advancePool, initialPool, poolFinished, serviceTicks, stopPool } from '../lib/pool-model';
import type { PoolConfig } from '../lib/pool-model';
import { useLearning } from '../state/learning';

export function PoolLab() {
  const [config, setConfig] = useState<PoolConfig>({
    workers: 2,
    capacity: 3,
    arrivals: 4,
    policy: 'spawn',
  });
  const [state, setState] = useState(() => initialPool(2));
  const [playing, setPlaying] = useState(false);
  const { update } = useLearning();
  const finished = poolFinished(state);
  const atLimit = state.mode === 'open' && state.tick >= 60;
  useEffect(() => {
    if (!playing || finished || atLimit) return;
    const timer = setTimeout(() => setState((old) => advancePool(old, config)), 750);
    return () => clearTimeout(timer);
  }, [playing, state, config, finished, atLimit]);
  function reset(next = config) {
    setConfig(next);
    setState(initialPool(next.workers));
    setPlaying(false);
  }
  function stop(mode: 'draining' | 'aborted') {
    setState(stopPool(state, mode));
    setPlaying(false);
    update({ labRan: true });
  }
  const message = finished
    ? state.mode === 'aborted'
      ? '已中止：未完成任务计入取消，外部提交者已拒绝。模型将取消清理视为即时完成。'
      : '已排空：已接纳的任务全部完成，外部等待提交者已拒绝。'
    : state.mode === 'draining'
      ? '准入已关闭。继续推进，让已接纳的队列和工作者排空；需要中止时仍可升级退出策略。'
      : state.outside.length
        ? `内部队列只有 ${state.queue.length} 项，但外部已有 ${state.outside.length} 个提交者等待。把等待放进新 G，并没有消除积压。`
        : atLimit
          ? '到达流的观测窗口结束。已接纳工作仍需排空或中止，外部等待者也需要明确结果。'
          : config.policy === 'spawn'
            ? '本轮尚无外部积压。满载后的新任务将各占用一个额外 G，等待内部出现空位。'
            : '工作者与内部队列有固定上限；满载时拒绝的任务会明确计数。每项任务占用工作者 2 步。';
  return (
    <section className="framed-tool concept-lab" aria-label="有界任务池与背压实验">
      <div className="lab-header">
        <div>
          <FlaskConical size={19} />
          <strong>有界任务池与背压实验</strong>
        </div>
        <span className="live-label">第 {state.tick} 步</span>
      </div>
      <div className="concept-controls">
        <label>
          满载策略
          <select
            value={config.policy}
            onChange={(event) =>
              reset({ ...config, policy: event.target.value as PoolConfig['policy'] })
            }
          >
            <option value="spawn">新建 G 等待提交</option>
            <option value="reject">立即拒绝</option>
          </select>
        </label>
        <label>
          工作者：{config.workers}
          <input
            type="range"
            min="1"
            max="4"
            aria-label="工作者数量"
            value={config.workers}
            onChange={(event) => reset({ ...config, workers: Number(event.target.value) })}
          />
        </label>
        <label>
          队列容量：{config.capacity}
          <input
            type="range"
            min="0"
            max="6"
            aria-label="队列容量"
            value={config.capacity}
            onChange={(event) => reset({ ...config, capacity: Number(event.target.value) })}
          />
        </label>
        <label>
          每步到达：{config.arrivals}
          <input
            type="range"
            min="0"
            max="8"
            aria-label="每步到达任务"
            value={config.arrivals}
            onChange={(event) => reset({ ...config, arrivals: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="pool-stage">
        <div className="pool-workers">
          {Array.from({ length: 4 }, (_, index) => (
            <div className={index >= config.workers ? 'inactive' : ''} key={index}>
              <strong>W{index + 1}</strong>
              <span>
                {index >= config.workers
                  ? '未启用'
                  : state.running[index]
                    ? `任务 ${state.running[index]!.id}`
                    : '空闲'}
              </span>
              <progress
                aria-label={`工作者 ${index + 1} 剩余步数`}
                max={serviceTicks}
                value={state.running[index]?.remaining ?? 0}
              />
            </div>
          ))}
        </div>
        <div className="pool-queue">
          <strong>
            内部队列 · {state.queue.length}/{config.capacity}
          </strong>
          <div>
            {Array.from({ length: 6 }, (_, index) => (
              <span className={index >= config.capacity ? 'inactive' : ''} key={index}>
                {index >= config.capacity
                  ? '禁用'
                  : state.queue[index]
                    ? `#${state.queue[index]}`
                    : '空位'}
              </span>
            ))}
          </div>
        </div>
        <dl className="pool-totals">
          <div>
            <dt>外部等待</dt>
            <dd data-testid="pool-outside">{state.outside.length}</dd>
          </div>
          <div>
            <dt>已完成</dt>
            <dd>{state.completed}</dd>
          </div>
          <div>
            <dt>已拒绝</dt>
            <dd data-testid="pool-rejected">{state.rejected}</dd>
          </div>
          <div>
            <dt>已取消</dt>
            <dd data-testid="pool-canceled">{state.canceled}</dd>
          </div>
        </dl>
      </div>
      <div className="concept-controls">
        <button
          className="button small"
          disabled={finished || atLimit}
          onClick={() => {
            setPlaying(false);
            setState(advancePool(state, config));
            update({ labRan: true });
          }}
        >
          推进一步
          <ArrowRight size={15} />
        </button>
        <button
          className="icon-button"
          title={playing && !finished && !atLimit ? '暂停播放' : '自动播放'}
          aria-label={playing && !finished && !atLimit ? '暂停播放' : '自动播放'}
          disabled={finished || atLimit}
          onClick={() => {
            setPlaying(!playing);
            update({ labRan: true });
          }}
        >
          {playing && !finished && !atLimit ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          className="button small secondary"
          disabled={state.mode !== 'open'}
          onClick={() => stop('draining')}
        >
          <Square size={14} />
          停止接单并排空
        </button>
        <button
          className="icon-button"
          title="中止未完成任务"
          aria-label="中止未完成任务"
          disabled={finished}
          onClick={() => stop('aborted')}
        >
          <Ban size={16} />
        </button>
        <button
          className="icon-button"
          title="重置任务池"
          aria-label="重置任务池"
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
          到达流最多展示 60 步，停止准入后仍可完成排空。每个任务固定执行 2
          步，每步先完成与补位，再接收新任务；内部队列与外部提交者按先进先出推进。停止准入会拒绝尚在外部等待的提交者；中止将清理简化为即时完成。真实
          Go 调度不承诺该时序，真实取消也不能强杀任务，外部副作用不会被回滚。
        </p>
      </details>
    </section>
  );
}
