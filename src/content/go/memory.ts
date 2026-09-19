import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const memoryLesson: LessonDefinition = {
  id: 'go-memory',
  moduleId: 'go',
  label: '1.7 分配与 GC',
  eyebrow: 'GO / MEMORY',
  title: '对象活多久，比写了 new 更重要。',
  shortTitle: '分配、逃逸与 GC',
  path: '/learn/go-memory',
  description: [
    '沿着对象的生命周期，理解逃逸、可达性和垃圾回收。',
    '把 GOGC、Green Tea 与软内存限制放回正确的测量边界。',
  ],
  minutes: 36,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'escape', title: '逃逸是编译器的生命周期判断', keywords: 'new 栈 堆 逃逸 内联 -m' },
    {
      id: 'collector',
      title: '并发标记、屏障与 Green Tea',
      keywords: '三色 写屏障 STW Go1.26 Green Tea GC',
    },
    { id: 'lab', title: '调节 GOGC 的增长预算', keywords: 'GOGC heap goal 根 堆目标 实验' },
    {
      id: 'limit',
      title: '软内存限制不是 RSS 上限',
      keywords: 'GOMEMLIMIT Sys HeapReleased OOM 容器',
    },
    { id: 'retention', title: '减少分配与意外保留', keywords: 'sync.Pool 缓存 可达性 GC roots' },
    { id: 'followups', title: '从回收机制到排障证据', keywords: '追问 GC 延迟 finalizer 内存' },
    { id: 'sources', title: '记忆锚点与依据', keywords: '版本 核验' },
  ],
  sources: [
    {
      title: 'Go FAQ · 栈与堆',
      note: '分配位置属于实现选择，编译器检查逃逸',
      url: 'https://go.dev/doc/faq#stack_or_heap',
    },
    {
      title: 'Go GC 指南',
      note: '可达性、成本、GOGC 根集合公式与软限制',
      url: 'https://go.dev/doc/gc-guide',
    },
    {
      title: 'Go 1.26 · 新垃圾收集器',
      note: 'Green Tea 默认启用，优化标记扫描的局部性',
      url: 'https://go.dev/doc/go1.26#new-garbage-collector',
    },
    {
      title: 'Go 1.27.1 · GC 实现',
      note: '并发标记清扫、写屏障、STW 与辅助标记',
      url: 'https://github.com/golang/go/blob/go1.27.1/src/runtime/mgc.go',
    },
    {
      title: 'runtime/debug.SetMemoryLimit',
      note: 'Go 管理内存的软限制，排除 C 分配等外部内存',
      url: 'https://pkg.go.dev/runtime/debug#SetMemoryLimit',
    },
    {
      title: '标准库 sync.Pool',
      note: '临时复用，可随时移除，无持久性保证',
      url: 'https://pkg.go.dev/sync#Pool',
    },
    {
      title: '标准库 runtime/metrics',
      note: '运行时指标的名称、类型与含义',
      url: 'https://pkg.go.dev/runtime/metrics',
    },
  ],
  Content: lazy(() => import('../lessons/go-memory.mdx')),
};
export const memoryQuestions: Question[] = [
  {
    id: 'go-memory-new',
    lessonId: 'go-memory',
    title: '从语法猜分配位置并不可靠',
    prompt: 'func local() int { p := new(int); *p = 7; return *p }。new 是否保证分配到堆？',
    options: [
      '保证，new 的定义就是堆分配',
      '不保证，编译器可以证明生命周期并优化存储',
      '不保证，因为只有 make 才分配到堆',
    ],
    answer: 1,
    explanations: [
      'new 返回指向所需对象的指针，不规定物理分配位置。',
      '正确。是否逃逸、是否内联、是否消除对象，都属于具体编译结果。',
      'make 也不是“强制堆分配”开关。',
    ],
    takeaway: '语法表达语义，编译器选择存储。',
  },
  {
    id: 'go-memory-goal',
    lessonId: 'go-memory',
    title: '把根集合也算进去',
    prompt:
      '忽略内存限制等其他调节，存活堆 8 MiB，根扫描量 2 MiB，GOGC=100。指南模型的目标堆是多少？',
    options: ['16 MiB', '18 MiB', '20 MiB'],
    answer: 1,
    explanations: [
      '只把存活堆翻倍遗漏了根集合对预算的影响。',
      '正确：8+(8+2)×100%=18 MiB。这是目标，不是精确触发点或 RSS。',
      '根集合影响新增预算，但不能再作为存活堆重复累加。',
    ],
    takeaway: '目标 = 存活堆 +（存活堆 + 根）× GOGC%。',
  },
  {
    id: 'go-memory-limit',
    lessonId: 'go-memory',
    title: '软限制和容器上限不是一个口径',
    prompt: '容器限制 512 MiB，设置 GOMEMLIMIT=512MiB，能保证进程不会 OOM 吗？',
    options: [
      '能，Go 会拒绝所有超过限制的分配',
      '不能，限制是软的且不是完整进程 RSS 口径',
      '能，只要同时设置 GOGC=off',
    ],
    answer: 1,
    explanations: [
      '运行时会尝试控制管理内存，但不提供这种硬拒绝或不越界保证。',
      '正确。还要为 C 分配、映射、运行环境、突发与其他非 Go 内存留预算。',
      '内存限制在 GOGC=off 时仍可驱动 GC，关闭基于比例的目标不会形成 OOM 保障。',
    ],
    takeaway: '软限制控 Go 预算，容器上限需整体余量。',
  },
  {
    id: 'go-memory-pool',
    lessonId: 'go-memory',
    title: 'Pool 能保住一个重要对象吗',
    prompt: '把用户会话只存进 sync.Pool，之后 Get 能保证取回它吗？',
    options: [
      '能，只要还没有超过容量',
      '不能，Pool 条目可随时被移除，也不按键查找',
      '能，只要 Get 和 Put 在同一个 goroutine',
    ],
    answer: 1,
    explanations: [
      'Pool 没有持久缓存的容量和保留契约。',
      '正确。Pool 用于临时对象复用，程序必须允许未命中后重新构造。',
      '调用者身份不构成条目保留保证。',
    ],
    takeaway: 'Pool 是可丢弃复用，不是业务存储。',
  },
];
export const memoryFollowups: FollowupItem[] = [
  {
    question: '返回局部变量地址，函数结束后不就悬空了吗？',
    label: '生命周期',
    answer:
      '在安全 Go 中不会因为这个写法产生悬空指针。编译器必须保证被引用对象活得足够久，可能把它放到堆上，也可能通过内联等优化消除需要长期存储的对象。栈帧的词法作用域不等于对象必须销毁的时刻。',
    deeper: 'new 的对象、切片底层数组、接口装箱都能仅凭写法判断吗？',
    point: '不能。固定工具链、构建参数和调用上下文，用 -gcflags=-m=2 与分配画像验证。',
  },
  {
    question: 'Go GC 并发运行，为什么还会影响请求延迟？',
    label: '成本',
    answer:
      '仍有短暂 STW 阶段，标记会消耗 CPU 和内存带宽；分配较快时应用 goroutine 还可能承担辅助标记。扫描栈、争用和系统 CPU 限流也会放大影响。因此低暂停不等于零 CPU 成本或零尾延迟影响。',
    deeper: '把 GOGC 调大就一定更好吗？',
    point:
      '通常用更多内存换较少回收频率，但更大的活对象集、容器限制和突发会改变结果；先看分配率、存活量与实际延迟。',
  },
  {
    question: '当前堆不移动，那保存 uintptr 地址长期使用就安全了吗？',
    label: '指针规则',
    answer:
      '不能这样推导。uintptr 是整数，不是保持对象存活的引用；GC 与编译器不会按普通指针语义追踪它。goroutine 栈还可能移动，unsafe 转换有专门限制。当前堆收集器不压缩不是绕过 Go 指针规则的许可。',
    deeper: 'runtime.KeepAlive 能把任意错误的指针运算都修好吗？',
    point: '它只处理特定生命周期要求，不能使非法地址、错误转换或并发访问变正确。',
  },
  {
    question: '文件句柄交给 GC 清理，可以省掉 Close 吗？',
    label: '外部资源',
    answer:
      '不可以依赖及时回收。finalizer 或 cleanup 机制的运行时间不适合充当文件、连接和事务的确定性生命周期协议，进程退出也不能据此保证业务清理完成。显式关闭、回滚和结构化收尾仍然必要。',
    deeper: '堆对象已回收，为什么 RSS 还高？',
    point:
      '分清对象逻辑存活、分配器保留、向操作系统释放和操作系统统计口径；使用相应指标而不是单看一张截图。',
  },
];
