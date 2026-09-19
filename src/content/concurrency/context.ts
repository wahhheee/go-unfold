import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const contextLesson: LessonDefinition = {
  id: 'concurrency-context',
  moduleId: 'concurrency',
  label: '2.7 Context 与取消',
  eyebrow: 'CONCURRENCY / CONTEXT',
  title: '请求超时了，工作为什么还没有停？',
  shortTitle: 'Context、截止时间与取消原因',
  path: '/learn/concurrency-context',
  description: [
    '取消是沿调用链传递的协作信号，不是 goroutine 的终止按钮。',
    '把预算、原因、后台任务和清理责任放进同一套生命周期。',
  ],
  minutes: 43,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'cooperation',
      title: '取消信号与实际退出',
      keywords: 'Context Done Err cancel goroutine join 清理',
    },
    { id: 'budget', title: '父子截止时间与总预算', keywords: 'Deadline Timeout 重试 时间预算' },
    { id: 'lab', title: '推进时间，观察取消传播', keywords: '实验 WithoutCancel Cause 父子' },
    {
      id: 'cause',
      title: '谁先取消，留下什么原因',
      keywords: 'WithCancelCause WithTimeoutCause Err 首次',
    },
    {
      id: 'ownership',
      title: '后台任务与取消回调的归属',
      keywords: 'AfterFunc stop WithoutCancel 生命周期',
    },
    { id: 'values', title: '请求值不是任意参数袋', keywords: 'Value key 类型 安全 map 可变数据' },
    { id: 'followups', title: '取消之外仍需保证的事', keywords: '追问 回滚 幂等 超时 泄漏' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '版本 文档 synctest 测试' },
  ],
  sources: [
    {
      title: 'context.Context',
      note: 'Deadline、Done、Err、Value 的契约与并发使用',
      url: 'https://pkg.go.dev/context#Context',
    },
    {
      title: 'context.WithTimeout',
      note: '派生预算与释放资源的 CancelFunc',
      url: 'https://pkg.go.dev/context#WithTimeout',
    },
    {
      title: 'context.WithCancelCause',
      note: 'Go 1.20 起区分 Err 与业务取消原因',
      url: 'https://pkg.go.dev/context#WithCancelCause',
    },
    {
      title: 'context.WithTimeoutCause',
      note: 'Go 1.21 起的到期原因，不等于提前 Cancel 的原因',
      url: 'https://pkg.go.dev/context#WithTimeoutCause',
    },
    {
      title: 'context.WithoutCancel',
      note: '保留值，但移除取消、截止时间与 Cause',
      url: 'https://pkg.go.dev/context#WithoutCancel',
    },
    {
      title: 'context.AfterFunc',
      note: '取消回调、停止返回值与不等待完成的边界',
      url: 'https://pkg.go.dev/context#AfterFunc',
    },
    {
      title: 'Go · Pipelines and cancellation',
      note: '阻塞点必须能接收退出信号',
      url: 'https://go.dev/blog/pipelines',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-context.mdx')),
};

export const contextQuestions: Question[] = [
  {
    id: 'con-context-join',
    lessonId: 'concurrency-context',
    title: 'cancel 不是等待完成',
    prompt: '调用 cancel() 后，可以立即认定所有使用该 Context 的 goroutine 都已退出吗？',
    options: [
      '可以，cancel 会中断所有指令',
      '不可以，任务需要响应取消，完成还要另行等待',
      '可以，只要它们都启动于同一个函数',
    ],
    answer: 1,
    explanations: [
      'Context 不提供任意 goroutine 的强制终止。',
      '正确。Done 表达取消信号，完成通常由 WaitGroup、errgroup 或结果通道确认。',
      '调用栈关系不会自动建立子任务退出和 join。',
    ],
    takeaway: '取消发信号，等待收尾要另做。',
  },
  {
    id: 'con-context-budget',
    lessonId: 'concurrency-context',
    title: '子超时不能续命父请求',
    prompt:
      '父请求总预算 1000ms，运行 300ms 后派生 900ms 的子任务。理想时间模型中子任务最多还剩多少预算？',
    options: ['900ms', '1200ms', '700ms'],
    answer: 2,
    explanations: [
      '子任务仍受父请求更早的截止时间约束。',
      '300+900 是候选截止时刻，但不能越过父请求的 1000ms。',
      '正确。有效截止时间取父截止时间与当前时刻加子预算的较早值；实际可用工作时间还要扣掉调度、排队和清理成本。',
    ],
    takeaway: '子预算可以缩短，不能延长父截止时间。',
  },
  {
    id: 'con-context-cause',
    lessonId: 'concurrency-context',
    title: '业务原因不替换 Err 的分类',
    prompt:
      'ctx, cancel := context.WithCancelCause(parent)，执行 cancel(errQuota)。ctx.Err() 与 context.Cause(ctx) 分别是什么？假设此前未取消。',
    options: [
      'context.Canceled 与 errQuota',
      '都是 errQuota',
      'context.DeadlineExceeded 与 errQuota',
    ],
    answer: 0,
    explanations: [
      '正确。Err 表达标准取消分类，Cause 保留首次取消的具体原因。',
      'Cause 不把 Err 改成任意业务错误。',
      '这里是主动取消，没有到期事件，不能说成超时。',
    ],
    takeaway: 'Err 看分类，Cause 看首次原因。',
  },
  {
    id: 'con-context-detach',
    lessonId: 'concurrency-context',
    title: '脱离取消，也脱离原来的时限',
    prompt: 'detached := context.WithoutCancel(parent)。parent 后来取消了，detached 保留什么？',
    options: [
      '保留原 Deadline，只屏蔽 Done',
      '保留 Value 查询，但无 Deadline，Done 为 nil，Err 和 Cause 均为 nil',
      '成为所有工作自动完成的证明',
    ],
    answer: 1,
    explanations: [
      'WithoutCancel 同时移除截止时间；需要独立预算就重新 WithTimeout。',
      '正确。值仍可能引用请求数据，后台任务还需要明确的拥有者、预算与收尾。',
      '它改变传播关系，不运行、取消或等待任何工作。',
    ],
    takeaway: 'WithoutCancel 保留值，不保留原预算。',
  },
];

export const contextFollowups: FollowupItem[] = [
  {
    question: '把 ctx 传到每个函数，就已经不会泄漏了吗？',
    label: '阻塞点审查',
    answer:
      '没有。每个可能长时间阻塞的操作都要真正响应取消，且清理能完成。裸 channel 发送、Mutex.Lock、不接收 Context 的 I/O 或无限计算循环，都不会因参数列表里有 ctx 自动结束。创建任务的一方仍要负责取消并等待退出。',
    deeper: 'CPU 密集循环怎么响应？',
    point:
      '在合适粒度检查 ctx.Err 或 Done，并控制单步耗时。检查频率是在取消延迟与额外成本之间权衡，运行时抢占本身不会替你返回业务取消。',
  },
  {
    question: '数据库调用超时返回，就一定没有写成功吗？',
    label: '外部副作用',
    answer:
      '不能这么推断。取消可能发生在请求已发送、提交已完成或响应丢失之后。Context 控制本地等待和参与取消的下游操作，不是跨系统回滚协议。需要事务边界、幂等键和结果查询来处理结果未知。',
    deeper: '重试前需要重新给一份完整超时吗？',
    point:
      '通常应让每次尝试和退避都服从同一个总体预算，再给单次调用更小预算；否则每次重试都重新计时会把总体耗时无限推后。',
  },
  {
    question: 'AfterFunc 返回的 stop() 为 false，回调一定已经执行完了吗？',
    label: '回调生命周期',
    answer:
      '不一定。它可能已经开始，也可能之前就被成功停止。stop 不等待运行中的回调结束；需要完成保证时，用回调负责关闭的通道或其他同步方式确认。回调与主路径若都可能释放资源，还必须有一致的资源所有权协议。',
    deeper: 'stop 为 true 后可以等待回调的 done 通道吗？',
    point:
      '如果 done 只由回调关闭，就不能等待：回调已被阻止，永远不会关闭它。是否需要等待必须与 stop 的结果和调用约定对应起来。',
  },
  {
    question: '请求结束后还想保存审计记录，可以直接 WithoutCancel 后 go 吗？',
    label: '后台任务归属',
    answer:
      '只完成了脱离父取消这一步。还要给后台任务设置独立预算、限制并发、安排服务关闭时的等待或终止，并选择必要数据的独立快照。WithoutCancel 会保留父链上的值引用，不保证任务持久化，也不防止进程退出丢失。',
    deeper: '不能丢的记录怎么办？',
    point:
      '用明确的持久化交接协议，例如事务内记录待处理工作后由后台消费。一个脱离请求的 goroutine 不是可靠任务队列。',
  },
];
