import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const multiplexLesson: LessonDefinition = {
  id: 'network-multiplex',
  moduleId: 'network',
  label: '3.5 HTTP 多路复用',
  eyebrow: 'NETWORK / MULTIPLEXING',
  title: '请求已经分成多条流，为什么仍一起卡住？',
  shortTitle: 'HTTP/2、HTTP/3 与队头阻塞',
  path: '/learn/network-multiplex',
  description: [
    '沿着流、帧和传输字节，辨认阻塞究竟发生在哪一层。',
    '对照相同丢包事件，理解 QUIC 的独立流与共享限制。',
  ],
  minutes: 35,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    {
      id: 'streams',
      title: '先解决 HTTP 响应顺序的限制',
      keywords: 'HTTP1 HTTP2 HTTP3 流 帧 多路复用 HPACK',
    },
    { id: 'lab', title: '让一个包丢失，比较三条流', keywords: '实验 队头阻塞 HOL QUIC QPACK' },
    {
      id: 'quic',
      title: '独立交付不等于完全隔离',
      keywords: '拥塞控制 流量控制 连接迁移 UDP 重传',
    },
    { id: 'go', title: '验证协商结果与并发行为', keywords: 'Go HTTP2 Protocols TLS ALPN httptest' },
    { id: 'followups', title: '从版本比较走向部署判断', keywords: '追问 优先级 流取消 GOAWAY' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: 'RFC 资料 版本' },
  ],
  sources: [
    {
      title: 'RFC 9113 · §3—§5',
      note: 'HTTP/2 建立、帧、流与流量控制',
      url: 'https://www.rfc-editor.org/rfc/rfc9113',
    },
    {
      title: 'RFC 9114 · §2—§4',
      note: 'HTTP/3 对 HTTP 语义的映射与连接发现',
      url: 'https://www.rfc-editor.org/rfc/rfc9114',
    },
    {
      title: 'RFC 9000 · §2、§4、§9',
      note: 'QUIC 独立流、流量控制与连接迁移',
      url: 'https://www.rfc-editor.org/rfc/rfc9000',
    },
    {
      title: 'RFC 9204 · §2.1、§2.2',
      note: 'QPACK 动态条目依赖与阻塞流限制',
      url: 'https://httpwg.org/specs/rfc9204.html',
    },
    {
      title: 'Go http.Protocols',
      note: '显式配置协议集合，实际版本由响应确认',
      url: 'https://pkg.go.dev/net/http#Protocols',
    },
    {
      title: 'Go httptest.Server',
      note: '本地 TLS / HTTP2 集成测试',
      url: 'https://pkg.go.dev/net/http/httptest#Server',
    },
  ],
  Content: lazy(() => import('../lessons/network-multiplex.mdx')),
};
export const multiplexQuestions: Question[] = [
  {
    id: 'net-mux-h1',
    lessonId: 'network-multiplex',
    title: '流水线仍有响应顺序',
    prompt:
      'HTTP/1.1 同一连接采用请求流水线，先请求 A 再请求 B。B 先处理完，可以把 B 的完整响应放在 A 前面吗？',
    options: [
      '可以，只要 B 很小',
      '不能，响应仍须按请求顺序对应',
      '可以，HTTP/1.1 有每帧 stream ID',
    ],
    answer: 1,
    explanations: [
      '处理可以并行，线上的响应顺序仍受约束。',
      '正确。这个顺序约束造成应用层队头阻塞；多条连接只能另作分担。',
      'stream ID 多路复用不是 HTTP/1.1 消息格式。',
    ],
    takeaway: '流水线不等于独立流。',
  },
  {
    id: 'net-mux-h2',
    lessonId: 'network-multiplex',
    title: '流独立，底层字节仍有序',
    prompt:
      '同一 TCP 连接承载 A、B 两条 HTTP/2 流。较早 TCP 字节丢失，包含 B 数据的后续字节已到达，为什么 B 仍可能等待？',
    options: [
      'TCP 不能越过缺口向上交付后续字节',
      'HTTP/2 禁止同时处理两个请求',
      'B 必须与 A 使用同一个 URL',
    ],
    answer: 0,
    explanations: [
      '正确。传输层的有序字节流限制仍存在，HTTP/2 帧还没被完整交给解析器。',
      'HTTP/2 支持多流，等待不等于没有多路复用。',
      '是否同一 URL 不是这个字节缺口的原因。',
    ],
    takeaway: 'HTTP/2 解决响应排列，不消除 TCP 交付缺口。',
  },
  {
    id: 'net-mux-h3',
    lessonId: 'network-multiplex',
    title: 'HTTP/3 也会等待',
    prompt: 'QUIC 流 B 的数据已完整到达，HTTP/3 应用仍可能因什么等待？',
    options: [
      'HTTP/3 必须按所有流统一字节序交付',
      '不会等待，UDP 从不阻塞',
      '响应头引用了尚未到达的 QPACK 动态条目',
    ],
    answer: 2,
    explanations: [
      'QUIC 是每流有序，不存在 TCP 式全连接字节序约束。',
      'UDP 不提供这样的应用层保证，QUIC 也有可靠性与资源控制。',
      '正确。移除传输层跨流阻塞，不移除压缩或业务依赖。',
    ],
    takeaway: '独立传输与独立应用处理不是同一保证。',
  },
  {
    id: 'net-mux-limit',
    lessonId: 'network-multiplex',
    title: '一条连接不等于无限并发',
    prompt: '服务已使用 HTTP/2，是否可以取消应用并发额度？',
    options: [
      '可以，只有一个 socket 所以资源固定',
      '不可以，流、请求处理、内存和下游仍有上限',
      '可以，只要启用头压缩',
    ],
    answer: 1,
    explanations: [
      '每条流与业务处理都消耗额外资源。',
      '正确。协议流限额和业务准入共同决定安全并发，连接数不是全部成本。',
      '头压缩不减少数据库和应用执行的所有成本。',
    ],
    takeaway: '多路复用改变共享方式，不消除容量约束。',
  },
];
export const multiplexFollowups: FollowupItem[] = [
  {
    question: 'HTTP/3 走 UDP，是不是丢了就算了？',
    label: '承载与可靠性',
    answer:
      '不是。HTTP/3 使用 QUIC 的可靠流，QUIC 在 UDP 之上实现确认、丢失检测、恢复与拥塞控制。UDP 提供数据报承载，不能据此把 HTTP 响应当成不可靠投递。',
    deeper: '丢失的 QUIC 包会原样重发吗？',
    point:
      '需要的信息可在新包中重新发送，包号不会照搬为重传包号；流偏移标识数据位置。不要把包号与 TCP 字节序列号混为一谈。',
  },
  {
    question: '一条流暂停读取，会不会拖累别的流？',
    label: '共享限制',
    answer:
      '可能。独立流有各自额度，但连接级流量额度、拥塞控制、调度和内存仍共享。实现如果未及时管理连接额度，或者应用有共同依赖，其他流仍可能受影响。',
    deeper: '实验中 B 正常交付就能证明线上不受影响吗？',
    point: '不能。实验刻意省略共享拥塞和窗口，只说明不存在必须等待 A 缺失字节的那条传输依赖。',
  },
  {
    question: 'HTTP/3 连接迁移等于随时无缝换网络吗？',
    label: '路径验证',
    answer:
      'QUIC 使用连接 ID 帮助连接不完全绑定四元组，并提供路径验证与迁移机制。是否允许主动迁移、路径可达性、中间设备及实现策略仍会影响结果，不能承诺零中断。',
    deeper: '连接 ID 就是用户身份吗？',
    point: '不是。它用于连接路由与关联，不代替 TLS 的对端认证或应用权限。',
  },
  {
    question: '看到 https 就知道是 HTTP/2 吗？',
    label: '协商与观测',
    answer:
      '不知道。https 表达安全方案，实际应用协议需要协商和支持。HTTP/2 通常通过 TLS ALPN 选 h2；HTTP/3 有不同承载与发现过程。应看响应协议与连接事件。',
    deeper: 'GOAWAY 后所有请求都能直接重试吗？',
    point:
      '要根据协议标记、请求是否可能已处理、请求体能否重放和业务幂等判断。连接排空不等于撤销已发生的副作用。',
  },
];
