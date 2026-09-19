import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const selectLesson: LessonDefinition = {
  id: 'concurrency-select',
  moduleId: 'concurrency',
  label: '2.3 select 与计时器',
  eyebrow: 'CONCURRENCY / SELECT',
  title: '取消已经发生，为什么任务仍可能开始？',
  shortTitle: 'select、取消竞争与计时器',
  path: '/learn/concurrency-select',
  description: [
    '先求值，再从就绪集合选一条路；源码顺序不会变成优先级。',
    '把取消竞争、循环退出和新版计时器放回明确的协议。',
  ],
  minutes: 38,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'ready',
      title: '谁就绪，谁才进入候选集合',
      keywords: 'select default nil 随机 公平 取消',
    },
    { id: 'lab', title: '展开所有可能被选择的分支', keywords: '实验 关闭发送 panic 零值' },
    { id: 'evaluation', title: '未选中的分支也可能先计算', keywords: '求值 RHS 副作用 build' },
    { id: 'loops', title: '循环、关闭与取消竞争', keywords: 'break 标签 忙等 closed nil 优先级' },
    {
      id: 'timers',
      title: '计时器要带上版本语义',
      keywords: 'Go1.23 Go1.27 asynctimerchan Stop Reset Ticker AfterFunc',
    },
    { id: 'followups', title: '超时之后仍需回答的问题', keywords: '追问 时间预算 退出 恢复' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '版本 文档 测试' },
  ],
  sources: [
    {
      title: 'Go 规范 · select',
      note: '求值时机、均匀伪随机选择、default 与 nil',
      url: 'https://go.dev/ref/spec#Select_statements',
    },
    {
      title: '标准库 time.Timer',
      note: '当前 Stop、Reset 与 AfterFunc 的不同契约',
      url: 'https://pkg.go.dev/time#Timer',
    },
    {
      title: 'Go Wiki · 1.23 Timer 变化',
      note: '历史迁移背景；旧开关不能外推到 Go 1.27',
      url: 'https://go.dev/wiki/Go123Timer',
    },
    {
      title: 'Go 1.27 · Runtime',
      note: '永久移除 asynctimerchan，time 的 channel 始终同步',
      url: 'https://go.dev/doc/go1.27#runtime',
    },
    {
      title: '标准库 time.Ticker.Stop',
      note: '停止 ticker 不关闭其 channel',
      url: 'https://pkg.go.dev/time#Ticker.Stop',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-select.mdx')),
};
export const selectQuestions: Question[] = [
  {
    id: 'con-select-cancel',
    lessonId: 'concurrency-select',
    title: '第一个 case 没有特权',
    prompt: 'ctx.Done() 已关闭，jobs 也有数据。把取消 case 写在最前面，能保证本次只选取消吗？',
    options: [
      '能，select 从上往下匹配',
      '能，只要是无缓冲 channel',
      '不能，会从可进行的通信中作均匀伪随机选择',
    ],
    answer: 2,
    explanations: [
      'select 不是按条件顺序执行的 if/else。',
      '只要这里两个通信都就绪，容量不会自动创建取消优先级。',
      '正确。若需要更强的停止接单语义，要设计明确的状态与准入协议。',
    ],
    takeaway: 'case 的位置，不是业务优先级。',
  },
  {
    id: 'con-select-evaluate',
    lessonId: 'concurrency-select',
    title: '没有选中发送，也会调用 build',
    prompt:
      'select { case out <- build(): case <-ctx.Done(): }。即使最终选中取消，build 是否可能已经执行？',
    options: [
      '会，发送的 channel 与右侧表达式进入 select 时就求值',
      '不会，只执行选中 case 的全部表达式',
      '只有 out 非 nil 才会执行',
    ],
    answer: 0,
    explanations: [
      '正确。副作用和昂贵计算不能假设被取消分支自动跳过。',
      '分支语句块和通信表达式的求值时机不同。',
      'nil 会禁用通信，但不会跳过其发送右侧表达式的求值。',
    ],
    takeaway: '先算发送值，再选择通信。',
  },
  {
    id: 'con-select-closed',
    lessonId: 'concurrency-select',
    title: '关闭分支为什么让循环空转',
    prompt: '多路接收循环中，一个 channel 已关闭且读空，却继续保留 case <-ch。会怎样？',
    options: [
      '该分支自动禁用',
      '它持续就绪，可能反复收到零值；应根据协议退出或把本地分支设为 nil',
      'select 自动休眠等待其他通道',
    ],
    answer: 1,
    explanations: [
      '关闭与 nil 相反，关闭后的接收持续可进行。',
      '正确。还要处理所有分支都被禁用后的循环终止，避免永久等待。',
      '仍有就绪分支时不会仅因为其他分支没有数据而自动等待。',
    ],
    takeaway: '关闭持续就绪，nil 禁用分支。',
  },
  {
    id: 'con-select-timer',
    lessonId: 'concurrency-select',
    title: 'Go 1.27 还能恢复旧式计时器吗',
    prompt:
      '在 Go 1.27 中设置 GODEBUG=asynctimerchan=1，能把 time.NewTimer 的通道恢复为旧式缓冲行为吗？',
    options: [
      '能，所有旧 GODEBUG 开关永久保留',
      '能，只要 go.mod 写 1.22',
      '不能，该开关已永久移除，time 的 channel 始终为同步语义',
    ],
    answer: 2,
    explanations: [
      '兼容开关有自己的生命周期，必须核对当前版本。',
      'Go 1.27 已移除这项实现支持，不能只套用 Go 1.23 迁移文档。',
      '正确。go.mod 或 //go:debug 中显式要求已移除的旧值还会被 go 命令拒绝。',
    ],
    takeaway: '1.23 开始迁移，1.27 移除旧开关。',
  },
];
export const selectFollowups: FollowupItem[] = [
  {
    question: 'select 前先检查 ctx.Err()，就保证取消后绝不开始任务吗？',
    label: '准入边界',
    answer:
      '只能缩小某些窗口。检查之后、任务开始之前仍可能发生取消；同时就绪的 select 也没有内建优先级。若业务要求明确的停止接单边界，要让“关闭准入”和“接受任务”通过同一同步协议决定先后，并说明已接纳任务如何完成或撤销。',
    deeper: '已经发到数据库的写入会因取消自动回滚吗？',
    point:
      '不能这么承诺。取消控制本地等待或传给驱动的请求，外部副作用可能已发生，需事务、幂等与结果确认。',
  },
  {
    question: 'default 可以让服务永远不阻塞，所以应该到处加吗？',
    label: '等待策略',
    answer:
      'default 让当前 select 在没有就绪通信时立即继续。在无限循环里它可能制造忙等，占用 CPU；在发送路径里它也可能直接丢弃任务。是否加入取决于你要的是拒绝、降级、轮询还是等待，必须让调用方知道处理结果。',
    deeper: 'len(ch)>0 后再接收，可以替代非阻塞 select 吗？',
    point: '不可以作为一般并发保证。另一个消费者可以在检查后取走元素，接收仍可能阻塞。',
  },
  {
    question: 'Timer.Stop 返回 false，就一定需要 <-timer.C 吗？',
    label: '版本与所有权',
    answer:
      '不能照抄。当前 chan-based timer 的 Stop/Reset 提供不再收到旧值的保证；已经被接收或已经停止时，盲目排空可能阻塞。Go 1.23 之前的模式需要单独讨论，1.23 至 1.26 还受兼容条件影响，1.27 已永久删除旧开关。计时器应有明确控制与接收责任。',
    deeper: 'AfterFunc 的 Stop 呢？',
    point:
      '它控制回调是否开始，不等待已经开始的回调结束；Reset 也可能与前一次回调并发，需要独立完成同步。',
  },
  {
    question: 'for 循环里每次 time.After(1s)，就是整个请求最多一秒吗？',
    label: '时间预算',
    answer:
      '不是。每次进入都会建立新超时，持续有事件可能不断重置等待窗口。整段工作的预算应在外层创建一次 deadline 或 timer；每次空闲的一秒与总耗时一秒是不同契约。现代 Go 允许回收无引用的未停止 timer，但频繁创建仍有成本。',
    deeper: 'Ticker.Stop 后，range ticker.C 会自然结束吗？',
    point: '不会，Stop 不关闭 C。循环仍需要取消或其他退出分支，不能依赖 range 因停止而结束。',
  },
];
