export type ContextMode = 'inherit' | 'detached' | 'bounded';
export type BudgetConfig = { mode: ContextMode; parentMs: number; childMs: number };
type EndEvent = { at: number; error: string; cause: string; origin: string };
export const childStartsAt = 300;

export function contextBudget(config: BudgetConfig, now: number, canceledAt: number | null) {
  const deadlineEvent = (at: number, origin: string): EndEvent => ({
    at,
    origin,
    error: 'context.DeadlineExceeded',
    cause: 'context.DeadlineExceeded',
  });
  const parentEvents = [deadlineEvent(config.parentMs, '父请求预算到期')];
  if (canceledAt !== null)
    parentEvents.push({
      at: canceledAt,
      error: 'context.Canceled',
      cause: '调用方取消',
      origin: '父请求主动取消',
    });
  const localDeadline = childStartsAt + config.childMs;
  const childEvents =
    config.mode === 'detached'
      ? []
      : [
          deadlineEvent(
            localDeadline,
            config.mode === 'inherit' && localDeadline === config.parentMs
              ? '父子共同截止时间到期'
              : '子任务自身预算到期',
          ),
          ...(config.mode === 'inherit' ? parentEvents : []),
        ];
  const childDeadline =
    config.mode === 'detached'
      ? null
      : config.mode === 'bounded'
        ? localDeadline
        : Math.min(config.parentMs, localDeadline);
  const view = (deadline: number | null, events: EndEvent[], cancellable: boolean) => {
    const ended = events.filter((event) => event.at <= now).sort((a, b) => a.at - b.at)[0] ?? null;
    return {
      deadline,
      ended,
      remaining: ended ? 0 : deadline === null ? null : Math.max(0, deadline - now),
      done: !cancellable ? 'nil' : ended ? '已关闭' : '尚未关闭',
      error: ended?.error ?? 'nil',
      cause: ended?.cause ?? 'nil',
    };
  };
  return {
    parent: view(config.parentMs, parentEvents, true),
    child: view(childDeadline, childEvents, config.mode !== 'detached'),
  };
}
