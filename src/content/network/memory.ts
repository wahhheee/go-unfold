import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const networkMemoryLesson: LessonDefinition = {
  id: 'network-memory',
  moduleId: 'network',
  label: '3.8 虚拟内存与缺页',
  eyebrow: 'SYSTEM / MEMORY',
  title: '申请了很多内存，为什么 RSS 没有同样上涨？',
  shortTitle: '虚拟内存、缺页、COW 与驻留量',
  path: '/learn/network-memory',
  description: [
    '把虚拟地址、物理页和分配器统计放回各自的层。',
    '触碰页、共享页、复制页，亲手观察内存的使用与回收。',
  ],
  minutes: 36,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    {
      id: 'mapping',
      title: '地址连续，不等于物理连续',
      keywords: '虚拟内存 MMU 页表 TLB 地址空间',
    },
    { id: 'lab', title: '从第一次触碰到写时复制', keywords: '实验 COW 缺页 RSS 物理帧' },
    {
      id: 'faults',
      title: '缺页、页缓存与持久化',
      keywords: 'minor major pagefault mmap MAP_PRIVATE MAP_SHARED fsync',
    },
    {
      id: 'metrics',
      title: '用正确口径解释内存曲线',
      keywords: 'RSS PSS VSS Go heap GOMEMLIMIT OOM cgroup overcommit',
    },
    { id: 'followups', title: '沿内存压力继续追问', keywords: '追问 大页 碎片 回收 GC' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: 'Linux Go 资料' },
  ],
  sources: [
    {
      title: 'Linux · Concepts overview',
      note: '虚拟内存、页表、TLB、匿名页、回收与 OOM',
      url: 'https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html',
    },
    {
      title: 'Linux mmap(2)',
      note: '私有写时复制、共享映射与映射生命周期',
      url: 'https://man7.org/linux/man-pages/man2/mmap.2.html',
    },
    {
      title: 'Linux proc_pid_smaps(5)',
      note: 'RSS、PSS 与映射级别统计',
      url: 'https://man7.org/linux/man-pages/man5/proc_pid_smaps.5.html',
    },
    {
      title: 'Linux getrusage(2)',
      note: 'minor / major fault 的统计含义',
      url: 'https://man7.org/linux/man-pages/man2/getrusage.2.html',
    },
    {
      title: 'Linux · Overcommit accounting',
      note: '虚拟内存承诺策略与配置差异',
      url: 'https://docs.kernel.org/mm/overcommit-accounting.html',
    },
    {
      title: 'Linux · cgroup v2 memory',
      note: 'memory.current、memory.high、memory.max 与事件',
      url: 'https://docs.kernel.org/admin-guide/cgroup-v2.html',
    },
    {
      title: 'Go debug.SetMemoryLimit',
      note: '运行时软限制范围与外部内存的区别',
      url: 'https://pkg.go.dev/runtime/debug#SetMemoryLimit',
    },
  ],
  Content: lazy(() => import('../lessons/network-memory.mdx')),
};
export const networkMemoryQuestions: Question[] = [
  {
    id: 'net-vm-range',
    lessonId: 'network-memory',
    title: '虚拟连续不等于物理连续',
    prompt: '进程看到一段连续虚拟地址，能据此认定对应物理页也连续吗？',
    options: [
      '能，虚拟地址就是物理地址',
      '不能，页表可将连续虚拟页映射到不同物理帧',
      '能，只要是 Go slice',
    ],
    answer: 1,
    explanations: [
      '有 MMU 的常见系统通过映射翻译地址。',
      '正确。连续性属于地址空间的视图，不自动等于物理布局。',
      'Go slice 的连续元素语义不承诺连续物理页。',
    ],
    takeaway: '地址视图与物理存储分开推理。',
  },
  {
    id: 'net-vm-cow',
    lessonId: 'network-memory',
    title: '两份 RSS 不一定两份物理帧',
    prompt:
      '实验中父进程写过一页，再派生子进程，双方各驻留 4 KiB 且尚未写共享页。去重物理帧占多少？',
    options: ['8 KiB', '0 KiB', '4 KiB'],
    answer: 2,
    explanations: [
      '两个映射统计同一帧，不是已经复制两份。',
      '第一次写入已经分配了帧。',
      '正确。COW 先共享，后续写入才需要独立副本；忽略模型以外的页表等成本。',
    ],
    takeaway: 'RSS 可重复计入共享页，不宜简单相加估算唯一物理占用。',
  },
  {
    id: 'net-vm-fault',
    lessonId: 'network-memory',
    title: '缺页不一定访问磁盘',
    prompt: '首次写匿名页或触发写时复制时出现缺页，可以据此认定发生磁盘 I/O 吗？',
    options: [
      '不能，缺页可能仅需分配或复制内存页',
      '能，page fault 就是磁盘慢',
      '能，缺页必然导致程序崩溃',
    ],
    answer: 0,
    explanations: [
      '正确。minor fault 可不涉及从磁盘调入；major fault 才涉及相应 I/O 等处理。',
      '把硬件异常处理与磁盘读取混成了一个概念。',
      '合法映射的缺页通常由内核处理，非法访问才可能导致信号或崩溃。',
    ],
    takeaway: '缺页是一次处理入口，原因与代价需要继续分类。',
  },
  {
    id: 'net-vm-limit',
    lessonId: 'network-memory',
    title: 'Go 软限制不是容器总账',
    prompt: '设置 GOMEMLIMIT 后，是否保证进程 RSS 与容器 memory.current 永远小于该值？',
    options: [
      '保证，因为所有内存都由 Go GC 管',
      '不保证，它是 Go 运行时管理内存的软限制，口径与外部资源不同',
      '保证，只要手动 runtime.GC',
    ],
    answer: 1,
    explanations: [
      'cgo、显式 mmap 等外部分配以及系统统计口径都不等同于 Go 运行时内存。',
      '正确。仍需为非 Go 管理部分、峰值和容器计费留余量。',
      'GC 不会自动释放所有外部映射，也不提供总 RSS 的硬上限。',
    ],
    takeaway: '先统一计量口径，再设置预算与余量。',
  },
];
export const memoryFollowups: FollowupItem[] = [
  {
    question: '缺页和 TLB miss 是一回事吗？',
    label: '翻译缓存',
    answer:
      '不是。TLB 缓存地址翻译，未命中可通过已有页表找到映射；缺页表示当前访问需要内核处理，例如建立映射、COW 或处理权限问题。一次 TLB miss 不一定陷入缺页异常。',
    deeper: '大页一定更好吗？',
    point:
      '大页可降低翻译成本，也可能增加分配、碎片、复制或回收代价。根据工作集和延迟目标测量，不要把一个优化当成通用开关。',
  },
  {
    question: 'fork 为何可能先便宜、后变贵？',
    label: '延迟复制',
    answer:
      '常见 Linux 实现先共享适合 COW 的页，同时仍有页表等开销；父或子随后大量写入会触发复制并扩大物理占用。不能只看 fork 当刻的内存曲线。',
    deeper: '子进程立刻 exec 呢？',
    point:
      'exec 替换原映像，许多原映射不用再保留；这正是先复制全部数据再马上丢弃通常没有必要的场景。',
  },
  {
    question: '释放 Go 对象，RSS 为什么不立刻下降？',
    label: '三层回收',
    answer:
      '对象变得不可达、GC 回收对象、分配器复用空间、运行时向系统释放页，是不同事件。碎片、仍存活对象与系统计量更新都会影响曲线；看 heap 与 RSS 的组合证据。',
    deeper: '需要每个请求结束就手动 GC 吗？',
    point:
      '通常不应该。强制 GC 可能增加延迟而不解决外部分配或活对象问题；先识别占用来源和存活原因。',
  },
  {
    question: 'mmap 写完就保证断电后数据还在吗？',
    label: '可见与持久',
    answer:
      '不保证。共享映射的修改可以先体现在页缓存；私有映射更不会把私有写回原文件。持久化还需要按文件系统、同步接口与硬件契约安排，不能用另一个进程读到证明落盘。',
    deeper: '内存分配成功后永远不会 OOM 吗？',
    point:
      '不能推导。承诺策略、后续触碰、内存压力及 cgroup 上限会影响结果；分配器成功不等于未来每次使用都有无限资源。',
  },
];
