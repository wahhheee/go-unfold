import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const mutexLesson: LessonDefinition = {
  id: 'concurrency-mutex',
  moduleId: 'concurrency',
  label: '2.4 锁与业务不变量',
  eyebrow: 'CONCURRENCY / MUTEX',
  title: '每次读写都加锁，为什么还会超卖？',
  shortTitle: 'Mutex、RWMutex 与业务不变量',
  path: '/learn/concurrency-mutex',
  description: [
    '锁保护的不是某一行代码，而是一段必须保持成立的关系。',
    '从库存扣减追到锁复制、读写锁、等待环与尾延迟。',
  ],
  minutes: 40,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'invariant', title: '先定义不能被打破的关系', keywords: '库存 超卖 原子性 race 临界区' },
    { id: 'lab', title: '同一把锁，不同的保护范围', keywords: '实验 时间线 递归 读锁' },
    {
      id: 'identity',
      title: '锁的身份与生命周期',
      keywords: '复制 指针 接收者 零值 defer TryLock',
    },
    { id: 'rwmutex', title: '读写锁不是免费升级', keywords: 'RLock 升级 降级 写者 递归 性能' },
    {
      id: 'engineering',
      title: '等待关系与服务边界',
      keywords: '锁顺序 I/O 死锁 公平 饥饿 Context',
    },
    { id: 'followups', title: '从加锁追到业务一致性', keywords: '追问 多进程 事务 快照 分片' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '版本 规范 race 测试' },
  ],
  sources: [
    {
      title: 'PostgreSQL · UPDATE',
      note: 'WHERE 条件更新及 RETURNING 的结果语义',
      url: 'https://www.postgresql.org/docs/current/sql-update.html',
    },
    {
      title: 'sync.Mutex',
      note: '同步关系、不可复制与 TryLock 边界',
      url: 'https://pkg.go.dev/sync#Mutex',
    },
    {
      title: 'sync.RWMutex',
      note: '等待写者、禁止递归读锁及升级降级',
      url: 'https://pkg.go.dev/sync#RWMutex',
    },
    {
      title: 'Go 内存模型 · Locks',
      note: '解锁与后续加锁之间的顺序',
      url: 'https://go.dev/ref/mem#locks',
    },
    {
      title: 'Go 1.27.1 · Mutex 实现',
      note: '正常与饥饿模式属于实现，不是等待上界',
      url: 'https://cs.opensource.google/go/go/+/refs/tags/go1.27.1:src/internal/sync/mutex.go',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-mutex.mdx')),
};

export const mutexQuestions: Question[] = [
  {
    id: 'con-mutex-invariant',
    lessonId: 'concurrency-mutex',
    title: 'race 通过之后，还要问什么',
    prompt: '检查库存和扣减库存各自持有同一 Mutex，中间解锁。race 没报错，可以保证不超卖吗？',
    options: [
      '可以，只要所有读写都用了锁',
      '不能，检查与扣减之间可能插入另一个成功检查',
      '换成 RWMutex 就可以',
    ],
    answer: 1,
    explanations: [
      '内存访问有序不等于整个业务操作原子。',
      '正确。应将检查和扣减纳入同一个临界区，或使用有等价条件更新语义的机制。',
      '锁的种类不能修补被拆开的不变量。',
    ],
    takeaway: '无数据竞争，不代表无业务竞争。',
  },
  {
    id: 'con-mutex-copy',
    lessonId: 'concurrency-mutex',
    title: '复制的是数据，也是锁',
    prompt: '含 Mutex 和 map 的结构体使用值接收者，方法里锁住接收者的 Mutex 后写 map。问题是什么？',
    options: [
      'map 会深复制，所以没有共享',
      'Mutex 自动引用同一底层锁',
      '锁被复制，而 map 仍指向共享数据；不能形成共同保护',
    ],
    answer: 2,
    explanations: [
      'map 赋值不会深复制其内容。',
      'Mutex 不是可复制的共享句柄，首次使用后尤其禁止复制。',
      '正确。方法通常应使用指针接收者，结构体存储和传递也要避免后续复制。',
    ],
    takeaway: '保护同一份数据，必须遵守同一锁协议。',
  },
  {
    id: 'con-mutex-rw',
    lessonId: 'concurrency-mutex',
    title: '读锁也可能把自己堵住',
    prompt: 'G1 持有 RLock，G2 已在等待 Lock。G1 再次 RLock，会怎样？',
    options: [
      '第二次读锁可能阻塞，形成 G1 等写者、写者等 G1 的等待环',
      '读者永远不会阻塞其他读者',
      '自动升级为写锁',
    ],
    answer: 0,
    explanations: [
      '正确。等待的写者会挡住新读锁，所以不能递归读锁。',
      '只考虑当前读者、忽略等待写者，会遗漏这个死锁路径。',
      'RWMutex 不支持读锁升级，也不识别某次 RLock 属于同一个 G。',
    ],
    takeaway: '读锁可并发，不等于可递归。',
  },
  {
    id: 'con-mutex-try',
    lessonId: 'concurrency-mutex',
    title: '没拿到锁，就没有读权限',
    prompt: 'TryLock 返回 false。此时直接读取受锁保护的普通字段，理由是“只是看一眼旧值”，成立吗？',
    options: [
      '成立，失败也建立内存屏障',
      '不成立，失败不建立同步关系，也没有获得受保护数据的访问权限',
      '成立，只要字段是 int',
    ],
    answer: 1,
    explanations: [
      '文档明确指出失败的 TryLock 不建立 synchronizes-before 关系。',
      '正确。需要放弃操作，或走另一个明确安全的快照、原子读取协议。',
      '普通整数与写入并发且无同步，也会有数据竞争。',
    ],
    takeaway: 'TryLock 失败，不是允许读旧值。',
  },
];

export const mutexFollowups: FollowupItem[] = [
  {
    question: '把整个请求都锁住，正确性不就解决了吗？',
    label: '保护范围',
    answer:
      '同一进程内它可能串行化这部分请求，但锁外的访问、其他实例和数据库事务并不受它保护。慢网络调用还会扩大持锁时间，让所有等待者的尾延迟受下游影响。先找出真正的不变量，再决定哪些状态转换必须一起发生。',
    deeper: '把网络调用移到锁外，回来直接写结果可以吗？',
    point:
      '不一定。期间状态可能变化；通常要重新校验版本或条件，才能提交结果。缩短锁时间不能以丢掉一致性为代价。',
  },
  {
    question: 'Mutex 是不是可重入锁？必须同一个 goroutine 解锁吗？',
    label: '所有权',
    answer:
      'Mutex 不可重入；持锁后再次 Lock 会阻塞，没有递归计数。另一方面，Go 的 Mutex 不绑定特定 goroutine，文档允许一个 G 加锁、另一个 G 按协议解锁。这两件事并不矛盾。',
    deeper: '用跨 G 解锁就能随意交接资源吗？',
    point:
      '仍要证明谁负责且只负责解锁一次、数据何时可用、取消时如何清理。普通业务用局部 Lock/defer Unlock 更容易审计。',
  },
  {
    question: '读多写少为什么不一定适合 RWMutex？',
    label: '成本与测量',
    answer:
      '读锁仍需协调共享状态，读临界区极短时成本可能超过并发收益；核心数、写入频率和等待写者都会影响尾延迟。用代表性的读写比例、临界区长度、并行度和 p99 测量，再决定 Mutex、RWMutex、分片或不可变快照。',
    deeper: '把锁分片一定提升吞吐吗？',
    point:
      '热点键仍可能集中在一片；跨片不变量增加锁顺序和事务复杂度。分片前要确认竞争位置，分片后重测。',
  },
  {
    question: '运行时有饥饿模式，能保证一毫秒内拿到锁吗？',
    label: '实现与契约',
    answer:
      '不能。当前实现用等待时间参与模式切换，目的是缓解病态尾延迟，不是 API 给调用方的排队时限。持锁者可能阻塞或长时间未调度，系统负载也会影响等待。Mutex 不承诺严格 FIFO。',
    deeper: '请求已取消，正在 Lock 的 G 会自动退出吗？',
    point:
      '不会。Mutex.Lock 没有 Context 参数。应控制临界区和准入，不能为每次加锁额外启动一个无人回收的 G 假装可取消。',
  },
];
