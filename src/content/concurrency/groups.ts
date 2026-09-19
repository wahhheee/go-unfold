import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const groupsLesson: LessonDefinition = {
  id: 'concurrency-groups',
  moduleId: 'concurrency',
  label: '2.8 任务组与请求合并',
  eyebrow: 'CONCURRENCY / TASK GROUPS',
  title: '第一个任务失败，其他工作由谁收尾？',
  shortTitle: '任务组、流水线与请求合并',
  path: '/learn/concurrency-groups',
  description: [
    '把一组工作的错误、取消和等待放在同一个拥有者手里。',
    '理解 errgroup、流水线和 singleflight 各自承诺到哪里。',
  ],
  minutes: 46,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'group',
      title: '错误触发取消，Wait 等待全部',
      keywords: 'errgroup WithContext Wait error panic',
    },
    { id: 'limit', title: '限制启动，也可能阻塞启动者', keywords: 'SetLimit TryGo 嵌套 死锁 准入' },
    {
      id: 'pipeline',
      title: '下游提前结束，上游必须有出口',
      keywords: 'pipeline 流水线 close send 取消 goroutine',
    },
    { id: 'lab', title: '沿着生命周期追到最后', keywords: '实验 时间线 泄漏 合并' },
    {
      id: 'singleflight',
      title: '相同在途请求，只计算一份',
      keywords: 'singleflight DoChan Shared Forget 缓存 key 租户',
    },
    { id: 'followups', title: '谁拥有共享工作的取消权', keywords: '追问 超时 取消 错误 所有权' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '版本 x/sync 官方 测试' },
  ],
  sources: [
    {
      title: 'x/sync v0.23.0 · errgroup',
      note: '错误、取消、Wait 和并发额度的精确契约',
      url: 'https://pkg.go.dev/golang.org/x/sync@v0.23.0/errgroup',
    },
    {
      title: 'x/sync v0.23.0 · singleflight',
      note: '在途去重、DoChan、Shared 与 Forget',
      url: 'https://pkg.go.dev/golang.org/x/sync@v0.23.0/singleflight',
    },
    {
      title: 'Go · Pipelines and cancellation',
      note: '阶段关闭责任、下游提前退出和上游取消',
      url: 'https://go.dev/blog/pipelines',
    },
    {
      title: 'Go · context',
      note: '取消传播与工作生命周期的区别',
      url: 'https://pkg.go.dev/context',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-groups.mdx')),
};

export const groupsQuestions: Question[] = [
  {
    id: 'con-groups-wait',
    lessonId: 'concurrency-groups',
    title: '成功完成，也会结束派生 Context',
    prompt:
      'g, child := errgroup.WithContext(parent)，所有任务返回 nil，g.Wait() 也返回 nil。之后还能用 child 发起下一次请求吗？',
    options: [
      '能，只有错误才会取消 child',
      '不应复用，Wait 返回时也会取消 child',
      '能，只要 parent 还没到期',
    ],
    answer: 1,
    explanations: [
      'WithContext 的取消条件还包括第一次 Wait 返回，不只错误。',
      '正确。后续工作应使用合适的父 Context 或新的派生预算。',
      'child 有自己结束的生命周期，不能因为 parent 还有效就认为它仍有效。',
    ],
    takeaway: '派生 Context 跟随这组任务，成功 Wait 也会结束它。',
  },
  {
    id: 'con-groups-limit',
    lessonId: 'concurrency-groups',
    title: '在一张已占满的票上等待下一张票',
    prompt:
      'SetLimit(1)，唯一运行的任务内部又调用同一个 g.Go 启动子任务，等它完成后才返回。可能怎样？',
    options: [
      '自动借用父任务的额度',
      '新任务被无条件排入无限队列',
      '内部 Go 等额度，外部任务又不退出，形成死锁',
    ],
    answer: 2,
    explanations: [
      'errgroup 不会识别这种嵌套关系并转移额度。',
      'Go 会在启动准入处阻塞，并不提供无限队列。',
      '正确。需要改变任务层次、在允许时同步执行，或使用有独立责任的任务组与调度协议。',
    ],
    takeaway: 'SetLimit 可能把调用 Go 的人也阻塞住。',
  },
  {
    id: 'con-groups-pipeline',
    lessonId: 'concurrency-groups',
    title: '只读一个结果之后',
    prompt: '下游找到想要的结果便返回，上游仍在向无缓冲输出发送。完整的退出协议应包含什么？',
    options: [
      '取消信号、每个阻塞点的取消出口，以及等待上游退出',
      '让下游直接 close 上游输出',
      '只加一个容量为 1 的缓冲就解决全部情况',
    ],
    answer: 0,
    explanations: [
      '正确。发送方负责输出关闭，任务拥有者负责生命周期；取消和 join 缺一都不完整。',
      '上游可能仍在发送，接收方贸然关闭会造成 panic。',
      '缓冲只能暂时吸收有限元素，不能解决任意长度上游的停止问题。',
    ],
    takeaway: '提前停止消费，要把退出一路传回去。',
  },
  {
    id: 'con-groups-cache',
    lessonId: 'concurrency-groups',
    title: '去重的时间范围有多长',
    prompt: '同 key 的 singleflight 调用已完成，过一会儿又调用同 key。是否自动得到此前缓存的结果？',
    options: [
      '是，缓存到 Group 被回收',
      '不是，singleflight 合并在途重叠调用；持久缓存需另行设计',
      '是，默认缓存一分钟',
    ],
    answer: 1,
    explanations: [
      'Group 不为完成结果提供这种缓存生命周期。',
      '正确。常见组合是缓存未命中后合并回源，闭包里再检查缓存，以处理排队期间的变化。',
      'singleflight 没有这个默认 TTL。',
    ],
    takeaway: 'singleflight 合并在途，不管理缓存过期。',
  },
];

export const groupsFollowups: FollowupItem[] = [
  {
    question: 'errgroup 发现错误，会立刻从 Wait 返回吗？',
    label: '取消与等待',
    answer:
      '不会。WithContext 派生的 Context 会因被记录的首个非 nil 任务错误而取消，但 Wait 仍等待所有已启动任务返回。一个任务忽略取消、永远阻塞，就会让 Wait 继续等。返回的是一项错误，不是所有错误，也不是按输入位置挑出的错误。',
    deeper: '父 Context 取消，Wait 一定返回 context.Canceled 吗？',
    point:
      '不一定。Wait 返回任务实际提交的错误；若它们都返回 nil，Wait 也可以返回 nil。请求整体如何定义成功，要由调用方和任务的返回契约决定。',
  },
  {
    question: 'SetLimit 限制数量，为什么还需要关注接单过程？',
    label: '启动与背压',
    answer:
      'Go 会阻塞等待额度，它本身没有一个可选的 Context 等待参数，Context 取消也不自动拒绝所有后续启动。TryGo 只报告此刻能否启动，失败不代表排入队列。并发准入、调用方等待预算和任务取消是不同控制。',
    deeper: '运行期间按负载调大 SetLimit 可以吗？',
    point:
      '契约要求有任务活跃时不能修改 limit。需要动态调节时应另选支持这一协议的调度器，而不是直接改正在使用的组。',
  },
  {
    question: '第一个 singleflight 调用者超时，要取消共享回源吗？',
    label: '共享所有权',
    answer:
      '不能把首个调用者默认当成所有人的生命周期拥有者。其他等待者可能仍需要结果。可让每个等待者用自己的 Context 放弃等待，共享回源使用由服务管理的独立且有界预算；还需限制不同 key 的总并发与关闭服务时的收尾。',
    deeper: '没有等待者后自动取消呢？',
    point:
      '标准 singleflight 不提供完整的等待者引用计数取消协议。需要另行设计注册、离开、最后等待者取消与新请求到来的竞争，不能假装 DoChan 自动处理了这些。',
  },
  {
    question: 'Forget 能杀掉卡住的旧回源，让系统恢复吗？',
    label: '去重边界',
    answer:
      'Forget 让后续相同 key 可以启动新调用，不取消已有调用。旧调用仍需自己的截止时间和资源清理，新旧调用还可能同时访问下游。若不断 Forget，再不断发起新的同 key 请求，会扩大负载而不是自动恢复。',
    deeper: 'Shared 为 true，是否说明当前调用者一定是跟随者？',
    point:
      '不是。它表达结果被多个调用者共享，首个执行者也可能得到 true。共享的指针、map 或切片还需要不可变或复制协议。',
  },
];
