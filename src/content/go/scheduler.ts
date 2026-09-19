import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const schedulerLesson: LessonDefinition = {
  id: 'go-scheduler',
  moduleId: 'go',
  label: '1.6 GMP 与调度',
  eyebrow: 'GO / SCHEDULER',
  title: '一个 goroutine 阻塞了，谁来继续工作？',
  shortTitle: 'GMP、调度与抢占',
  path: '/learn/go-scheduler',
  description: [
    '从就绪、运行和等待三种状态，读懂 G、M、P 的分工。',
    '把调度效率、容器配额与 goroutine 生命周期放到同一张图里。',
  ],
  minutes: 35,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'model', title: 'G、M、P 各负责什么', keywords: 'GMP 调度 协程 线程 并行' },
    { id: 'lab', title: '三条阻塞与抢占时间线', keywords: 'netpoll syscall 阻塞 抢占 实验' },
    { id: 'queues', title: '队列、窃取与安全点', keywords: '工作窃取 sysmon 抢占 Go1.14 公平' },
    { id: 'limits', title: 'GOMAXPROCS 与容器', keywords: 'Go1.25 CPU quota GOMAXPROCS cgroup' },
    {
      id: 'lifetime',
      title: '启动之后谁负责收尾',
      keywords: '取消 context 泄漏 Go1.27 goroutineleak',
    },
    { id: 'followups', title: '让运行时解释可观测现象', keywords: '追问 调度 阻塞 吞吐 延迟' },
    { id: 'sources', title: '记忆锚点与依据', keywords: '版本 核验' },
  ],
  sources: [
    {
      title: 'Go 1.27.1 · 调度器实现',
      note: 'G/M/P、分布式队列与线程管理',
      url: 'https://github.com/golang/go/blob/go1.27.1/src/runtime/proc.go',
    },
    {
      title: 'Go 1.27.1 · 抢占实现',
      note: '阻塞、同步与异步安全点；请求与完成不同',
      url: 'https://github.com/golang/go/blob/go1.27.1/src/runtime/preempt.go',
    },
    {
      title: 'Go 1.14 发布说明',
      note: '异步抢占的版本起点及平台前提',
      url: 'https://go.dev/doc/go1.14#runtime',
    },
    {
      title: 'runtime.GOMAXPROCS',
      note: '当前默认值、配额、自动更新和显式覆盖',
      url: 'https://pkg.go.dev/runtime#GOMAXPROCS',
    },
    {
      title: 'Go 1.25 发布说明',
      note: '容器感知默认值、SetDefaultGOMAXPROCS 与 WaitGroup.Go',
      url: 'https://go.dev/doc/go1.25#runtime',
    },
    {
      title: 'Go 1.27 · goroutine 泄漏画像',
      note: '可达性检测能力与未覆盖的泄漏',
      url: 'https://go.dev/doc/go1.27#goroutineleak-profiles',
    },
    {
      title: '标准库 context',
      note: '取消是协作信号，不会强制结束 goroutine',
      url: 'https://pkg.go.dev/context',
    },
    {
      title: 'Go 内存模型',
      note: '启动 goroutine 与退出不等价于任意数据同步',
      url: 'https://go.dev/ref/mem',
    },
  ],
  Content: lazy(() => import('../lessons/go-scheduler.mdx')),
};
export const schedulerQuestions: Question[] = [
  {
    id: 'go-scheduler-p',
    lessonId: 'go-scheduler',
    title: '一个 P 不等于一个线程',
    prompt: 'GOMAXPROCS=1 时，一个 G 的阻塞系统调用占用了 M0。其他就绪 Go 代码一定无法运行吗？',
    options: [
      '一定，整个进程只能有一个操作系统线程',
      '不一定，运行时可把 P 交给其他 M 继续执行',
      '不一定，因为普通 Go 代码无需 P 也能运行',
    ],
    answer: 1,
    explanations: [
      'GOMAXPROCS 不是线程总数上限。',
      '正确。阻塞的 M 可以不持有 P，其他 M 获取 P 后执行就绪 G。',
      '普通 Go 代码的执行需要 M 关联 P；阻塞系统调用是另一个状态。',
    ],
    takeaway: 'P 限 Go 并行执行，不限线程总量。',
  },
  {
    id: 'go-scheduler-preempt',
    lessonId: 'go-scheduler',
    title: '调度阈值不是服务承诺',
    prompt: '看到运行时源码中约 10ms 的强制抢占阈值，就能承诺其他请求 10ms 内一定开始执行吗？',
    options: [
      '能，每个 G 都按严格时间片轮转',
      '不能，请求、可抢占安全点、系统负载等都会影响实际时机',
      '能，只要手动调用 runtime.Gosched()',
    ],
    answer: 1,
    explanations: [
      '调度器不是业务硬实时系统，也不提供这个最大等待时间保证。',
      '正确。阈值属于实现策略，不能直接换算成应用延迟上界。',
      'Gosched 让出执行机会，不保证某个指定 G 在固定时间内获得 CPU。',
    ],
    takeaway: '请求抢占不等于完成抢占，更不等于延迟 SLA。',
  },
  {
    id: 'go-scheduler-container',
    lessonId: 'go-scheduler',
    title: '新默认也有覆盖条件',
    prompt:
      'Go 1.27 程序在 Linux 容器内显式设置 GOMAXPROCS=8，随后 CPU quota 变小。运行时一定自动把它调低吗？',
    options: [
      '一定，容器 quota 永远覆盖环境变量',
      '不一定，显式设置会关闭默认的自动更新',
      '不一定，因为 GOMAXPROCS 只影响 GC',
    ],
    answer: 1,
    explanations: [
      '显式配置会改变默认行为，不能只看容器配额。',
      '正确。可以用 runtime.SetDefaultGOMAXPROCS 恢复运行时默认行为；还要检查语言版本和 GODEBUG。',
      '它控制并行执行 Go 代码的能力，并非仅仅影响 GC。',
    ],
    takeaway: '查配额，也查显式覆盖与语言版本。',
  },
  {
    id: 'go-scheduler-cancel',
    lessonId: 'go-scheduler',
    title: '取消请求以后还欠一步',
    prompt: '调用 cancel() 后，怎样保证工作 goroutine 已结束并完成清理？',
    options: [
      'cancel 返回就意味着所有子 goroutine 已退出',
      '还要让工作路径响应取消，并等待明确的完成信号或 WaitGroup',
      '再等待一个固定的 time.Sleep 即可证明退出',
    ],
    answer: 1,
    explanations: [
      'context 只传播取消信号，不拥有或强杀所有 goroutine。',
      '正确。取消、响应取消、清理完成是不同事件。',
      '固定睡眠不是完成确认，快慢机器与阻塞路径都可能推翻这个假设。',
    ],
    takeaway: '取消发信号，等待确认收尾。',
  },
];
export const schedulerFollowups: FollowupItem[] = [
  {
    question: 'goroutine 比线程便宜，就能每条消息无限启动一个吗？',
    label: '资源边界',
    answer:
      '不能。每个 G 都有栈、调度状态与可能保留的对象；大量等待还会扩大队列、增加 GC 根扫描和超时成本。并发量应该服务下游容量与延迟目标，需要限流、背压、超时和有界排队。',
    deeper: '线程数很高但 CPU 不高，怎么解释？',
    point:
      '可能有阻塞系统调用、cgo 或线程绑定。查看线程、goroutine 栈与 trace，不把 NumGoroutine 当作线程计数。',
  },
  {
    question: '有工作窃取，就不会饥饿或排队了吗？',
    label: '调度保证',
    answer:
      '工作窃取改善负载均衡，局部队列有助于局部性，全局队列和其他检查避免只处理局部任务。但这些策略不提供业务优先级、严格公平或最长等待时间保证。操作系统调度、CPU 配额和不可抢占片段仍会影响延迟。',
    deeper: 'GOMAXPROCS=1 的程序没有数据竞争吗？',
    point: '仍会交错执行多个 G，多步操作不会自动原子；同步语义与物理同时运行是两个问题。',
  },
  {
    question: '网络请求慢，是不是应该调大 GOMAXPROCS？',
    label: '定位',
    answer:
      '先确认等待在哪里。受支持的网络 I/O 通常等待 netpoll，不需要每个连接占一个专用线程；耗时也可能来自远端、连接池、锁或 CPU 限流。增加 P 只改变 Go 的并行执行能力，不会自动解除下游排队。',
    deeper: '所有文件 I/O 也都像 socket 一样走 netpoll 吗？',
    point:
      '不能这样概括。文件类型、操作系统和具体 API 决定路径；普通文件或其他调用可能实际阻塞线程。',
  },
  {
    question: '新 goroutineleak 画像为空，就没有泄漏吗？',
    label: '诊断边界',
    answer:
      '不能。Go 1.27 正式提供的画像利用 GC 可达性识别一类永远无法被唤醒的阻塞 G。若同步对象仍可从全局变量或可运行 G 的局部变量到达，某些实际泄漏无法由该方法证明。无限循环、业务上不再需要却仍能活动的 G 也不等于这种不可唤醒泄漏。',
    deeper: '那排查时还要看什么？',
    point:
      '结合普通 goroutine 栈、数量趋势、请求生命周期、阻塞与 trace；最终检查是谁创建、谁取消、谁等待。',
  },
];
