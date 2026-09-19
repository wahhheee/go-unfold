import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const memoryModelLesson: LessonDefinition = {
  id: 'concurrency-memory',
  moduleId: 'concurrency',
  label: '2.1 内存模型与顺序',
  eyebrow: 'CONCURRENCY / ORDER',
  title: '先运行过，不等于另一个 goroutine 能安全读。',
  shortTitle: '内存模型与 happens-before',
  path: '/learn/concurrency-memory',
  description: [
    '把“应该已经写完了”换成一条可以检查的同步路径。',
    '从数据竞争、发布和等待出发，分清可见性与业务正确性。',
  ],
  minutes: 35,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'race', title: '并发访问缺少的是什么', keywords: 'data race 竞争 Sleep 顺序' },
    { id: 'order', title: '画出 happens-before', keywords: 'sequenced synchronized 传递性 DRF-SC' },
    { id: 'lab', title: '发布顺序可以怎样连接', keywords: '实验 close atomic 发布' },
    { id: 'invariant', title: '无竞态仍可能业务出错', keywords: '原子 丢失更新 不变量 GOMAXPROCS' },
    { id: 'followups', title: '追问顺序背后的前提', keywords: '追问 可见性 多字值 goroutine' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '规范 版本 证据' },
  ],
  sources: [
    { title: 'Go 内存模型', note: '数据竞争、DRF-SC、同步边与反例', url: 'https://go.dev/ref/mem' },
    {
      title: '标准库 sync/atomic',
      note: '顺序一致原子操作与同步关系',
      url: 'https://pkg.go.dev/sync/atomic',
    },
    {
      title: 'Go race detector',
      note: '动态检测范围与执行要求',
      url: 'https://go.dev/doc/articles/race_detector',
    },
    {
      title: '标准库 sync.WaitGroup',
      note: 'Done 与所解除等待之间的同步关系',
      url: 'https://pkg.go.dev/sync#WaitGroup',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-memory.mdx')),
};
export const memoryModelQuestions: Question[] = [
  {
    id: 'con-memory-sleep',
    lessonId: 'concurrency-memory',
    title: '等一秒能替代同步吗',
    prompt: '一个 G 写普通变量，另一个 G Sleep 一秒后读它。没有其他同步，正确判断是？',
    options: [
      '一秒足够长，所以安全',
      '仍缺少 happens-before，同一位置的冲突访问可能构成竞态',
      'GOMAXPROCS=1 就自动安全',
    ],
    answer: 1,
    explanations: [
      '时间长短不是内存模型定义的同步关系。',
      '正确。需要 channel、锁或适当原子协议建立顺序，不能靠观察到的速度。',
      '单 P 只限制并行执行 Go 代码的数量，不能代替同步协议。',
    ],
    takeaway: '时间过去了，不代表同步发生了。',
  },
  {
    id: 'con-memory-close',
    lessonId: 'concurrency-memory',
    title: '关闭通知究竟发布了哪次写入',
    prompt:
      'data=42；close(done)。读者先从 done 观察到关闭，再读取 data，且没有其他写入。能读到什么？',
    options: ['保证 42', '可能 0，因为 close 只改 channel', '必须再 Sleep 才能确定'],
    answer: 0,
    explanations: [
      '正确。写入先于关闭，关闭同步先于观察到关闭的接收，读取在接收之后。',
      '同步关系可以发布之前的普通写入，不只覆盖 channel 自己的数据。',
      '这条同步链已经足够，增加 Sleep 不是必要条件。',
    ],
    takeaway: '普通写入也可以由同步操作发布。',
  },
  {
    id: 'con-memory-atomic',
    lessonId: 'concurrency-memory',
    title: '原子操作组成的错误计数器',
    prompt:
      '两个任务都先 counter.Load()，等双方读完再各自 Store(old+1)。初值 0，每个操作均原子，最终一定是 2 吗？',
    options: [
      '一定，原子意味着整个函数是事务',
      '不一定，这个安排下会得到 1；应使用 Add 或保护整体读改写',
      '会被 race detector 必然报错',
    ],
    answer: 1,
    explanations: [
      '原子范围只覆盖每次操作，不自动扩展到多个调用。',
      '正确。两个任务都读到 0，再分别写入 1，丢失一次业务更新。',
      '这里所有计数器访问均原子，无数据竞争也能违反业务契约。',
    ],
    takeaway: '无竞态是起点，不是业务不变量的证明。',
  },
  {
    id: 'con-memory-start',
    lessonId: 'concurrency-memory',
    title: '启动与完成不是同一种通知',
    prompt: '启动 goroutine 后，能否仅凭它的函数已经 return 推导调用方之后的读取有序？',
    options: [
      '能，所有 goroutine 返回自动发布结果',
      '不能，退出本身没有向观察者提供完成同步',
      '能，编译器会隐式 Wait',
    ],
    answer: 1,
    explanations: [
      'goroutine 的退出不是一个自动可等待的同步事件。',
      '正确。需要接收完成信号、WaitGroup 等适当关系；启动的同步边方向也不能倒过来用。',
      'go 语句不会隐式 join。',
    ],
    takeaway: '启动有顺序，结束要有协议。',
  },
];
export const memoryModelFollowups: FollowupItem[] = [
  {
    question: '没有数据竞争，为什么结果还错？',
    label: '不变量',
    answer:
      'race-free 让执行满足顺序一致推理，但不会选择你希望的那种交错。分别上锁的检查和扣款、原子 Load 后再 Store，都可能让两个调用者通过同一个旧条件。需要把业务不变量覆盖的操作放进同一临界区，或使用合适的单次原子读改写。',
    deeper: 'race 全绿能证明余额不会变负吗？',
    point: '不能。余额非负是业务性质，需要同步设计与性质断言；数据竞争只是另一类问题。',
  },
  {
    question: 'CPU 缓存是一致的，为什么还要锁？',
    label: '抽象层次',
    answer:
      '缓存一致性协议不能替代语言内存模型，也不让多个访问自动形成业务事务。编译器优化、可见性顺序和读改写交错都要遵守语言与同步 API 的契约。工程代码应在该抽象层证明正确性，不能依赖某台机器的一次观察。',
    deeper: '每次运行都输出 42，说明没有竞态吧？',
    point:
      '输出相同只能描述这些执行。动态检测可能帮助发现问题，源码中的同步路径才说明为什么这个读取有序。',
  },
  {
    question: '用原子布尔值发布配置，配置内容也必须全原子吗？',
    label: '发布后所有权',
    answer:
      '若配置先完整构造，随后原子发布，读者确实观察到发布，且对象之后不再改变，普通读取可以由同步关系保护。若发布之后仍修改内部 map 或切片，就需要新的同步或不可变副本；一个 ready 位不会永远保护整个对象。',
    deeper: '反复把 ready 设为 true 能表达多个版本吗？',
    point:
      '单个布尔值无法清楚标识版本与生命周期。使用不可变快照指针或带版本的协议，并在原子一节分析所有权。',
  },
  {
    question: '有竞态的 Go 程序是否像 C/C++ 一样可以产生任意行为？',
    label: '规范边界',
    answer:
      '不能直接照搬。Go 内存模型允许实现报告竞态并终止，也对单字大小或更小的读写保留约束；但多字值可能出现不一致组合，依赖有竞态程序仍是错误。课程不会把某个整数测试的两个输出当作所有类型的完整结果集合。',
    deeper: 'slice、string 或 interface 并发读写尤其要注意什么？',
    point:
      '这些值的实现可能跨多个机器字，不一致的内部组合可能导致更严重后果。正确做法是消除竞态，而不是推测哪个字先更新。',
  },
];
