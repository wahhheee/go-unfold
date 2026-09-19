export type Module = {
  id: string;
  number: string;
  title: string;
  description: string;
  topics: string[];
  stage: '起点' | '语言基础' | '系统原理' | '工程实践';
};

export const modules: Module[] = [
  {
    id: 'preface',
    number: '00',
    title: '序章',
    description: '建立理解、验证、表达的学习闭环。',
    topics: ['如何使用这本手册', '从一道分布式锁问题开始'],
    stage: '起点',
  },
  {
    id: 'go',
    number: '01',
    title: 'Go 语言与运行时',
    description: '从语言语义出发，理解代码为什么这样运行。',
    topics: [
      '类型、接口与泛型',
      '切片、映射与内存布局',
      'GMP 调度与抢占',
      'GC、逃逸分析与性能剖析',
      '错误处理与工程测试',
    ],
    stage: '语言基础',
  },
  {
    id: 'concurrency',
    number: '02',
    title: '并发编程',
    description: '写得出并发，更能说明正确性的边界。',
    topics: [
      '内存模型与 happens-before',
      'Channel 与 sync 原语',
      'Context、取消与泄漏',
      '背压、限流与任务池',
      '竞态检测与并发测试',
    ],
    stage: '语言基础',
  },
  {
    id: 'network',
    number: '03',
    title: '网络与操作系统',
    description: '沿着一个请求，走过协议栈与内核。',
    topics: [
      'TCP、拥塞控制与连接管理',
      'HTTP/1.1、HTTP/2 与 HTTP/3',
      'TLS、DNS 与连接池',
      '进程、线程与虚拟内存',
      'I/O 多路复用与 Go netpoll',
    ],
    stage: '系统原理',
  },
  {
    id: 'postgres',
    number: '04',
    title: 'PostgreSQL 与数据库',
    description: '先理解数据正确性，再讨论如何更快。',
    topics: [
      'MVCC 与事务隔离',
      '索引、执行计划与慢查询',
      '行锁、死锁与并发更新',
      'WAL、复制与故障恢复',
      '连接池与迁移',
      'MySQL 差异与迁移提醒',
    ],
    stage: '系统原理',
  },
  {
    id: 'redis',
    number: '05',
    title: 'Redis 与缓存',
    description: '把命中率之外的过期、一致性和失效想清楚。',
    topics: [
      '数据结构与使用边界',
      '缓存一致性与热点治理',
      '分布式锁与 fencing',
      '持久化、复制与故障转移',
      '内存淘汰与容量规划',
    ],
    stage: '系统原理',
  },
  {
    id: 'distributed',
    number: '06',
    title: '分布式系统',
    description: '当延迟、重试和部分失败成为常态。',
    topics: [
      '一致性、CAP 与共识',
      '幂等、重试与超时预算',
      '消息队列与投递语义',
      '事务、Outbox 与 Saga',
      '服务发现与负载均衡',
    ],
    stage: '系统原理',
  },
  {
    id: 'engineering',
    number: '07',
    title: '工程实践与系统设计',
    description: '让方案从白板走向可以运维的服务。',
    topics: [
      'API 设计、认证与安全',
      '可观测性与 SLO',
      '压测、容量与性能优化',
      '容器、发布与优雅退出',
      '故障排查与系统设计',
    ],
    stage: '工程实践',
  },
  {
    id: 'interview',
    number: '08',
    title: '笔试与面试表达',
    description: '用可验证的推理，组织简洁且有边界的回答。',
    topics: [
      '算法、复杂度与 Go 实现',
      'SQL 与代码阅读题',
      '项目复盘与技术取舍',
      '追问树与模拟面试',
    ],
    stage: '工程实践',
  },
];

export const preface = {
  id: 'preface',
  title: '从「背过」，到真正理解。',
  shortTitle: '从「背过」到真正理解',
  path: '/learn/preface',
  minutes: 20,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'start', title: '一个问题，四层理解', keywords: '学习 原理 边界 取舍 面试' },
    { id: 'principles', title: '我们怎样学习', keywords: '学习 PostgreSQL MySQL 隔离级别' },
    {
      id: 'lock',
      title: '不止一句 SETNX',
      keywords: 'Redis SETNX 分布式锁 Lua token 原子 获取 释放 DELEX',
    },
    {
      id: 'lab',
      title: '让问题真实发生',
      keywords: 'Redis 分布式锁 实验 可视化 动画 续租 fencing JSON',
    },
    {
      id: 'followups',
      title: '沿着追问，走深一步',
      keywords: 'Redis 分布式锁 追问 宕机 复制 故障 库存 Go SQL',
    },
    { id: 'memory', title: '把理解带进面试', keywords: '面试 表达 记忆 60秒' },
    { id: 'sources', title: '依据与更新约定', keywords: '参考 资料 文档 依据 更新 版本' },
  ],
};

export const sources = [
  {
    title: 'Redis · Distributed Locks',
    note: '租约、所有权标识与异步复制失锁的边界',
    url: 'https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/',
  },
  {
    title: 'Redis · SET / SETNX',
    note: 'SET 的 NX / PX 选项；SETNX 自 2.6.12 起已被标记为弃用',
    url: 'https://redis.io/docs/latest/commands/set/',
  },
  {
    title: 'Redis · SETNX',
    note: '旧命令的弃用状态与推荐替代命令',
    url: 'https://redis.io/docs/latest/commands/setnx/',
  },
  {
    title: 'Redis · Scripting with Lua',
    note: '脚本的原子执行与服务端阻塞语义',
    url: 'https://redis.io/docs/latest/develop/programmability/eval-intro/',
  },
  {
    title: 'Redis · DELEX',
    note: 'Redis 8.4 新增的条件删除命令',
    url: 'https://redis.io/docs/latest/commands/delex/',
  },
  {
    title: 'Redis · WAIT',
    note: '等待副本确认并不提供强一致保证',
    url: 'https://redis.io/docs/latest/commands/wait/',
  },
  {
    title: 'PostgreSQL · Transaction Isolation',
    note: 'Read Committed 默认隔离级别与快照语义',
    url: 'https://www.postgresql.org/docs/current/transaction-iso.html',
  },
  {
    title: 'MySQL · InnoDB Transaction Isolation',
    note: 'InnoDB 默认 Repeatable Read，不能照搬 PostgreSQL 结论',
    url: 'https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html',
  },
  {
    title: 'Go · The Go Memory Model',
    note: '后续并发章节的语义基准',
    url: 'https://go.dev/ref/mem',
  },
];
