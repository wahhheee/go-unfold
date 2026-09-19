import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const coordinationLesson: LessonDefinition = {
  id: 'concurrency-coordination',
  moduleId: 'concurrency',
  label: '2.6 完成、初始化与条件',
  eyebrow: 'CONCURRENCY / COORDINATION',
  title: '等到被唤醒，就等到想要的结果了吗？',
  shortTitle: 'WaitGroup、Once 与 Cond',
  path: '/learn/concurrency-coordination',
  description: [
    '等任务完成、只初始化一次、等待条件成立，是三种不同的生命周期。',
    '把通知和事实分开，才能写对等待、重试与退出。',
  ],
  minutes: 40,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'duties', title: '三个工具，三种承诺', keywords: '同步 完成 初始化 条件 生命周期' },
    {
      id: 'waitgroup',
      title: '任务先登记，等待才有对象',
      keywords: 'WaitGroup Go Add Done Wait 1.25 复用',
    },
    {
      id: 'once',
      title: '执行一次，也可能只失败一次',
      keywords: 'Once Do OnceValue OnceValues panic 错误缓存',
    },
    { id: 'lab', title: '逐帧看通知与状态', keywords: '实验 条件 循环 广播' },
    {
      id: 'cond',
      title: '唤醒之后，重新检查条件',
      keywords: 'Cond Wait Signal Broadcast 虚假唤醒 mutex 关闭',
    },
    {
      id: 'followups',
      title: '从工具契约追到退出协议',
      keywords: '追问 取消 重试 数据保护 信号丢失',
    },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '版本 文档 synctest 测试' },
  ],
  sources: [
    {
      title: 'sync.WaitGroup.Go',
      note: 'Go 1.25 起的注册与启动、panic 契约和复用顺序',
      url: 'https://pkg.go.dev/sync#WaitGroup.Go',
    },
    {
      title: 'sync.WaitGroup.Add',
      note: '计数为零时的顺序要求和负计数 panic',
      url: 'https://pkg.go.dev/sync#WaitGroup.Add',
    },
    {
      title: 'sync.Once.Do',
      note: '初始化返回前的等待、panic 后不重试',
      url: 'https://pkg.go.dev/sync#Once.Do',
    },
    {
      title: 'sync.OnceValues',
      note: 'Go 1.21 起的返回值缓存和 panic 重放',
      url: 'https://pkg.go.dev/sync#OnceValues',
    },
    {
      title: 'sync.Cond.Wait',
      note: '原子解锁与等待、返回前重新加锁、循环检查条件',
      url: 'https://pkg.go.dev/sync#Cond.Wait',
    },
    {
      title: 'testing/synctest',
      note: '通过可确定阻塞状态验证等待与唤醒',
      url: 'https://pkg.go.dev/testing/synctest',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-coordination.mdx')),
};

export const coordinationQuestions: Question[] = [
  {
    id: 'con-coordination-add',
    lessonId: 'concurrency-coordination',
    title: 'Wait 不会预知未来任务',
    prompt:
      '计数为 0，先 go func(){ wg.Add(1); defer wg.Done(); work() }()，随后 wg.Wait()。问题是什么？',
    options: [
      '没有问题，Wait 能自动找到刚创建的 G',
      'Wait 可能在 Add 前返回；从 0 增加计数必须先于等待',
      '只需在 Wait 前 Sleep 一毫秒',
    ],
    answer: 1,
    explanations: [
      'WaitGroup 追踪显式计数，不是进程中所有 G。',
      '正确。先 Add 再启动，或在 Go 1.25+ 使用 wg.Go(work) 并在登记后 Wait。',
      'Sleep 不建立注册先于等待的协议。',
    ],
    takeaway: '先登记，再等待；不能把 Add 藏到任务刚启动时。',
  },
  {
    id: 'con-coordination-data',
    lessonId: 'concurrency-coordination',
    title: '等待完成不会保护同时写入',
    prompt: '多个 wg.Go 任务同时 append 到同一个 slice，最后 Wait。是否因此没有数据竞争？',
    options: [
      '是，WaitGroup 会串行执行所有任务',
      '是，只要容量足够大',
      '不是，任务执行期间的共享修改仍需同步',
    ],
    answer: 2,
    explanations: [
      'WaitGroup 只跟踪完成，不提供任务之间的互斥。',
      '共享切片头的长度和位置仍在被并发修改，容量不能替代同步。',
      '正确。可用锁，或预分配并让各任务只写各自独立元素，随后 Wait 再汇总。',
    ],
    takeaway: '等结束，与保护执行过程，是两件事。',
  },
  {
    id: 'con-coordination-once',
    lessonId: 'concurrency-coordination',
    title: '瞬时故障也会被缓存',
    prompt: '用 OnceValues 包装连接初始化，首次返回临时错误。第二次调用会自动重试吗？',
    options: [
      '不会，返回值和错误一起被缓存',
      '会，只有成功才算执行过一次',
      '会，只要换一个调用 goroutine',
    ],
    answer: 0,
    explanations: [
      '正确。需要重试的资源应另设可恢复状态与重试协议。',
      'OnceValues 不根据 error 决定是否重新执行。',
      '所有调用者共享同一个返回闭包对应的初始化状态。',
    ],
    takeaway: 'Once 保证一次执行，不保证一次成功。',
  },
  {
    id: 'con-coordination-cond',
    lessonId: 'concurrency-coordination',
    title: '没有虚假唤醒，为什么还用 for',
    prompt:
      'Go 的 Cond.Wait 必须由 Signal/Broadcast 唤醒。为什么通常仍写 for !condition { Wait() }？',
    options: [
      '因为 Go 文档实际允许 Wait 随机返回',
      '因为重新拿到锁时，条件可能已被其他参与者改变或消耗',
      '因为 Wait 返回时没有持锁',
    ],
    answer: 1,
    explanations: [
      'Go 的这项契约不同于允许无通知返回的某些系统，不能照搬说法。',
      '正确。唤醒只让你重新竞争锁，不代表资源一直为你保留。',
      'Wait 返回前会重新持有关联的锁；此时仍要重新判断谓词。',
    ],
    takeaway: '通知让你再看一次，状态决定能不能继续。',
  },
];

export const coordinationFollowups: FollowupItem[] = [
  {
    question: 'WaitGroup.Wait 返回后，可以直接读取任务写的结果吗？',
    label: '完成与共享',
    answer:
      '相应 Done 或 Go 回调返回与被其解除阻塞的 Wait 返回之间有同步关系，所以遵守协议时可以在等待后读取完成结果。但多个任务之间若曾无同步地写同一变量，Wait 不会事后修复那个数据竞争。预分配结果切片并分配独立下标是一种常见做法。',
    deeper: 'WaitGroup 能返回第一项错误并取消其他任务吗？',
    point:
      '不能，它没有 error 或 Context 传播。可以显式收集结果并取消，或使用下一节的 errgroup，同时要求任务配合取消。',
  },
  {
    question: 'Once.Do 里面 panic，下一次再调用同一个 Once 会重试吗？',
    label: '失败语义',
    answer:
      '不会。Do 认为这次调用已经执行过；若外层恢复了第一次 panic，之后的 Do 不再调用函数。Go 1.21 的 OnceFunc、OnceValue、OnceValues 行为又不同：它们会在后续调用中重放相同的 panic 值，但仍不重新执行初始化。',
    deeper: '把 Once 置零就能重置吗？',
    point:
      '不能把正在使用的同步对象当作可随意重置的字段。多调用者需要清晰的新实例生命周期或独立的可重试状态机，而不是覆盖仍被使用的 Once。',
  },
  {
    question: 'Signal 比 Wait 先执行，后来的等待者能消费这个信号吗？',
    label: '通知不是存款',
    answer:
      '不能，Signal 不存储未来可消费的许可。正确协议把“是否有数据、是否关闭”等事实保存在受锁保护的状态里；后来者先检查状态，如果已满足就不 Wait。等待者持锁检查，再由 Wait 原子地解锁并等待，避免检查和进入等待之间漏掉必要唤醒。',
    deeper: 'Signal 必须在持锁时调用吗？',
    point:
      'API 允许不持锁调用 Signal/Broadcast，但条件的检查与修改仍需遵守关联锁协议。把修改状态和通知放在一个明确临界区通常更便于推理；通知本身不保证调度优先级。',
  },
  {
    question: '怎样让所有 Cond 等待者在服务关闭时退出？',
    label: '退出协议',
    answer:
      '把 closed 纳入同一受锁保护的谓词，关闭时修改 closed 并 Broadcast，等待者循环检查“有数据或已关闭”。约定是排空后退出还是立刻中止，不能只发一次 Signal 就假设所有等待者都离开。最后由拥有这些任务的一方等待它们结束。',
    deeper: '需要 Context 取消时，能直接 select 一个 Cond 吗？',
    point:
      '不行。可用 channel 表达取消，或让取消回调持锁更新条件并广播；回调和清理也要管理。下一节会解释 AfterFunc 的停止与等待边界，不能为每次 Wait 留下无人回收的 G。',
  },
];
