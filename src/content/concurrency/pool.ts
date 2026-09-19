import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const poolLesson: LessonDefinition = {
  id: 'concurrency-pool',
  moduleId: 'concurrency',
  label: '2.9 任务池与背压',
  eyebrow: 'CONCURRENCY / BACKPRESSURE',
  title: '队列只有一百格，为什么仍然撑爆内存？',
  shortTitle: '有界任务池与背压',
  path: '/learn/concurrency-pool',
  description: [
    '边界不仅要画在队列上，也要画在启动、等待和结果存储上。',
    '从持续过载推到准入、排空、取消与每个任务的最终去向。',
  ],
  minutes: 44,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'boundary',
      title: '有限队列之外，还可能无限等待',
      keywords: 'goroutine 内存 有界 阻塞 提交 worker',
    },
    { id: 'lab', title: '看见池内与池外的积压', keywords: '实验 队列 工作线程 排空 中止' },
    { id: 'admission', title: '等待、拒绝与丢弃必须有契约', keywords: '准入 超时 背压 重试 过载' },
    {
      id: 'implementation',
      title: '固定工作者和单个生产者',
      keywords: 'errgroup 结果顺序 上限 测试',
    },
    {
      id: 'shutdown',
      title: '停止接单与结束已接单工作',
      keywords: 'drain abort close 关闭 panic 持久化',
    },
    { id: 'followups', title: '从数量追到成本与尾延迟', keywords: '追问 CPU I/O 容量 内存 公平' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '版本 文档 测试' },
  ],
  sources: [
    {
      title: 'Go · Pipelines and cancellation',
      note: '有界并行、提前退出与通道关闭责任',
      url: 'https://go.dev/blog/pipelines',
    },
    {
      title: 'x/sync v0.23.0 · errgroup',
      note: '真实示例使用任务组传播失败并等待退出',
      url: 'https://pkg.go.dev/golang.org/x/sync@v0.23.0/errgroup',
    },
    {
      title: 'Go 规范 · select',
      note: '非阻塞准入与取消竞争的实际语义',
      url: 'https://go.dev/ref/spec#Select_statements',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-pool.mdx')),
};

export const poolQuestions: Question[] = [
  {
    id: 'con-pool-bound',
    lessonId: 'concurrency-pool',
    title: '队列满了，任务转移到哪里',
    prompt:
      '固定 8 个 worker，jobs 容量 100；每次请求都 go func(){ jobs <- job }()。任务总量是否因此有界？',
    options: [
      '是，最多 108 项任务占内存',
      '不是，可能还有任意多个 G 阻塞在队列外提交',
      '是，Go 会自动拒绝超额 G',
    ],
    answer: 1,
    explanations: [
      '这只数了内部队列与执行者，漏掉外部提交者及其持有的数据。',
      '正确。需要在启动额外 G 之前约束准入，并给等待者明确预算或拒绝结果。',
      '运行时不会替业务自动实施这个准入上限。',
    ],
    takeaway: '队列有界，不代表队列外的等待有界。',
  },
  {
    id: 'con-pool-overload',
    lessonId: 'concurrency-pool',
    title: '多放一点缓冲能解决持续过载吗',
    prompt: '长期到达速度持续超过处理速度，将队列容量扩大十倍能根治问题吗？',
    options: [
      '能，缓冲会提高每个任务的处理速度',
      '能，只要内存足够',
      '不能，只能延后满载并积累更久的等待，仍需控制到达或提高有效处理能力',
    ],
    answer: 2,
    explanations: [
      '队列通常不改变单任务服务成本和下游上限。',
      '容量无限也会让等待时间持续增长，超时后任务可能已无价值。',
      '正确。容量用于吸收有限波动，不能代替过载时的准入与降载。',
    ],
    takeaway: '缓冲吸收波动，不消灭长期的收支缺口。',
  },
  {
    id: 'con-pool-order',
    lessonId: 'concurrency-pool',
    title: '结果要按输入顺序，完成也要串行吗',
    prompt: '固定 worker 并行处理有限输入，又要求返回结果按输入排列。可以怎样做？',
    options: [
      '给任务携带输入下标，预分配结果数组，每个任务写自己的位置，最后等待',
      '多个 worker 同时 append 到共享 slice 即可',
      '只能把 worker 数设为 1',
    ],
    answer: 0,
    explanations: [
      '正确。独立位置和完成后的同步保持结果次序，任务本身仍可并行完成。',
      '不仅完成顺序不等于输入顺序，共享 append 还需要同步。',
      '结果排列顺序和执行时序是不同需求。',
    ],
    takeaway: '用编号组织结果，不用串行假装有序。',
  },
  {
    id: 'con-pool-close',
    lessonId: 'concurrency-pool',
    title: '先 close，再让提交者自己退出？',
    prompt: '多个请求可能还在发送 jobs。服务关闭时直接 close(jobs)，再等它们结束，安全吗？',
    options: [
      '安全，关闭只影响接收者',
      '不安全，必须先完成停止准入与发送者退出协议，避免向关闭通道发送',
      '安全，只要用了 sync.Once 关闭',
    ],
    answer: 1,
    explanations: [
      '发送到已关闭通道会 panic，正在阻塞的发送者也受影响。',
      '正确。谁能提交、何时不再有发送、谁负责 close，要有同一个可证明的协议。',
      'Once 防止重复 close，不能保证没有并发发送。',
    ],
    takeaway: '关闭队列之前，先证明不会再发送。',
  },
];

export const poolFollowups: FollowupItem[] = [
  {
    question: '给所有 Submit 都加 Context 超时，就不会积压了吗？',
    label: '等待者数量',
    answer:
      '单个等待变短不等于同时等待的人数有上限。到达很快时，即便每人只等一秒，也能累积很多 G 和请求体。应同时限制等待者数量或在准入处立即拒绝，且上游要能感知这个结果。',
    deeper: '在提交前先看 len(jobs)<cap(jobs) 呢？',
    point:
      '它只是瞬时快照，检查后其他提交者可能填满队列。需要非阻塞 select 或显式准入同步，不能把检查与发送当成一个原子动作。',
  },
  {
    question: 'worker 数量按 CPU 核数设置就够了吗？',
    label: '有效瓶颈',
    answer:
      'CPU 密集、I/O 等待、数据库连接额度和下游并发上限需要分别考虑。盲目增加 worker 可能只把等待转移到连接池，还增加调度、内存和尾延迟。根据服务时间、活跃并发、等待时间、下游饱和与吞吐测量调整。',
    deeper: '固定 worker 数后，内存一定可估算吗？',
    point:
      '还要约束单任务数据大小、队列长度、外部等待者、结果保留和每个任务派生的子工作。一个 worker 内再无限 go，会绕开外层上限。',
  },
  {
    question: '排空模式一定比中止模式好吗？',
    label: '关闭语义',
    answer:
      '取决于任务时效和服务退出预算。排空要停止准入，再等待已接纳任务完成；超过关闭期限可能需要升级为取消。中止也只是协作通知，仍要等待清理，已发生的外部副作用不会被撤销。不可丢任务还需要持久化与恢复协议。',
    deeper: '取消的任务直接重试就行吗？',
    point:
      '取消只说明本次执行未交付正常结果，外部操作可能已成功。重试必须考虑幂等键、事务状态或结果查询，不能假定取消等于从未执行。',
  },
  {
    question: '结果队列也满了，worker 会不会一起卡住？',
    label: '整条链的背压',
    answer:
      '会。结果发送同样是阻塞点；调用方提前返回时，worker 若仍裸发送结果就可能泄漏。可以给结果发送取消出口，并由拥有者等待退出；有限批任务也可预分配结果位置，但要承认结果数组仍随输入规模增长。',
    deeper: '共享一个全局队列可以保证租户公平吗？',
    point:
      '不能自动保证。大租户可能占满队列，长任务可能拖住短任务。需要按成本和租户设计额度、队列隔离或调度策略，并测量实际公平性。',
  },
];
