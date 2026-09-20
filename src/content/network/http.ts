import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const httpLesson: LessonDefinition = {
  id: 'network-http',
  moduleId: 'network',
  label: '3.4 HTTP 与连接池',
  eyebrow: 'NETWORK / HTTP',
  title: '拿到 200，为什么连接池仍然堵住了？',
  shortTitle: 'HTTP 语义、消息边界与连接池',
  path: '/learn/network-http',
  description: [
    '响应头、响应体和业务结果，分别在什么时候完成？',
    '从一个未关闭的 Body，追到整个服务的连接获取队列。',
  ],
  minutes: 40,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    {
      id: 'semantics',
      title: '状态码不等于调用错误',
      keywords: 'HTTP GET POST PUT DELETE 安全 幂等 状态码',
    },
    {
      id: 'framing',
      title: 'HTTP/1.1 怎样找到响应终点',
      keywords: 'Content-Length chunked HEAD 204 304 EOF 请求走私',
    },
    { id: 'lab', title: '占住一条连接，看后续请求排队', keywords: '实验 Body EOF 连接池 复用' },
    {
      id: 'client',
      title: 'Go 客户端与资源归属',
      keywords: 'Transport Client MaxConnsPerHost MaxIdleConnsPerHost Close 排空 Go1.27',
    },
    { id: 'followups', title: '从复用走向业务语义', keywords: '追问 超时 重试 重定向 keepalive' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '版本 RFC Go 源码' },
  ],
  sources: [
    {
      title: 'RFC 9110 · §9、§15',
      note: '方法的安全与幂等语义、响应状态',
      url: 'https://httpwg.org/specs/rfc9110.html',
    },
    {
      title: 'RFC 9112 · §6、§9、§11',
      note: 'HTTP/1.1 消息长度、持久连接与解析分歧',
      url: 'https://www.rfc-editor.org/rfc/rfc9112',
    },
    {
      title: 'Go http.Client',
      note: '非 2xx 不等于 Do 的错误，调用方关闭 Body',
      url: 'https://pkg.go.dev/net/http#Client',
    },
    {
      title: 'Go http.Transport',
      note: '复用、空闲额度、总连接上限与分段超时',
      url: 'https://pkg.go.dev/net/http#Transport',
    },
    {
      title: 'Go 1.27.1 · transport.go',
      note: 'maybeDrainBody：有限后台排空属于当前实现',
      url: 'https://github.com/golang/go/blob/go1.27.1/src/net/http/transport.go',
    },
    {
      title: 'RFC 9931',
      note: 'HTTP/1.1 乐观协议切换的新增安全约束',
      url: 'https://www.rfc-editor.org/info/rfc9931/',
    },
  ],
  Content: lazy(() => import('../lessons/network-http.mdx')),
};
export const httpQuestions: Question[] = [
  {
    id: 'net-http-status',
    lessonId: 'network-http',
    title: 'HTTP 500 也可能没有 Go error',
    prompt: 'client.Do 返回 err=nil、StatusCode=500。最准确的处理是？',
    options: [
      '请求已经业务成功',
      '继续检查状态与受限响应体，并负责关闭 Body',
      '不需要关闭，因为状态不是 200',
    ],
    answer: 1,
    explanations: [
      'err=nil 表示这次协议调用拿到了响应，不承诺业务成功。',
      '正确。状态、内容与资源清理各有责任。',
      '错误响应同样可能携带响应体并占用连接。',
    ],
    takeaway: '传输错误、HTTP 状态与业务结果分层判断。',
  },
  {
    id: 'net-http-end',
    lessonId: 'network-http',
    title: '持久连接不靠断开表示每次完成',
    prompt: '普通 HTTP/1.1 响应 Content-Length: 5，收到五个载荷字节后，必须再等 TCP EOF 吗？',
    options: [
      '必须，否则不能知道体结束',
      '必须，因为所有响应都由断开定界',
      '不必，消息长度已定义终点，连接可继续承载请求',
    ],
    answer: 2,
    explanations: [
      '混淆了 HTTP 消息边界与 TCP 连接边界。',
      '存在长度头、chunked 和无体响应等规则。',
      '正确。实际还要遵守消息语义、错误处理和连接是否允许复用。',
    ],
    takeaway: '消息结束和连接结束不是同一个事件。',
  },
  {
    id: 'net-http-idle',
    lessonId: 'network-http',
    title: '空闲额度不限制全部连接',
    prompt: '将 MaxIdleConnsPerHost 设为 2，是否意味着最多只能有两个并发 HTTP/1.1 请求？',
    options: [
      '不是，它限制保留的空闲连接，活跃总量需另外控制',
      '是，所有请求只能排在这两条连接后',
      '是，而且 HTTP/2 也最多两条流',
    ],
    answer: 0,
    explanations: [
      '正确。MaxConnsPerHost 控制总连接数；业务并发还需考虑协议和上游容量。',
      '把空闲保留上限当成总量上限了。',
      'HTTP/2 一条连接可承载多流，连接数也不是流数。',
    ],
    takeaway: '空闲连接、总连接和并发请求是三种额度。',
  },
  {
    id: 'net-http-close',
    lessonId: 'network-http',
    title: '提前关闭的版本边界',
    prompt: '在本章 Go 1.27.1 基线中，提前 Close 一个未读完的 HTTP/1.1 响应体，哪种说法准确？',
    options: [
      '一定立即复用，不看剩余长度',
      '实现会尝试有限后台排空，但不能保证复用',
      '一定永远不能复用',
    ],
    answer: 1,
    explanations: [
      '排空受大小、时间、网络与其他连接状态影响。',
      '正确。Close 仍是调用方义务，是否复用不能靠一条绝对规则判断。',
      '当前版本的有限排空使这句话不成立；实验明确省略了这项实现优化。',
    ],
    takeaway: '资源必须关闭，复用取决于完整边界与实现条件。',
  },
];
export const httpFollowups: FollowupItem[] = [
  {
    question: '幂等是不是每次返回同一个状态码？',
    label: '请求语义',
    answer:
      '不是。幂等关心多次相同请求的预期服务端效果与一次相同，例如重复删除可以先成功后返回不存在。日志等附带效果也不要求完全相同；错误实现不会因为用了 PUT 就自动幂等。',
    deeper: 'POST 能不能重试？',
    point:
      '方法本身不承诺幂等，但业务可通过幂等键、去重记录和明确的重放契约支持安全重试。不能仅凭连接断了就判断没有执行。',
  },
  {
    question: '每次 new http.Client 都会建一个新连接池吗？',
    label: '实际资源拥有者',
    answer:
      '不一定。连接池在 Transport 中；多个未指定 Transport 的 Client 可共用 DefaultTransport。真正该复用和管理的是配置好的 Client/Transport 及其生命周期，频繁新建 Transport 才会分裂连接池。',
    deeper: '可以请求过程中修改 Transport 参数吗？',
    point: '应在并发使用前配置完成。并发调用是支持的，随意修改共享配置字段不是同一个契约。',
  },
  {
    question: '为了复用，应该无条件读光任何响应体吗？',
    label: '有界清理',
    answer:
      '不应该。未知大小或永不结束的响应会耗尽时间与内存。按业务设置大小上限与总预算；决定放弃时关闭 Body，接受可能失去复用。Go 当前有限排空不替代业务限制。',
    deeper: 'ReadAll 加 LimitReader 就自动报超大吗？',
    point:
      '不会。通常读上限加一字节，再检查长度；否则达到限制的结果可能被误认为完整内容。解压后的大小也要控制。',
  },
  {
    question: 'HTTP keep-alive 和 TCP keepalive 一样吗？',
    label: '同名不同层',
    answer:
      '不一样。HTTP 持久连接允许多个交换复用传输；TCP keepalive 探测空闲传输连接。前者不提供业务心跳，后者不决定 HTTP 消息的结束位置。',
    deeper: 'CloseIdleConnections 会取消正在下载的请求吗？',
    point:
      '它针对空闲连接，不中断活跃交换。取消在途请求要使用对应 Context 或明确的连接生命周期策略。',
  },
];
