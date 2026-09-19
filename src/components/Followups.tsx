import { useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, ChevronDown, MessageCircle } from 'lucide-react';

const followups = [
  {
    question: '业务没跑完，锁过期了怎么办？',
    label: '生命周期',
    answer:
      '把锁看成有期限的租约。可以由持有者定期原子校验 token 后续租，并给业务设置超时、传播取消信号。但长暂停或网络分区会让续租失败；取消也是协作式的，不能证明旧请求已经停止。',
    deeper: '如果进程暂停 30 秒，业务和续租一起停了呢？',
    point: '续租提高可用性，不等于无条件的互斥保证。',
  },
  {
    question: 'A 恢复后，把 B 的锁删了怎么办？',
    label: '所有权',
    answer:
      '每次加锁生成独立且足够随机的 token。释放时，在 Redis 服务端原子地比较 token 并删除；客户端先 GET 再 DEL，中间仍可能被其他请求插入。续租也必须校验当前所有权。',
    deeper: '不误删锁了，就能保证 A 不会写坏数据吗？',
    point: '原子校验解决“谁能解锁”，没有解决“谁还能写”。',
  },
  {
    question: '主库宕机，新主库上没有这把锁呢？',
    label: '故障模型',
    answer:
      '异步复制存在尚未复制就故障的窗口。A 在旧主库拿到锁，新主库却可能把同一把锁交给 B。不能把 Sentinel 或主从切换直接当成严格互斥证明；WAIT 也不会把 Redis 变成强一致系统。',
    deeper: '如果业务是扣减余额，这个窗口能接受吗？',
    point: '先定义一致性目标；必要时让数据库约束或事务承载正确性。',
  },
  {
    question: '怎样挡住“过期持有者”的写入？',
    label: '资源边界',
    answer:
      '可使用单调递增的 fencing token，并让受保护资源原子保存已接受的最大 token、拒绝更旧写入。它与随机所有权 token 作用不同。token 生成器必须具备所需一致性，不能默认 Redis 故障切换后的 INCR 仍保序。',
    deeper: '资源不支持 token 校验，或者操作是发邮件呢？',
    point: 'fencing 需要资源配合；外部副作用还要结合幂等键、去重与业务流程设计。',
  },
];

export function Followups() {
  const [open, setOpen] = useState<number | null>(0);
  const [seen, setSeen] = useState<number[]>([0]);
  return (
    <div className="followups">
      <div className="followup-heading">
        <MessageCircle size={17} />
        <span>面试官继续追问</span>
        <span>{seen.length} / 4 已展开</span>
      </div>
      {followups.map((item, index) => (
        <div className={`followup ${open === index ? 'open' : ''}`} key={item.question}>
          <button
            className="followup-trigger"
            aria-expanded={open === index}
            aria-controls={`followup-${index}`}
            onClick={() => {
              setOpen(open === index ? null : index);
              setSeen((current) => [...new Set([...current, index])]);
            }}
          >
            <span className="followup-number">
              {seen.includes(index) ? <Check size={14} /> : `0${index + 1}`}
            </span>
            <span>{item.question}</span>
            <ChevronDown size={17} />
          </button>
          {open === index && (
            <div id={`followup-${index}`} className="followup-body">
              <span className="tag">{item.label}</span>
              <p>{item.answer}</p>
              <div className="memory-line">
                <ArrowUpRight size={17} />
                <strong>{item.point}</strong>
              </div>
              <p className="deeper-question">
                <ArrowDown size={14} />
                {item.deeper}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
