import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const performanceLesson: LessonDefinition = {
  id: 'go-performance',
  moduleId: 'go',
  label: '1.8 基准与剖析',
  eyebrow: 'GO / PERFORMANCE',
  title: '快了多少，为什么快，换个负载还成立吗？',
  shortTitle: '基准测试与性能剖析',
  path: '/learn/go-performance',
  description: [
    '建立可复验基线，用基准、pprof 与 trace 回答不同问题。',
    '辨别分配流量、内存存量与等待时间，避免优化错误的目标。',
  ],
  minutes: 36,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'question', title: '先定义要改善的指标', keywords: '性能 基线 P99 吞吐 代表负载' },
    { id: 'benchmark', title: '写一个可信基准', keywords: 'B.Loop Go1.24 benchstat benchmem DCE' },
    { id: 'profiles', title: '给问题选正确画像', keywords: 'pprof CPU block mutex trace' },
    { id: 'lab', title: '切换内存画像的口径', keywords: 'inuse_space alloc_space 分配 存活 实验' },
    {
      id: 'workflow',
      title: '采样、解释、验证闭环',
      keywords: '诊断 安全 127.0.0.1 FlightRecorder',
    },
    { id: 'followups', title: '性能结论的适用条件', keywords: '追问 基准 优化 火焰图' },
    { id: 'sources', title: '记忆锚点与依据', keywords: '版本 核验' },
  ],
  sources: [
    {
      title: 'testing.B.Loop',
      note: '计时边界、保活规则与规范循环形式',
      url: 'https://pkg.go.dev/testing#B.Loop',
    },
    {
      title: 'Go 1.24 发布说明',
      note: 'B.Loop 的版本起点',
      url: 'https://go.dev/doc/go1.24#testing',
    },
    {
      title: '官方 benchstat 工具',
      note: '重复样本的统计摘要与比较',
      url: 'https://pkg.go.dev/golang.org/x/perf/cmd/benchstat',
    },
    {
      title: '标准库 runtime/pprof',
      note: '各类画像口径、flat/cumulative 解释的基础',
      url: 'https://pkg.go.dev/runtime/pprof',
    },
    {
      title: '标准库 net/http/pprof',
      note: '诊断路由、采样参数与显式启用的画像',
      url: 'https://pkg.go.dev/net/http/pprof',
    },
    {
      title: 'Go diagnostics 指南',
      note: '剖析、执行追踪与观测工具选择',
      url: 'https://go.dev/doc/diagnostics',
    },
    {
      title: 'Go 1.25 · trace 飞行记录器',
      note: '保留滚动窗口，在异常后获取近期执行事件',
      url: 'https://go.dev/doc/go1.25#trace-flight-recorder',
    },
  ],
  Content: lazy(() => import('../lessons/go-performance.mdx')),
};
export const performanceQuestions: Question[] = [
  {
    id: 'go-perf-loop',
    lessonId: 'go-performance',
    title: '基准先明确计时范围',
    prompt: '使用标准形式 for b.Loop() { ... }，把输入构造放在第一次 Loop 调用之前。哪项正确？',
    options: [
      '这部分准备默认不计入循环测量，但是否排除它必须符合真实问题',
      '只要用了 Loop，整个函数都不计时',
      '还必须在 Loop 里面再循环 b.N 次',
    ],
    answer: 0,
    explanations: [
      '正确。Loop 管理计时边界；排除准备成本不是一律正确，要看是否属于待测操作。',
      'Loop 的目的正是测量其循环体，结束后才停止计时。',
      '两种循环协议不能嵌套混用，否则测量单位错误。',
    ],
    takeaway: '计时边界要匹配问题，不能为了数字好看排除成本。',
  },
  {
    id: 'go-perf-memory',
    lessonId: 'go-performance',
    title: '高分配与高保留需要不同证据',
    prompt: '一个函数累计分配很大，但对象很快释放。优先用哪个 pprof 视角看它的分配流量？',
    options: ['inuse_space', 'alloc_space', 'goroutine 数量'],
    answer: 1,
    explanations: [
      '它侧重当前仍在使用的内存，可能看不到已经回收的大量临时对象。',
      '正确。alloc_space 统计累计分配字节，比较时还需匹配时间窗口和采样条件。',
      'goroutine 数量不能替代分配画像。',
    ],
    takeaway: 'alloc 看流量，inuse 看存量。',
  },
  {
    id: 'go-perf-cpu',
    lessonId: 'go-performance',
    title: 'CPU 不高，请求却很慢',
    prompt: '请求平均耗时 1s，CPU 画像里没有明显热点，就能得出“Go 调度器坏了”吗？',
    options: [
      '能，CPU 画像能显示所有等待时间',
      '不能，还要检查 I/O、连接池、同步阻塞、配额和 trace',
      '能，只要火焰图很窄',
    ],
    answer: 1,
    explanations: [
      'CPU 画像主要采样消耗 CPU 的调用栈，阻塞墙钟时间不是同一口径。',
      '正确。先定位等待来源，再选择 block、mutex、trace 或下游观测。',
      '火焰图宽度表示所选样本量，并非请求时间轴。',
    ],
    takeaway: 'CPU 样本不等于墙钟延迟。',
  },
];
export const performanceFollowups: FollowupItem[] = [
  {
    question: '一跑 benchmark 快了 10%，可以写进发布结论吗？',
    label: '测量可信度',
    answer:
      '先复跑并控制工具链、硬件、CPU 配额、GOMAXPROCS、输入分布和后台负载。用多个样本评估噪声，再确认收益在真实服务指标上成立。共享机器的一组纳秒数字不适合包装成普遍承诺。',
    deeper: '为什么不用 -race 的结果来比较性能？',
    point: '竞态检测会改变代码和运行开销，适合查问题，不应直接代表正常构建性能。',
  },
  {
    question: 'CPU 火焰图最宽的框就是最该删的代码吗？',
    label: '解释样本',
    answer:
      '宽度表示采样量，通常包含子调用；要区分 flat 与 cumulative。某个上层函数很宽，可能因为它调用了昂贵的下层路径。先确认样本、时间窗口和业务含义，再判断是重复工作、算法问题还是不可省的成本。',
    deeper: '火焰图横向位置代表先后执行顺序吗？',
    point: '通常不是。想看事件先后、排队和阻塞关系，应使用执行 trace 等时间线证据。',
  },
  {
    question: '一个热点快十倍，服务为什么只快一点？',
    label: '总体收益',
    answer:
      '总时间还包含其他部分。若只有 10% 的串行耗时能被这个优化影响，即使它快十倍，总耗时也约为原来的 91%，整体加速只有约 1.10 倍。真实服务还受并发、排队和瓶颈转移影响。',
    deeper: '减少分配之后 P99 却变差，可能吗？',
    point:
      '可能。池争用、持锁时间、缓存局部性和内存保留都可能变化；重新看系统目标而不是只看 allocs/op。',
  },
  {
    question: '线上直接常开全部画像，信息不是最多吗？',
    label: '诊断成本',
    answer:
      '画像、trace、采样频率和数据量都有成本。block、mutex 通常需显式设置采样，先在可控负载验证开销，限制采集窗口并保护诊断入口。Go 1.25 的 FlightRecorder 可保留近期 trace 窗口，适合在异常后触发保存，但也有预算和接入要求。',
    deeper: '堆画像显示某处保留很多对象，能直接定位谁持有它们吗？',
    point: '它主要归因到分配调用栈，不是完整引用链分析器。结合对象生命周期和持有容器继续定位。',
  },
];
