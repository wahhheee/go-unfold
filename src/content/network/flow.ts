import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const flowLesson: LessonDefinition = {
  id: 'network-flow',
  moduleId: 'network',
  label: '3.3 窗口、重传与拥塞',
  eyebrow: 'NETWORK / FLOW',
  title: '带宽很大，为什么数据还是发不快？',
  shortTitle: '流量控制、拥塞控制与重传',
  path: '/learn/network-flow',
  description: [
    '一边是接收端的余量，一边是网络路径的承受能力。',
    '亲手制造确认缺口，再观察应用读取如何让窗口重新打开。',
  ],
  minutes: 38,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    {
      id: 'windows',
      title: '两种窗口，限制两个不同对象',
      keywords: 'rwnd cwnd 流量控制 拥塞控制 在途',
    },
    { id: 'lab', title: '制造缺口，追踪确认与背压', keywords: '实验 ACK SACK 丢包 重传 零窗口' },
    {
      id: 'congestion',
      title: '拥塞算法不是一条万能曲线',
      keywords: '慢启动 Reno CUBIC RTO RTT 快速重传 ECN',
    },
    {
      id: 'capacity',
      title: '带宽、往返时间与应用进度',
      keywords: 'BDP 吞吐 缓冲 Write ACK Go deadline',
    },
    { id: 'followups', title: '从现象追到限制因素', keywords: '追问 零窗口 重试 缓冲 膨胀' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: 'RFC 核验 版本' },
  ],
  sources: [
    {
      title: 'RFC 9293 · §3.8',
      note: '序列空间、累计确认、接收窗口与零窗口探测',
      url: 'https://www.rfc-editor.org/rfc/rfc9293',
    },
    {
      title: 'RFC 5681 · §2、§3',
      note: '窗口、在途数据与经典拥塞控制基础',
      url: 'https://www.rfc-editor.org/rfc/rfc5681',
    },
    {
      title: 'RFC 6298',
      note: '基于 RTT 估计重传计时器与超时退避',
      url: 'https://www.rfc-editor.org/rfc/rfc6298',
    },
    {
      title: 'RFC 2018',
      note: 'SACK 补充不连续接收范围，不替代累计确认',
      url: 'https://www.rfc-editor.org/rfc/rfc2018',
    },
    {
      title: 'RFC 9438',
      note: 'CUBIC，区别于把所有实现当作 Reno',
      url: 'https://www.rfc-editor.org/rfc/rfc9438',
    },
  ],
  Content: lazy(() => import('../lessons/network-flow.mdx')),
};
export const flowQuestions: Question[] = [
  {
    id: 'net-flow-window',
    lessonId: 'network-flow',
    title: '窗口要先减去在途',
    prompt: '简化为同长度数据段：cwnd=6、rwnd=4、已发未确认=3。没有其他限制时最多再发多少新段？',
    options: ['4 段', '1 段', '6 段'],
    answer: 1,
    explanations: [
      '4 是允许的未确认总量，不是新增额度。',
      '正确。min(6,4)−3=1；恢复期间的真实算法还有额外规则。',
      '拥塞额度不能绕过接收窗口，也不能忽略在途。',
    ],
    takeaway: '允许在途总量与还能新发多少，是两个数。',
  },
  {
    id: 'net-flow-gap',
    lessonId: 'network-flow',
    title: '后到不等于可连续交付',
    prompt:
      '按字节序列区间，0..99 已收到，100..199 丢失，200..299 到达。累计 ACK 的下一期待位置是？',
    options: ['100', '300', '200'],
    answer: 0,
    explanations: [
      '正确。累计确认停在第一个缺口；SACK 可以另行报告后面的区间。',
      '这会错误宣称缺失字节已经连续收到。',
      '200 虽然到达，但前面仍缺 100..199。',
    ],
    takeaway: '累计确认说明连续前缀，SACK 描述额外区间。',
  },
  {
    id: 'net-flow-zero',
    lessonId: 'network-flow',
    title: '接收窗口为零时查哪边',
    prompt: '接收应用长时间不读 socket，接收窗口逐渐降到零。直接增大 cwnd 能解决吗？',
    options: ['能，窗口越大越好', '能，拥塞窗口会覆盖接收窗口', '不能，接收侧仍没有可通告的余量'],
    answer: 2,
    explanations: [
      '两种窗口的限制同时存在。',
      'cwnd 不提供接收端内存，也不会替应用消费。',
      '正确。先定位应用为何不读；探测机制不等于持续发送新数据。',
    ],
    takeaway: '流量控制看接收方，拥塞控制看路径。',
  },
  {
    id: 'net-flow-bdp',
    lessonId: 'network-flow',
    title: '算出量级，不承诺吞吐',
    prompt: '目标吞吐 100 Mbit/s、RTT 40ms，带宽时延积约为多少？忽略协议开销。',
    options: ['500 kB', '4 MB', '100 MB'],
    answer: 0,
    explanations: [
      '正确。100,000,000×0.04÷8=500,000 字节，这是维持管道所需在途量的量级。',
      '4 是 Mbit 的数量，换为字节还需除以 8。',
      '带宽乘以 1 秒仍是比特量；这里往返时间是 0.04 秒。',
    ],
    takeaway: 'BDP 是容量推理工具，不是调大缓冲就会达到的保证。',
  },
];
export const flowFollowups: FollowupItem[] = [
  {
    question: '收到三个重复 ACK，就一定是网络丢包吗？',
    label: '信号与事实',
    answer:
      '重复确认可能由乱序等情况引起。经典快速重传用它作为丢失迹象；现代实现还会结合 SACK、时间信息等。不能从一个计数推出唯一根因。',
    deeper: '为什么不能每次都等 RTO？',
    point:
      '等待完整超时可能浪费很长时间；更早的可靠迹象可帮助恢复。但误判也会造成重复传输，所以检测算法需要权衡。',
  },
  {
    question: 'RTO 就是两倍 RTT 吗？',
    label: '估计与变化',
    answer:
      '不是固定乘法。RFC 6298 使用平滑 RTT 与波动估计计算计时，并规定采样、下限与退避等规则。重传后的样本还涉及歧义；实际系统有实现细节。',
    deeper: '重传超时与请求总超时谁先结束？',
    point: '它们属于不同层。请求预算可能先到期；应用不能依赖 TCP 最终放弃来限制用户等待。',
  },
  {
    question: '接收窗口为零是不是死锁？',
    label: '消费与探测',
    answer:
      '不一定。应用稍后读取可恢复额度，零窗口探测帮助发现更新；但如果应用永久停止消费，传输活着也不能保证业务进展。要结合 goroutine 栈和处理队列判断。',
    deeper: '可以靠更大的缓冲解决慢消费者吗？',
    point: '只会延迟背压并增加积压；持续生产速度超过消费速度时，仍需限流、限并发、丢弃或降级策略。',
  },
  {
    question: '吞吐低就应该开更多连接吗？',
    label: '测量先于调参',
    answer:
      '先区分接收窗口受限、拥塞窗口受限、应用供给不足、CPU 开销与连接获取排队。更多连接可能增加竞争、握手与内存，甚至让尾延迟变差。',
    deeper: '大缓冲为什么可能让延迟变高？',
    point:
      '队列保留更多数据，能吸收突发，也能隐藏持续超载。用队列长度、RTT、重传与应用处理时间验证，不把吞吐改善等同于所有指标改善。',
  },
];
