import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const mapsLesson: LessonDefinition = {
  id: 'go-maps',
  moduleId: 'go',
  label: '1.5 map 与哈希表',
  eyebrow: 'GO / MAPS',
  title: '查找很快，不代表顺序、快照和并发都可靠。',
  shortTitle: 'map 与哈希表边界',
  path: '/learn/go-maps',
  description: [
    '先掌握键、值与迭代的语言规则，再进入 Swiss Table。',
    '把结构安全、复合操作与业务不变量分别处理。',
  ],
  minutes: 32,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'semantics', title: 'map 值与键的规则', keywords: 'nil map comma ok NaN 可寻址' },
    { id: 'iteration', title: '遍历顺序与修改规则', keywords: 'range 随机 遍历 删除 排序' },
    {
      id: 'lab',
      title: 'Swiss Table 如何筛选候选',
      keywords: 'Go1.24 哈希 H2 group tombstone 墓碑 扩容',
    },
    {
      id: 'concurrency',
      title: '并发安全与复合操作',
      keywords: 'sync.Map Mutex 原子性 fatal race',
    },
    { id: 'followups', title: '从结构到业务不变量', keywords: '追问 内存 Clone 快照 并发' },
    { id: 'sources', title: '记忆锚点与依据', keywords: '版本 核验' },
  ],
  sources: [
    {
      title: 'Go 规范 · map 类型',
      note: '键类型、nil map 与容量提示',
      url: 'https://go.dev/ref/spec#Map_types',
    },
    {
      title: 'Go 规范 · 索引与赋值',
      note: '缺失键返回零值；map 索引不是可寻址变量',
      url: 'https://go.dev/ref/spec#Index_expressions',
    },
    {
      title: 'Go 规范 · range',
      note: '遍历中删除和新增条目的语义',
      url: 'https://go.dev/ref/spec#For_range',
    },
    {
      title: 'Go 官方博客 · Faster Go maps with Swiss Tables',
      note: 'Go 1.24 的实现更新、控制字节、分表增长',
      url: 'https://go.dev/blog/swisstable',
    },
    {
      title: 'Go 1.27.1 · map 实现',
      note: '八槽组、墓碑、探测与目录均属于此实现',
      url: 'https://github.com/golang/go/blob/go1.27.1/src/internal/runtime/maps/map.go',
    },
    {
      title: '标准库 sync.Map',
      note: '使用场景、原子方法与 Range 非一致快照',
      url: 'https://pkg.go.dev/sync#Map',
    },
    {
      title: 'Go 内存模型',
      note: '共享可变状态需要同步；并发不是由“不同 key”自动保证',
      url: 'https://go.dev/ref/mem',
    },
    {
      title: '标准库 maps',
      note: 'Clone 为浅复制，对 NaN 等非自反键无特殊处理',
      url: 'https://pkg.go.dev/maps',
    },
  ],
  Content: lazy(() => import('../lessons/go-maps.mdx')),
};
export const mapQuestions: Question[] = [
  {
    id: 'go-map-nil',
    lessonId: 'go-maps',
    title: 'nil map 的读写并不对称',
    prompt: 'var m map[string]int。以下哪个操作会 panic？',
    options: ['读取 m["x"]', 'delete(m,"x")', 'm["x"] = 1'],
    answer: 2,
    explanations: [
      '读缺失键返回元素零值；comma-ok 形式还会返回 false。',
      '删除 nil map 或不存在的键是无操作。',
      '正确。给 nil map 写条目会 panic，需要先 make 或通过字面量初始化。',
    ],
    takeaway: 'nil 可读可删，写前初始化。',
  },
  {
    id: 'go-map-range',
    lessonId: 'go-maps',
    title: '遍历不是随机抽样接口',
    prompt: '单 goroutine 遍历 map 时，删除一个还未遍历到的条目。规范保证什么？',
    options: [
      '一定 panic，因为迭代期间不能修改',
      '该条目不会被本次遍历产生',
      '所有新增条目也一定不会出现',
    ],
    answer: 1,
    explanations: [
      '单 goroutine 遍历期间修改 map 是允许的，不能与并发写混淆。',
      '正确。新增条目则可能出现，也可能不出现；顺序没有保证。',
      '对新增条目没有这个保证。',
    ],
    takeaway: '未到先删则不见；新增可见也可不见。',
  },
  {
    id: 'go-map-swiss',
    lessonId: 'go-maps',
    title: '短哈希只是过滤器',
    prompt: 'Go 当前 Swiss Table 思路中，一个槽的 H2 与目标 H2 相同，能直接返回这个槽的值吗？',
    options: [
      '能，短哈希相同就代表键相等',
      '不能，还要比较完整键',
      '不能，必须把全 map 的键全部比较一遍',
    ],
    answer: 1,
    explanations: [
      '短哈希可能碰撞，不是键身份的完整证明。',
      '正确。控制字节一次筛选一组候选，随后通过完整键比较确认。',
      '探测依照哈希与空槽等规则推进，不要求每次全表扫描。',
    ],
    takeaway: '短哈希筛候选，完整键定结果。',
  },
  {
    id: 'go-map-atomic',
    lessonId: 'go-maps',
    title: '方法安全不代表业务步骤原子',
    prompt:
      '用 sync.Map 的 Load 取计数，加一后 Store 回去。两个 goroutine 同时执行，能保证计数不丢失吗？',
    options: [
      '能，sync.Map 的所有组合操作都原子',
      '不能，读改写整体仍需要同步或合适的原子更新协议',
      '只要两个 goroutine 在同一个 P 上就能',
    ],
    answer: 1,
    explanations: [
      '单次方法并发安全不自动覆盖多个方法之间的间隔。',
      '正确。可以使用一个锁保护不变量，或按值类型与生命周期设计 CompareAndSwap 重试等方案。',
      '同一个 P 上也可以交错执行多步操作。',
    ],
    takeaway: '单步安全不等于多步原子。',
  },
];
export const mapFollowups: FollowupItem[] = [
  {
    question: '不同 goroutine 写不同 key，为什么也不安全？',
    label: '共享结构',
    answer:
      '普通 map 的写入可能修改共享的元数据、组、表或目录；不同 key 不代表不同容器结构。并发只读可以在安全发布且没有并发写入的前提下进行；只要混入未同步写，就不能据此保证安全。',
    deeper: '没出现 concurrent map writes，是不是没有竞态？',
    point:
      '运行时检测不是竞态证明，检测到的 fatal 也不是普通可 recover 的 panic。使用同步与 race detector，后者仍只覆盖实际执行路径。',
  },
  {
    question: 'map 扩容时还有旧面经里的 overflow bucket 和渐进搬桶吗？',
    label: '实现更新',
    answer:
      '不要混用实现年代。Go 1.24 起主线实现改为 Swiss Table 思路，当前版本由槽、组、表和目录组织；单张表增长需要重新布局，大 map 通过分表控制一次增长的范围。旧 bucket/overflow 叙述可以用于旧版本源码，但不能直接套到当前实现。',
    deeper: '是不是每次插入都严格 O(1)？',
    point:
      '通常讨论平均或摊还成本；碰撞、分配、表增长与目录调整会产生额外工作，不承诺每次操作恒定延迟。',
  },
  {
    question: 'clear(m) 以后内存一定还给操作系统吗？',
    label: '生命周期',
    answer:
      'clear 删除全部条目，但不会承诺缩容或立刻归还内存。把当前变量设为 nil 或换新 map，也只移除了这一个引用；其他别名仍可能保留原 map。条目可达性、容器容量、GC 回收与进程 RSS 要分别观察。',
    deeper: 'maps.Clone 能隔离 map 中的指针对象吗？',
    point: '它浅复制键和值；map 结构独立，值中的指针、切片或其他引用仍可能共享。',
  },
  {
    question: '什么时候适合 sync.Map？',
    label: '工程选择',
    answer:
      '官方推荐的典型场景是键只写一次而读很多次，或多个 goroutine 主要操作互不重叠的键集合。大多数业务先用普通 map 配合清晰锁范围，类型安全且容易同时维护多个不变量。sync.Map 的 Range 不保证一致快照，缓存淘汰、限额与多键事务也不会自动获得。',
    deeper: '换成分片锁，就能安全做跨分片转账吗？',
    point: '跨键不变量仍需要明确锁顺序和原子边界；减少争用不是事务正确性的证明。',
  },
];
