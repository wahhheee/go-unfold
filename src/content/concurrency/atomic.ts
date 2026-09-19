import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const atomicLesson: LessonDefinition = {
  id: 'concurrency-atomic',
  moduleId: 'concurrency',
  label: '2.5 原子操作与快照',
  eyebrow: 'CONCURRENCY / ATOMIC',
  title: '指针是原子的，配置就一定安全吗？',
  shortTitle: '原子操作与不可变快照',
  path: '/learn/concurrency-atomic',
  description: [
    '把不可分割的操作，与保持一致的一整份状态分开。',
    '从 CAS 重试走到快照发布、内部别名和 ABA。',
  ],
  minutes: 42,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'operation',
      title: '一个原子操作，不是一笔事务',
      keywords: 'SC 顺序一致 Add Load Store 复合状态',
    },
    { id: 'cas', title: 'CAS 失败后为什么必须重算', keywords: 'CompareAndSwap 重试 副作用 ABA' },
    { id: 'lab', title: '保留旧读者，观察新版本', keywords: '实验 快照 别名 map 克隆' },
    {
      id: 'snapshot',
      title: '发布前构造，发布后冻结',
      keywords: 'Pointer CopyOnWrite maps.Clone 版本 多写者',
    },
    {
      id: 'value',
      title: 'Value、typed nil 与复制边界',
      keywords: '原子类型 对齐 Value 类型一致 不可比较',
    },
    { id: 'followups', title: '原子之上仍有协议', keywords: '追问 性能 事务 ABA GC' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '版本 文档 测试' },
  ],
  sources: [
    {
      title: 'sync/atomic',
      note: '原子语义、顺序一致及底层函数的对齐要求',
      url: 'https://pkg.go.dev/sync/atomic',
    },
    {
      title: 'atomic.Pointer',
      note: '类型化指针、零值与不可复制约束',
      url: 'https://pkg.go.dev/sync/atomic#Pointer',
    },
    {
      title: 'atomic.Value',
      note: '具体类型一致、nil 规则与写时复制示例',
      url: 'https://pkg.go.dev/sync/atomic#Value',
    },
    {
      title: 'Go 内存模型 · Atomic values',
      note: '观察到原子操作效果时的同步关系',
      url: 'https://go.dev/ref/mem#atomic',
    },
    {
      title: 'maps.Clone',
      note: '克隆是浅复制，元素仍可能包含共享引用',
      url: 'https://pkg.go.dev/maps#Clone',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-atomic.mdx')),
};

export const atomicQuestions: Question[] = [
  {
    id: 'con-atomic-counter',
    lessonId: 'concurrency-atomic',
    title: '两次原子访问，不是一条原子增量',
    prompt: '两个 G 都执行 n.Store(n.Load()+1)，n 初始为 0。全部是原子操作，最终一定是 2 吗？',
    options: [
      '是，原子会自动合并成事务',
      '不是，都可能先读到 0，最后变成 1',
      '不是，因为原子操作没有内存可见性',
    ],
    answer: 1,
    explanations: [
      'Load 和 Store 各自原子，中间可以穿插其他操作。',
      '正确。单计数器增量应使用 Add(1)，或正确的 CAS 循环。',
      '问题是复合操作不原子，不是 Go 原子操作缺乏同步语义。',
    ],
    takeaway: '原子 Load + 原子 Store，仍可能丢更新。',
  },
  {
    id: 'con-atomic-snapshot',
    lessonId: 'concurrency-atomic',
    title: '原子入口保护不到内部写入',
    prompt:
      'atomic.Pointer 发布了配置结构体；之后直接修改其中的 map，读者仍通过 Load 取得配置。安全吗？',
    options: [
      '安全，map 在原子指针里面',
      '安全，Go GC 会同步所有 map 操作',
      '不安全，指针发布不保护指向对象后续的普通读写',
    ],
    answer: 2,
    explanations: [
      '原子性不会递归扩展到对象图。',
      'GC 负责内存管理，不为业务对象的访问建立这套同步关系。',
      '正确。需要不可变对象，或者对内部可变状态另有完整同步协议。',
    ],
    takeaway: '发布是一个点，不可变是整个生命周期。',
  },
  {
    id: 'con-atomic-value',
    lessonId: 'concurrency-atomic',
    title: 'Value 不是任意类型容器',
    prompt: 'var v atomic.Value; v.Store(int64(1)); v.Store(int(2))。第二次 Store 会怎样？',
    options: [
      'panic，因为同一个 Value 必须保持具体类型一致',
      '自动转成 int64',
      '成功，因为都是数字',
    ],
    answer: 0,
    explanations: [
      '正确。int 与 int64 是不同的具体类型。',
      'Value 不执行数值类型转换。',
      '是否都是数字、底层大小是否相同，都不能替代类型一致。',
    ],
    takeaway: 'Value 类型固定，Store(nil) 也会 panic。',
  },
  {
    id: 'con-atomic-aba',
    lessonId: 'concurrency-atomic',
    title: 'CAS 看到的是现在，不是历史',
    prompt:
      'G1 读到指针 A；其他操作把入口改成 B，再改回同一个 A。G1 的 CAS(A,C) 能据此发现中间发生过变化吗？',
    options: [
      '能，CAS 会自动记录版本历史',
      '不能，当前仍等于 A；是否有问题取决于算法是否依赖历史',
      '不会发生，GC 禁止把旧指针重新放回入口',
    ],
    answer: 1,
    explanations: [
      'CAS 比较的是当前值与预期值，不附带历史日志。',
      '正确。依赖版本历史时，需要能一起比较的版本化状态或其他协议。',
      '只要还持有 A，就可以重新发布它；内存未释放也会出现逻辑 ABA。',
    ],
    takeaway: '值相等，不证明中间没有变过。',
  },
];

export const atomicFollowups: FollowupItem[] = [
  {
    question: '每个字段都改成 atomic，就得到一致快照了吗？',
    label: '复合状态',
    answer:
      '没有。读者可能读到新版本号与旧额度，两个独立 Load 不构成同一时刻的快照。把互相依赖的字段构造在同一不可变对象里，再用一个原子根指针发布，并在一次业务读取中只 Load 一次，才能把版本边界对齐。',
    deeper: '发布对象包含 map[string]*Rule，maps.Clone 足够吗？',
    point:
      '它只克隆 map 的键值槽，Rule 指针仍共享。旧 Rule 必须不可变，或者为将要修改的可达对象继续复制。',
  },
  {
    question: '没有写锁，两个写者分别构造新配置再 Store，有什么问题？',
    label: '写者协调',
    answer:
      '两者可能基于同一旧快照构造不同结果，后发布者覆盖前一个结果。没有数据竞争也可以丢更新。按业务选择写锁串行化读改写，或 CAS 发布失败后基于新版本重新构造；如果本来就是完整替换且允许后写覆盖，也必须明确这个契约。',
    deeper: '重试循环里可以顺便扣费、发消息吗？',
    point:
      '失败的 CAS 可能多次重试，副作用会重复。纯状态计算留在循环内，外部提交另有幂等或事务协议，不能靠一次 CAS 包住远端操作。',
  },
  {
    question: 'Go 有 GC，所以 ABA 可以忽略吗？',
    label: '历史与身份',
    answer:
      'GC 避免了一些手工内存回收相关的悬空指针问题，但不能阻止有效对象 A 被移走后重新放回。若算法把“当前仍是 A”误当成“从未发生变化”，逻辑 ABA 仍存在。也并非所有 ABA 都有害，要先说清算法依赖哪个历史条件。',
    deeper: '额外加一个原子版本号就修好了吗？',
    point:
      '指针和版本若分开比较或更新，仍有组合竞争。它们需要作为同一个状态参与比较，或改用锁等协议；还要考虑版本回绕与旧状态复用。',
  },
  {
    question: 'atomic 没有 Mutex，所以一定更快且不会等待吗？',
    label: '进度与成本',
    answer:
      '不能笼统承诺。高竞争下缓存一致性流量和 CAS 重试可能很重，某个调用也可能反复失败。原子 API 的语义不等于你的整个算法具有某种进度保证，更不等于各架构都更快。先证明算法，再做代表性基准与尾延迟测量。',
    deeper: '不可变快照的代价是什么？',
    point:
      '复制和分配会增加写入成本；旧读者保留引用时，旧对象继续存活。适合读多写少、可接受整版发布的数据，并要控制快照大小和持有时间。',
  },
];
