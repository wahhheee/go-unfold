import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const channelsLesson: LessonDefinition = {
  id: 'concurrency-channels',
  moduleId: 'concurrency',
  label: '2.2 Channel 与关闭',
  eyebrow: 'CONCURRENCY / CHANNEL',
  title: '数据传过去了，责任也传过去了吗？',
  shortTitle: 'Channel、缓冲与关闭协议',
  path: '/learn/concurrency-channels',
  description: [
    '把 channel 看成通信协议的一部分，明确等待、完成与关闭的含义。',
    '缓冲区承接突发，所有权和退出路径仍需要你设计。',
  ],
  minutes: 38,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'states',
      title: '六种操作结果先分清',
      keywords: 'channel nil closed 阻塞 panic ok 零值',
    },
    { id: 'lab', title: '缓冲与交接亲手推进', keywords: '实验 容量 send receive close' },
    {
      id: 'order',
      title: '同步保证与处理完成不同',
      keywords: 'happens-before 无缓冲 容量 k+C ack',
    },
    { id: 'ownership', title: '谁还能修改这份数据', keywords: '指针 切片 别名 所有权 clone' },
    { id: 'closing', title: '多生产者的关闭责任', keywords: 'WaitGroup fan-in close Once 泄漏' },
    { id: 'followups', title: '从通信到工程协议', keywords: '追问 缓冲 扇入 扇出 广播' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '规范 版本' },
  ],
  sources: [
    {
      title: 'Go 规范 · Channel 类型',
      note: '方向、容量、nil 与 FIFO',
      url: 'https://go.dev/ref/spec#Channel_types',
    },
    {
      title: 'Go 规范 · 接收',
      note: '关闭后的排空与 ok 语义',
      url: 'https://go.dev/ref/spec#Receive_operator',
    },
    {
      title: 'Go 规范 · close',
      note: '关闭、重复关闭与发送失败',
      url: 'https://go.dev/ref/spec#Close',
    },
    {
      title: 'Go 内存模型 · Channel',
      note: '发送、接收、关闭与缓冲同步边',
      url: 'https://go.dev/ref/mem#chan',
    },
    {
      title: 'Go 官方博客 · Pipelines and cancellation',
      note: '关闭责任、下游提前退出和取消',
      url: 'https://go.dev/blog/pipelines',
    },
  ],
  Content: lazy(() => import('../lessons/concurrency-channels.mdx')),
};
export const channelsQuestions: Question[] = [
  {
    id: 'con-channel-zero',
    lessonId: 'concurrency-channels',
    title: '零值不代表已经关闭',
    prompt: '容量 1 的 chan int 先发送 0，再 close。连续两次 v, ok := <-ch 得到什么？',
    options: ['两次都是 0, false', '先 0, true，再 0, false', '第一次接收 panic'],
    answer: 1,
    explanations: [
      '第一次是发送方确实发送的元素，不是关闭生成的零值。',
      '正确。close 不丢弃缓冲内容，只有关闭且读空才返回 ok=false。',
      '关闭后的接收可继续，发送或重复关闭才会 panic。',
    ],
    takeaway: '用 ok 分辨结束，不用零值猜。',
  },
  {
    id: 'con-channel-ack',
    lessonId: 'concurrency-channels',
    title: '发送返回时，对方业务做完了吗',
    prompt: '无缓冲 channel 的发送已经返回，能证明接收方在接收之后进行的数据库写入完成吗？',
    options: [
      '能，无缓冲就是同步执行全部业务',
      '不能，只完成了交接；业务完成需要另一个确认协议',
      '把容量改成 1 就可以',
    ],
    answer: 1,
    explanations: [
      '交接的同步边不覆盖接收之后尚未执行的工作。',
      '正确。用结果通道、完成通知或等待机制表达你实际需要的完成条件。',
      '缓冲允许更早返回，更不能表示下游处理完成。',
    ],
    takeaway: '交接完成，不是业务完成。',
  },
  {
    id: 'con-channel-owner',
    lessonId: 'concurrency-channels',
    title: '传切片会自动复制底层数组吗',
    prompt:
      '发送 []byte 给后台任务后，发送方马上复用底层数组读取下个请求。仅靠 channel 足够安全吗？',
    options: [
      '足够，channel 会深复制所有数据',
      '不够，可能共享底层数组；需要转移使用责任或复制',
      '足够，只要缓冲区容量为 0',
    ],
    answer: 1,
    explanations: [
      '发送复制切片值，不会深复制它引用的所有元素。',
      '正确。发布之前的写入可有序，发布之后继续改共享对象仍需协议。',
      '无缓冲交接也不代表接收方之后已经用完数据。',
    ],
    takeaway: '传值不等于深复制，交接要约定所有权。',
  },
  {
    id: 'con-channel-close',
    lessonId: 'concurrency-channels',
    title: '多生产者谁负责最后关闭',
    prompt: '多个任务向同一个结果 channel 发送，最合理的关闭方式是？',
    options: [
      '每个任务退出时 defer close(out)',
      '由协调者确认所有发送方结束后关闭 out',
      '接收方超时就直接 close(out)',
    ],
    answer: 1,
    explanations: [
      '多个任务可能重复关闭，也可能关闭时其他任务还在发送。',
      '正确。确认所有发送已结束，再由明确的单个责任方关闭。',
      '这可能让仍在发送的任务 panic；取消应使用独立协议并等待退出。',
    ],
    takeaway: '关闭是“不会再发送”的承诺。',
  },
];
export const channelsFollowups: FollowupItem[] = [
  {
    question: '缓冲区设得足够大，是不是就不会泄漏？',
    label: '背压',
    answer:
      '缓冲只能容纳有限积压。当生产长期快于消费，缓冲终究会满；下游提前退出时，上游仍可能永久阻塞。容量还会延长对象保留和排队时间。需要有界并发、拒绝或背压、取消与等待退出，而不是任意放大数字。',
    deeper: 'len(ch) 小于 cap(ch) 后发送就一定不阻塞？',
    point:
      '不是。len 是瞬时观察，其他发送方可能抢先填满。需要使用 select 的通信操作来实现非阻塞尝试。',
  },
  {
    question: 'sync.Once 包住 close，就安全了吗？',
    label: '关闭协议',
    answer:
      'Once 只限制关闭动作执行一次，不能证明其他 goroutine 已经停止发送。与关闭并发的发送仍然是有问题的协议，可能 panic，也可能被竞态检测报告。正确性需要关闭方知道所有发送者已结束。',
    deeper: 'recover 捕获 send on closed channel，可以当正常取消吗？',
    point: '不要用它替代退出协议。它掩盖责任错误，也不能替你回滚或确认哪些任务完成。',
  },
  {
    question: '多个接收者会各自拿到同一条消息吗？',
    label: '投递语义',
    answer:
      '普通发送与一次接收配对。多个消费者通常竞争不同元素，这是分工，不是广播。关闭通知可以让多个观察者看到结束；若要广播每条业务消息，需要为订阅者分别投递，并设计慢订阅者与退出策略。',
    deeper: 'channel 的 FIFO 能保证多个任务的完成顺序吗？',
    point:
      '不能。单生产者的发送序列可以按接收顺序交接，但并发处理完成时间仍不同；多个生产者之间也没有按启动时间排序的承诺。',
  },
  {
    question: '所有 channel 都必须 close 才能被 GC 回收吗？',
    label: '生命周期',
    answer:
      '不需要。close 是通信协议，不是释放内存的通用析构函数。没有可达引用后 channel 可以被回收；真正要警惕的是仍阻塞的 goroutine 及其保留数据。读端采用 range 等待结束时，协议才需要提供关闭或另一种终止方式。',
    deeper: '把 channel 变量设成 nil，会取消已阻塞的发送吗？',
    point:
      '不会。已开始的操作已取得原 channel；修改变量本身还可能引入竞态。nil 常用于当前 goroutine 的 select 禁用分支，不是跨 goroutine 取消开关。',
  },
];
