import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const diagnosticsLesson: LessonDefinition = {
  id: 'concurrency-diagnostics',
  moduleId: 'concurrency',
  label: '2.11 诊断与验证',
  eyebrow: 'CONCURRENCY / DIAGNOSTICS',
  title: 'race 全绿，为什么服务仍然卡住？',
  shortTitle: '竞态、泄漏、死锁与验证闭环',
  path: '/learn/concurrency-diagnostics',
  description: [
    '工具回答不同的问题，绿色结果也有边界。',
    '从一次丢失更新，到一条等待环，让证据带你找到真正的故障。',
  ],
  minutes: 46,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'failures',
      title: '先分清是哪一种失败',
      keywords: 'data race 逻辑竞争 死锁 活锁 饥饿 泄漏',
    },
    { id: 'lab', title: '六种交错，四次丢失更新', keywords: '原子 Load Store Add 顺序一致 实验' },
    { id: 'testing', title: '让坏路径稳定出现', keywords: 'race synctest 屏障 测试 fuzz shuffle' },
    {
      id: 'lifetime',
      title: '从退出责任到等待环',
      keywords: '取消 join Context 泄漏 goroutineleak 死锁',
    },
    {
      id: 'profiles',
      title: '画像分别在统计什么',
      keywords: 'pprof block mutex goroutine trace 诊断',
    },
    {
      id: 'followups',
      title: '工具之外，继续追问证据',
      keywords: '追问 全绿 CPU GOMAXPROCS 线上 复现',
    },
    { id: 'sources', title: '整章收束与真实核验', keywords: '版本 源码 证据 记忆' },
  ],
  sources: [
    {
      title: 'Go · Data Race Detector',
      note: '动态检测、报告阅读、GORACE 与执行覆盖的边界',
      url: 'https://go.dev/doc/articles/race_detector',
    },
    {
      title: 'Go · testing/synctest',
      note: '测试气泡、虚拟时间、稳定阻塞及同步保证',
      url: 'https://pkg.go.dev/testing/synctest',
    },
    {
      title: 'Go · runtime/pprof',
      note: 'goroutine、block 与 mutex 画像的归因和采样',
      url: 'https://pkg.go.dev/runtime/pprof',
    },
    {
      title: 'Go 1.27 · Release Notes',
      note: 'goroutineleak 稳定提供，以及可达性检测的遗漏范围',
      url: 'https://go.dev/doc/go1.27',
    },
    {
      title: 'Go · runtime/trace',
      note: '执行事件、阻塞与唤醒、运行时活动的时间线',
      url: 'https://pkg.go.dev/runtime/trace',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-diagnostics.mdx')),
};

export const diagnosticsQuestions: Question[] = [
  {
    id: 'con-diagnostics-atomic',
    lessonId: 'concurrency-diagnostics',
    title: '没有数据竞争，仍然少了一次更新',
    prompt:
      '两个 G 都对同一个 atomic.Int64 执行 Load 后 Store(old+1)，初值为 0，结束后为 1。最准确的解释是？',
    options: [
      'race 检测器失效了',
      '原子读取和写入各自安全，但整个加一没有合成一个原子操作',
      '只要把 GOMAXPROCS 设为 1，就从语义上修好了',
    ],
    answer: 1,
    explanations: [
      '这里共享访问都用原子操作，可以没有 data race，但仍违背业务不变量。',
      '正确。两个 G 可以都读取 0，再各自写入 1。需要 Add，或覆盖整个读改写的正确同步协议。',
      '单线程执行仍可在两个操作之间交错；调度配置不是同步契约。',
    ],
    takeaway: '无数据竞争，不等于复合业务动作原子。',
  },
  {
    id: 'con-diagnostics-synctest',
    lessonId: 'concurrency-diagnostics',
    title: 'Wait 之后证明了什么',
    prompt: 'synctest.Wait 返回后，测试中的其他 G 已进入稳定阻塞状态。这能推出什么？',
    options: [
      '所有可能的 Go 调度都已被覆盖',
      '所有真实网络请求都已完成',
      '可以检查该测试安排下的状态，但仍需另行覆盖其他路径',
    ],
    answer: 2,
    explanations: [
      'synctest 不是穷举调度的模型检查器。',
      '真实网络 I/O 不属于可据此推进虚拟时间的稳定阻塞操作。',
      '正确。它让虚拟时间和特定同步场景可控；测试覆盖仍取决于你构造的输入与路径。',
    ],
    takeaway: '确定地测试一条路径，不等于测试了全部路径。',
  },
  {
    id: 'con-diagnostics-profile',
    lessonId: 'concurrency-diagnostics',
    title: 'Unlock 很热，是不是解锁特别慢',
    prompt: 'mutex 画像把大量累计时间归到业务函数中的 Unlock。首先应如何理解？',
    options: [
      '它反映相关临界区给其他 G 造成的锁争用，应检查持锁路径',
      'CPU 大多花在 Unlock 指令上',
      '应直接删除 Unlock 来优化',
    ],
    answer: 0,
    explanations: [
      '正确。mutex 画像通常归到结束临界区的位置，不是 Unlock 的 CPU 指令耗时。',
      'CPU 画像与 mutex 争用画像统计的对象不同，不能互相替代。',
      '漏解锁会让后续工作无法前进；应先识别长临界区、不必要共享或错误等待。',
    ],
    takeaway: 'block 看等待点，mutex 帮你找造成争用的持锁路径。',
  },
  {
    id: 'con-diagnostics-join',
    lessonId: 'concurrency-diagnostics',
    title: '取消已经调用，测试还缺什么',
    prompt: '消费者提前退出后，测试调用 cancel 并立即结束。要验证生产者没有遗留，最关键的是？',
    options: [
      '多 Sleep 一秒',
      '在有超时保护的测试中等待明确完成信号，并检查清理结果',
      '仅检查 ctx.Err() 非 nil',
    ],
    answer: 1,
    explanations: [
      '睡眠不能建立任务已经退出的协议，且会慢而不稳定。',
      '正确。取消传达意图，完成信号证明相关工作已收尾；阻塞点本身必须响应取消。',
      'Context 的状态不等于派生任务的生命周期状态。',
    ],
    takeaway: '发出停止意图之后，还要验证退出责任。',
  },
];

export const diagnosticsFollowups: FollowupItem[] = [
  {
    question: 'race 跑了一百遍都没报，能承诺没有并发问题吗？',
    label: '证据范围',
    answer:
      '不能。它检查实际执行路径中的数据竞争；没走到的路径不在证据里，复合原子操作的逻辑错误、死锁和泄漏也不是它的完整检测目标。应结合同步关系推理、业务不变量断言和生命周期测试。',
    deeper: '多加 -shuffle 和 fuzz 能穷举调度吗？',
    point:
      '-shuffle 改变测试执行顺序，fuzz 主要探索输入；它们可以暴露更多问题，但不等于枚举所有 goroutine 交错。关键坏路径可以用屏障和明确的状态交接稳定构造，再用真实竞态检测补充。',
  },
  {
    question: 'CPU 不高，接口却一直超时，第一步看什么？',
    label: '等待证据',
    answer:
      '结合请求与下游指标，取多个时刻的 goroutine 栈，确认大量请求卡在哪个等待点、数量是否持续增长；再按假设采集 block、mutex 或 trace。CPU 不高只说明未必在持续计算，不能直接断言是死锁。',
    deeper: '看到很多 chan receive，就能判泄漏吗？',
    point:
      '不能。空闲工作者也会合法等待。要知道谁负责唤醒、业务生命周期是否结束、取消路径是否可达、拥有者是否等待退出。相同栈的数量和存活时间趋势比单张截图更有信息。',
  },
  {
    question: '请求设置了超时，为何两把锁的死锁没有解除？',
    label: '取消到达边界',
    answer:
      'Mutex.Lock 不接受 Context。Context 到期不会让已经卡在 Lock 的 G 自动返回，也不会替它解锁。应移除等待环，例如统一获取顺序，避免持锁等网络、回调或需要同一把锁的子任务。',
    deeper: '运行时为什么没有报 all goroutines are asleep？',
    point:
      '局部等待环可以和仍在运行的服务、计时器或其他 I/O 共存。运行时的全局死锁报告不能作为业务没有局部死锁的证明；要依据实际持有关系和等待关系找环。',
  },
  {
    question: 'Go 1.27 的泄漏画像为空，是不是没有泄漏？',
    label: '检测假阴性',
    answer:
      '不是。它借助 GC 可达性识别无法再被唤醒的一类等待。某些同步对象仍可从全局或活跃任务到达时，即使业务已经永远不会使用它，检测器也不能仅凭可达性判定泄漏。',
    deeper: '如何把线上修复变成不会复发的测试？',
    point:
      '提取能触发问题的退出顺序和资源责任，用屏障构造消费者提前退出、请求取消、错误分支等路径，断言完成信号、资源归还和业务结果，再运行 race。保留诊断样本的版本与复现命令，不能仅把测试超时调大。',
  },
];
