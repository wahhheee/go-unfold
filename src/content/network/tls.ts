import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const tlsLesson: LessonDefinition = {
  id: 'network-tls',
  moduleId: 'network',
  label: '3.6 TLS 与服务身份',
  eyebrow: 'NETWORK / TLS',
  title: '连接已经加密，为什么还要验证证书？',
  shortTitle: 'TLS 1.3、身份校验与会话恢复',
  path: '/learn/network-tls',
  description: [
    '加密保护传输，身份验证确认正在与谁通信。',
    '逐步推进握手，区分名字、信任链、应用协议与业务权限。',
  ],
  minutes: 36,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    { id: 'identity', title: '加密通道的另一端是谁', keywords: 'TLS 证书 SAN 信任链 身份 中间人' },
    { id: 'lab', title: '逐项打破握手前提', keywords: '实验 ALPN SNI ServerName 证书有效期' },
    {
      id: 'handshake',
      title: '握手、恢复与早期数据',
      keywords: 'TLS1.3 密钥协商 CertificateVerify Finished PSK 0-RTT 重放',
    },
    {
      id: 'go',
      title: '在 Go 中保留验证与时间边界',
      keywords: 'crypto/tls InsecureSkipVerify RootCAs HandshakeContext',
    },
    { id: 'followups', title: '从信任走向权限与部署', keywords: '追问 mTLS 代理 ECH 证书更新' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: 'RFC9846 RFC8446 版本 核验' },
  ],
  sources: [
    {
      title: 'RFC 9846 · TLS 1.3',
      note: '2026 年 7 月取代 RFC 8446；握手、恢复与重放边界',
      url: 'https://www.rfc-editor.org/info/rfc9846/',
    },
    {
      title: 'RFC 9525 · Service Identity in TLS',
      note: '期望服务身份与证书标识匹配',
      url: 'https://www.rfc-editor.org/rfc/rfc9525',
    },
    {
      title: 'RFC 7301 · ALPN',
      note: '在握手中协商应用层协议',
      url: 'https://www.rfc-editor.org/rfc/rfc7301',
    },
    {
      title: 'Go crypto/tls · Config',
      note: 'RootCAs、ServerName、NextProtos 与验证开关',
      url: 'https://pkg.go.dev/crypto/tls#Config',
    },
    {
      title: 'Go crypto/tls · HandshakeContext',
      note: '握手取消范围及完成后的 Context 边界',
      url: 'https://pkg.go.dev/crypto/tls#Conn.HandshakeContext',
    },
    {
      title: 'Go crypto/x509 · Verify',
      note: '信任链、名字、时间及 Go 校验的功能边界',
      url: 'https://pkg.go.dev/crypto/x509#Certificate.Verify',
    },
  ],
  Content: lazy(() => import('../lessons/network-tls.mdx')),
};
export const tlsQuestions: Question[] = [
  {
    id: 'net-tls-identity',
    lessonId: 'network-tls',
    title: '能加密不代表是目标服务',
    prompt: '客户端不做任何自定义验证，并设置 InsecureSkipVerify=true。最重要的变化是什么？',
    options: [
      '只是忽略过期时间，其他验证保留',
      '跳过默认链与主机名校验，可能与错误对端建立加密通道',
      '启用了更强的 TLS 加密',
    ],
    answer: 1,
    explanations: [
      '该开关影响默认的证书链和主机名验证，不仅是日期。',
      '正确。机密性不能替代对端身份；修复根因而不是盲目关闭验证。',
      '这不是加强密码算法的设置。',
    ],
    takeaway: '通道加密与对端可信要分别成立。',
  },
  {
    id: 'net-tls-alpn',
    lessonId: 'network-tls',
    title: 'SNI 与 ALPN 分工不同',
    prompt: '同一 IP 承载多个域名，且支持 HTTP/1.1 与 HTTP/2。SNI 与 ALPN 分别帮助解决什么？',
    options: [
      'SNI 选择虚拟服务，ALPN 选择应用协议',
      'SNI 校验用户权限，ALPN 解析 DNS',
      '二者都是加密载荷的算法名',
    ],
    answer: 0,
    explanations: [
      '正确。SNI 提供名字选择线索，本身不代替证书验证。',
      '权限和 DNS 分别属于其他机制。',
      '它们都是握手扩展的用途，不是载荷加密算法。',
    ],
    takeaway: '找哪家服务与说哪种协议是两次选择。',
  },
  {
    id: 'net-tls-early',
    lessonId: 'network-tls',
    title: '恢复会话不自动允许扣款早发',
    prompt: 'TLS 1.3 恢复时允许 0-RTT，就能把扣款请求直接作为早期数据发送吗？',
    options: [
      '能，TLS 保证每条请求只执行一次',
      '能，只要证书没过期',
      '不能仅凭 TLS；必须评估重放与业务去重、拒绝处理',
    ],
    answer: 2,
    explanations: [
      'TLS 不提供业务恰好一次处理，早期数据还有额外重放风险。',
      '证书时间有效与副作用防重不是一个问题。',
      '正确。只发送应用确认可安全重放的早期数据，并遵守具体协议约定。',
    ],
    takeaway: '0-RTT 节省等待，不能省掉重放设计。',
  },
  {
    id: 'net-tls-context',
    lessonId: 'network-tls',
    title: '握手 Context 的作用到哪里',
    prompt:
      'tls.Conn.HandshakeContext(ctx) 已成功返回，随后 ctx 被取消。能据此保证之后所有 Read 立刻结束吗？',
    options: [
      '不能，完成后的连接 I/O 要有自己的期限与生命周期',
      '能，Context 永久绑定所有方法',
      '能，它会自动调用 CloseWrite',
    ],
    answer: 0,
    explanations: [
      '正确。握手完成后该 Context 不再控制连接；HTTP 请求 Context 则由更高层管理相应生命周期。',
      'HandshakeContext 的契约不承诺永久绑定。',
      '取消不是隐式半关闭操作。',
    ],
    takeaway: '每个取消接口都有明确作用范围。',
  },
];
export const tlsFollowups: FollowupItem[] = [
  {
    question: '证书是公开的，复制一份就能冒充吗？',
    label: '持有证明',
    answer:
      '只复制证书不够。完整证书认证握手中，对端还要证明持有相应私钥，并把证明绑定到本次握手。客户端同时检查链、期望名字和时间等条件。',
    deeper: '那把私钥放进前端方便握手行吗？',
    point:
      '不行。服务端私钥必须由受控服务持有；客户端只需验证公开证书与握手证明，不需要服务端私钥。',
  },
  {
    question: '用了 mTLS 就不需要鉴权了吗？',
    label: '身份与权限',
    answer:
      '仍需要。双向 TLS 可以让双方按证书策略认证，但某个已认证工作负载是否可读某租户数据，仍是应用授权问题。身份映射、吊销和轮换也需要具体策略。',
    deeper: 'CA 签过就可以任意访问吗？',
    point: '不能。信任域通常大于权限域，必须把身份约束与具体资源、动作结合。',
  },
  {
    question: '证书更新后，旧连接会立即重验吗？',
    label: '连接生命周期',
    answer:
      '已建立的会话不会仅因为磁盘证书变化就自动重走完整握手。新连接、会话恢复、票据与验证回调各有行为；摘除旧身份需要明确的连接和票据管理策略。',
    deeper: 'Go Verify 会自动在线查询所有吊销信息吗？',
    point:
      '不能这样假设。标准库 x509.Verify 的文档明确不执行吊销检查；部署若需要，必须设计额外机制。',
  },
  {
    question: 'TLS 终止在代理上，是否端到端都加密？',
    label: '信任边界',
    answer:
      '客户端到代理的 TLS 在代理处结束。代理到后端是否加密、是否认证，是另一条连接的配置。还要考虑代理看到明文后的日志、转发头与权限边界。',
    deeper: 'HTTPS 会隐藏目标 IP 与全部元数据吗？',
    point:
      '不会。网络仍需路由信息，长度和时序等也可能可见；名字隐私还受 DNS、ClientHello 与 ECH 配置影响，不能只凭 HTTPS 推断。',
  },
];
