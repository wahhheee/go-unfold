import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const tcpLesson: LessonDefinition = {
  id: 'network-tcp',
  moduleId: 'network',
  label: '3.2 TCP 字节流与关闭',
  eyebrow: 'NETWORK / TCP',
  title: '发送了两条消息，为什么只读到半条？',
  shortTitle: 'TCP 字节流、定界与连接状态',
  path: '/learn/network-tcp',
  description: [
    '让读取边界任意变化，消息边界仍由协议守住。',
    '把握手、半关闭、TIME_WAIT 与业务完成分开解释。',
  ],
  minutes: 38,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    {
      id: 'stream',
      title: 'TCP 承诺字节，不承诺消息',
      keywords: '粘包 拆包 字节流 TCP UDP Write Read',
    },
    { id: 'lab', title: '把字节切开，再拼回消息', keywords: '实验 长度前缀 定界 半包 EOF' },
    {
      id: 'decoder',
      title: '写一个有上限的解码器',
      keywords: 'ReadFull io.Reader 长度 校验 UnexpectedEOF',
    },
    {
      id: 'lifecycle',
      title: '从握手到半关闭',
      keywords: 'SYN ACK FIN RST TIME_WAIT CLOSE_WAIT 三次握手 四次挥手',
    },
    { id: 'followups', title: '连接完成之外的追问', keywords: '心跳 keepalive 重试 业务确认' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: 'RFC Go Linux 资料' },
  ],
  sources: [
    {
      title: 'RFC 9293 · §2.2、§3.5、§3.6',
      note: '有序字节流、握手、关闭与 TIME-WAIT',
      url: 'https://www.rfc-editor.org/rfc/rfc9293',
    },
    {
      title: 'Go io · Reader / ReadFull',
      note: '短读、同时返回数据和错误、截断语义',
      url: 'https://pkg.go.dev/io#ReadFull',
    },
    {
      title: 'Go net · TCPConn',
      note: 'CloseWrite、Deadline 与网络连接接口',
      url: 'https://pkg.go.dev/net#TCPConn',
    },
    {
      title: 'Linux tcp(7)',
      note: 'Linux TCP 选项与连接行为，不能泛化为所有平台',
      url: 'https://man7.org/linux/man-pages/man7/tcp.7.html',
    },
  ],
  Content: lazy(() => import('../lessons/network-tcp.mdx')),
};
export const tcpQuestions: Question[] = [
  {
    id: 'net-tcp-boundary',
    lessonId: 'network-tcp',
    title: '两次写入不定义两条消息',
    prompt: '对 TCP 连接先写 CAT 再写 OK，接收方一次 Read 可能得到什么？',
    options: [
      '只能得到 CAT',
      '可能得到 C、CAT 或 CATOK 等前缀，需按实际 n 处理',
      '必须得到两个独立数据报',
    ],
    answer: 1,
    explanations: [
      'TCP 不保留应用 Write 的边界。',
      '正确。缓冲长度和可用数据共同影响短读；字节顺序保持，读取边界不固定。',
      '这是把数据报边界套在字节流上。',
    ],
    takeaway: '消息由应用定界，不能靠 Read 的次数定界。',
  },
  {
    id: 'net-tcp-truncated',
    lessonId: 'network-tcp',
    title: '长度头不保证数据齐全',
    prompt: '帧头说后面有 5 字节，ReadFull 只读到 3 字节便遇到 EOF。应该怎样处理？',
    options: [
      '把 3 字节当成完整帧',
      '继续无限等待已经关闭的方向',
      '报告截断，并按协议终止或处理该会话',
    ],
    answer: 2,
    explanations: [
      '长度契约没有满足，交付会破坏协议语义。',
      '已经观察到 EOF 后不能等来剩余字节。',
      '正确。ReadFull 在这种情况下返回 ErrUnexpectedEOF；仍应清理连接。',
    ],
    takeaway: '不足一帧是截断，不是成功的短消息。',
  },
  {
    id: 'net-tcp-half',
    lessonId: 'network-tcp',
    title: '一个方向先结束',
    prompt:
      '客户端成功 CloseWrite 后，服务端读完此前字节并观察到 EOF。服务端还可以向客户端写响应吗？',
    options: ['可以，反向发送尚未因此关闭', '不可以，FIN 等于双向销毁', '只有重新建立连接才行'],
    answer: 0,
    explanations: [
      '正确。TCP 两个方向可分别结束；还要看双方是否随后关闭或发生错误。',
      'FIN 表达该方向没有后续数据，不自动结束另一个方向。',
      '半关闭正是允许一边结束发送、一边继续接收。',
    ],
    takeaway: 'EOF 是接收方向终点，不是整个业务的结论。',
  },
  {
    id: 'net-tcp-state',
    lessonId: 'network-tcp',
    title: '看见 CLOSE_WAIT 后查谁',
    prompt: '服务进程长期积累 CLOSE_WAIT，首先应检查什么？',
    options: [
      '直接减少 TIME_WAIT 时长',
      '本地收到对端 FIN 后，应用是否及时结束并关闭连接',
      '认定所有连接都在等待三次握手',
    ],
    answer: 1,
    explanations: [
      '两种状态不同，修改另一状态的参数无法解释本地未关闭。',
      '正确。还需排除正在合法等待反向工作完成，结合栈、句柄与持续时间判断。',
      'CLOSE_WAIT 已处于关闭阶段，不是建立阶段。',
    ],
    takeaway: '状态告诉你在等谁；先找资源拥有者。',
  },
];
export const tcpFollowups: FollowupItem[] = [
  {
    question: 'Write 返回 nil，能证明对端业务成功吗？',
    label: '确认的层次',
    answer:
      '不能。Write 成功通常只说明字节被本地发送路径接受。TCP ACK 也只确认传输层收到相应字节，不代表服务读取、持久化或完成交易。业务需要独立响应及幂等策略。',
    deeper: '响应丢了就重发同一笔订单？',
    point: '可能导致重复副作用。先明确业务幂等键与结果查询，不要把可靠字节流等同于恰好一次处理。',
  },
  {
    question: '为什么握手通常需要三次？',
    label: '双向确认',
    answer:
      '两端各有一个初始序列号，需要相互告知并确认。SYN、SYN+ACK、ACK 让双方建立本次连接的序列空间，也帮助排除过期请求造成的混淆；不是一句“确认网络通”能概括。',
    deeper: '最后一个 ACK 丢失，客户端必须重新从头连吗？',
    point:
      '不必这样推断。服务端可重传 SYN+ACK，后续合法 ACK 或带数据的确认也参与状态推进；具体行为受重传和超时约束。',
  },
  {
    question: '关闭一定是四个独立报文吗？',
    label: '逻辑与报文',
    answer:
      '不是。双向 FIN 与相应确认是逻辑动作，ACK 可与 FIN 或数据合并，还存在同时关闭、重传与复位。四次挥手是常见教学路径，不是抓包必须匹配的包数。',
    deeper: 'TIME_WAIT 一定在客户端吗？',
    point:
      '看谁执行主动关闭及事件顺序，而不是 HTTP 客户端/服务端的标签；同时关闭可使双方进入 TIME_WAIT。',
  },
  {
    question: '开了 TCP keepalive 就不需要请求超时吗？',
    label: '活性与期限',
    answer:
      '仍需要。keepalive 探测空闲连接的传输活性，参数和时间尺度依平台；它无法保证业务按时完成。应用总预算、读写期限与必要的业务心跳解决不同问题。',
    deeper: 'Nagle 关闭后就没有“粘包”了吗？',
    point: '不会。它改变小包发送策略，不改变 TCP 字节流契约；即使禁用也必须正确解码。',
  },
];
