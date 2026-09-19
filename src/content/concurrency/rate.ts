import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const rateLesson: LessonDefinition = {
  id: 'concurrency-rate',
  moduleId: 'concurrency',
  label: '2.10 限流与额度',
  eyebrow: 'CONCURRENCY / ADMISSION',
  title: '每秒一百次，为什么仍然压垮下游？',
  shortTitle: '限流、并发额度与等待预算',
  path: '/learn/concurrency-rate',
  description: [
    '速率管到达节奏，并发额度管同时占用，超时管等待预算。',
    '用令牌桶实验和真实扩展库，把三个边界放回同一条请求路径。',
  ],
  minutes: 43,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'dimensions',
      title: '速率、并发与队列是三个量',
      keywords: 'RPS 吞吐 服务时间 并发 背压',
    },
    { id: 'lab', title: '令牌桶允许怎样的突发', keywords: '实验 token bucket burst AllowN' },
    {
      id: 'rate',
      title: '拒绝、预约与等待的区别',
      keywords: 'Allow Reserve Wait Context deadline 退还',
    },
    {
      id: 'weighted',
      title: '先取得额度，再启动工作',
      keywords: 'semaphore Weighted Acquire Release 权重',
    },
    { id: 'budget', title: '整条路径共用一个预算', keywords: '超时 准入 排队 等待 组合' },
    {
      id: 'followups',
      title: '从单机额度追到公平与集群',
      keywords: '追问 租户 集群 公平 队头阻塞',
    },
    { id: 'sources', title: '记忆锚点与真实核验', keywords: '版本 文档 源码 测试' },
  ],
  sources: [
    {
      title: 'x/time v0.16.0 · rate',
      note: '初始满桶、突发、Allow / Reserve / Wait 与取消契约',
      url: 'https://pkg.go.dev/golang.org/x/time@v0.16.0/rate',
    },
    {
      title: 'x/sync v0.23.0 · semaphore',
      note: '加权额度、Acquire 的取消与释放责任，附版本源码',
      url: 'https://pkg.go.dev/golang.org/x/sync@v0.23.0/semaphore',
    },
    {
      title: 'Go · Context',
      note: '统一截止时间与协作取消的边界',
      url: 'https://pkg.go.dev/context',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-rate.mdx')),
};
export const rateQuestions: Question[] = [
  {
    id: 'con-rate-burst',
    lessonId: 'concurrency-rate',
    title: '每秒两枚令牌，开场能用几枚',
    prompt: 'rate.NewLimiter(2, 3) 创建后，没有其他请求。能否立刻 AllowN(now, 3)？',
    options: [
      '不能，必须等 1.5 秒',
      '能，初始桶为满桶，burst 允许一次消耗 3 枚',
      '不能，速率 2 表示任意一次最多取 2 枚',
    ],
    answer: 1,
    explanations: [
      '补充速率决定耗尽后的恢复，初始额度已经存在。',
      '正确。持续补充速率和突发额度是不同参数，不能把 r 当成硬并发上限。',
      '单次有限速率申请受 burst 限制，而不是直接受 r 的数值限制。',
    ],
    takeaway: 'r 管补充，burst 管可积累的突发。',
  },
  {
    id: 'con-rate-concurrency',
    lessonId: 'concurrency-rate',
    title: '下游变慢，哪项边界仍然缺失',
    prompt:
      '入口每秒最多允许一定量请求，但没有活跃任务上限。下游响应从很快变成很慢，可能发生什么？',
    options: [
      '令牌桶会自动减少活跃任务',
      '只要限了 RPS，就不会积累并发',
      '仍在处理的任务会堆积，需要并发额度和等待预算',
    ],
    answer: 2,
    explanations: [
      '令牌桶通常不记录业务任务何时结束，无法仅凭令牌回收活跃名额。',
      '相同到达节奏下，任务持有资源越久，同时占用就可能越多。',
      '正确。应分别控制速率、同时占用和等待队列，并观察下游饱和。',
    ],
    takeaway: '限制开始频率，不等于限制同时活跃。',
  },
  {
    id: 'con-rate-release',
    lessonId: 'concurrency-rate',
    title: 'Acquire 失败后还要 Release 吗',
    prompt: 'semaphore.Weighted.Acquire(ctx, 2) 返回取消错误，该调用应该如何处理额度？',
    options: [
      '不调用 Release，因为失败没有取得额度',
      '仍然 defer Release(2)，保证对称',
      '重试 Release，直到额度恢复',
    ],
    answer: 0,
    explanations: [
      '正确。成功申请才拥有对应的释放责任；失败会保持额度不变。',
      '这种表面对称会释放并不拥有的额度，可能破坏他人配额或触发 panic。',
      'Release 不是幂等补偿接口，只能释放实际持有的额度且恰好一次。',
    ],
    takeaway: '先确认取得，再建立释放责任。',
  },
  {
    id: 'con-rate-deadline',
    lessonId: 'concurrency-rate',
    title: 'Wait 返回错误，Context 一定已过期吗',
    prompt: '令牌需再等 500ms，但 Context 的截止时间在 100ms 后。Wait 可能如何返回？',
    options: [
      '必须等待 100ms 后才能报错',
      '可立即报告预计等待超出截止时间，此时 ctx.Err() 仍为 nil',
      '先允许工作，等 Context 过期再回滚',
    ],
    answer: 1,
    explanations: [
      'Wait 可根据剩余预算提前发现不可能按时获得令牌。',
      '正确。应处理 Wait 返回的 error，不能只检查 ctx.Err()，也不能把所有限流等待错误都断言为 DeadlineExceeded。',
      '限流器不会替业务撤回已经发生的工作。',
    ],
    takeaway: '预计来不及，也是一种独立的准入失败。',
  },
];
export const rateFollowups: FollowupItem[] = [
  {
    question: '每台机器限 100 RPS，十台机器就是集群限 100 吗？',
    label: '额度作用域',
    answer:
      '不是。独立满桶各自补充，集群总准入可能随副本数和突发额度一起放大。先定义额度是针对单进程、租户、接口还是全局，再考虑共享协调、额度分配及故障期间的策略。',
    deeper: '按租户创建一个 limiter 放进 map 就够了？',
    point:
      '还要限制键的基数与生命周期，统一同一租户的对象，处理并发创建、过期和回收。随意删除再建会重新发放初始 burst，攻击者也可能用大量新键消耗内存。',
  },
  {
    question: '信号量剩 1 份额度，小任务只要 1 份，为什么还在等？',
    label: '队头阻塞',
    answer:
      '在核验版本的加权信号量中，排在前面的申请若需要更多额度，会阻止后面的小申请绕过，以避免大申请长期饥饿。代价是某些空闲额度暂时用不满。',
    deeper: '这就证明它对每个租户都公平吗？',
    point:
      '不能。内部等待顺序不等于租户公平，也没有等待时间上限。要按租户和任务成本设计准入，必要时分队列，并结合实际负载验证。',
  },
  {
    question: '已经拿到令牌，业务失败了，要把令牌退回去吗？',
    label: '计费事件',
    answer:
      '先定义限制的是尝试、成功、字节还是其他成本。Allow 消耗的是准入事件，没有一个可随意调用的通用退还接口。Reserve 的取消表示放弃尚未使用的预约，也只能在考虑后续预约后尽量恢复影响。',
    deeper: '取消前面的预约，后面的人会自动提前收到通知吗？',
    point:
      '不要假定如此。预约给出可执行时间，调用方管理等待；后续已有预约不会因此自动全部重排并通知。需要可取消等待时优先使用 Wait，并仍然约束等待者数量。',
  },
  {
    question: '先拿信号量，再等令牌，是不是最标准的写法？',
    label: '组合代价',
    answer:
      '它能让已启动工作数量受控，但等待令牌期间会占住并发额度。先等令牌再拿信号量则可能消耗了令牌却没有及时开始工作，且取得额度的延迟可能让后续开始时刻聚集。没有脱离目标的固定顺序。',
    deeper: '怎么判断组合是否正确？',
    point:
      '明确要限制的事件发生在哪里、额度覆盖哪些阶段、等待者是否有界，并让排队和执行共用总体预算。若需要同时满足多个条件，可使用拥有统一准入逻辑的调度器；不要把独立阻塞调用拼接后就声称语义自动成立。',
  },
];
