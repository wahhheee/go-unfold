import { typesQuestions } from './go/types';

export type Question = {
  id: string;
  lessonId: string;
  title: string;
  prompt: string;
  options: string[];
  answer: number;
  explanations: string[];
  takeaway: string;
};

export const questions: Question[] = [
  {
    id: 'atomic-acquire',
    lessonId: 'preface',
    title: '先检查你的直觉',
    prompt: '用 SETNX 拿到锁，再用 EXPIRE 设置过期时间。中间进程崩溃，可能发生什么？',
    options: [
      'Redis 会自动回滚 SETNX',
      '锁可能一直留着，其他请求无法拿到锁',
      'Redis 默认会在 30 秒后删除锁',
    ],
    answer: 1,
    explanations: [
      '两个独立命令没有自动回滚关系。客户端崩溃也不会撤销已经成功的命令。',
      '正确。第二个命令可能根本没有执行，锁就没有过期时间。用一条 SET key token NX PX ttl 原子地设置值与过期时间。',
      '普通键没有默认的 30 秒 TTL。没有明确设置过期时间，就不能依赖它自动消失。',
    ],
    takeaway: '加锁与设置过期时间，必须是一个原子动作。',
  },
  {
    id: 'lease-expiry',
    lessonId: 'preface',
    title: '实验之后，再想一步',
    prompt: 'A 的租约过期，B 获得了新租约。A 恢复运行后，哪种机制能让受保护资源拒绝 A 的过期写入？',
    options: [
      '给锁设置更长的过期时间',
      '解锁时校验随机 token',
      '资源端原子校验单调递增的 fencing token',
    ],
    answer: 2,
    explanations: [
      '更长的 TTL 只能降低某些超时的概率，不能证明进程暂停或网络延迟永远不会超过它。',
      '随机 token 可以避免 A 误删 B 的锁，但不能阻止 A 继续写数据库。解锁安全与写入安全是两回事。',
      '正确。在资源已经接受较新 token 的前提下，资源端会拒绝更旧 token 的写入。比较与写入必须原子完成，token 的生成也必须满足单调性。',
    ],
    takeaway: '所有权 token 防误删；fencing token 由资源端用来拒绝旧持有者。',
  },
  {
    id: 'database-defaults',
    lessonId: 'preface',
    title: '数据库知识，也需要上下文',
    prompt:
      '“默认隔离级别是可重复读，所以一个事务里的两次普通查询总能看到同一快照。”这句话能直接用于 PostgreSQL 吗？',
    options: [
      '能，主流关系数据库的默认值都一样',
      '不能，PostgreSQL 默认是 Read Committed',
      '能，只要查询放进 BEGIN / COMMIT',
    ],
    answer: 1,
    explanations: [
      '数据库产品、存储引擎和配置都会影响结论。PostgreSQL 与 MySQL InnoDB 的默认隔离级别就不同。',
      '正确。PostgreSQL 默认 Read Committed，每条语句取得新快照；事务中两次查询之间的已提交变更可能可见。InnoDB 默认 Repeatable Read，但锁定读等行为也要单独讨论。',
      'BEGIN 只开启事务，并不自动把默认隔离级别升级到 Repeatable Read。',
    ],
    takeaway: '先说数据库与隔离级别，再说快照；不要把产品差异背成通用定律。',
  },
  ...typesQuestions,
];

export function getQuestion(id: string): Question {
  const question = questions.find((item) => item.id === id);
  if (!question) throw new Error(`未注册的题目：${id}`);
  return question;
}
