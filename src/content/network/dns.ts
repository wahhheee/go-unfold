import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const dnsLesson: LessonDefinition = {
  id: 'network-dns',
  moduleId: 'network',
  label: '3.1 请求找路与 DNS',
  eyebrow: 'NETWORK / DNS',
  title: '改了 DNS，流量为什么还在去旧机器？',
  shortTitle: '请求分层、DNS 与缓存',
  path: '/learn/network-dns',
  description: [
    '从一次请求出发，把名字、地址、连接和应用响应拆开。',
    '亲手切换地址，看看缓存与长连接怎样决定流量去向。',
  ],
  minutes: 32,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    {
      id: 'layers',
      title: '一个请求，几种不同的地址',
      keywords: 'URL HTTP DNS IP 端口 分层 路由 以太网',
    },
    {
      id: 'resolution',
      title: '解析器怎样找到答案',
      keywords: '递归 迭代 权威 A AAAA CNAME NXDOMAIN TTL',
    },
    { id: 'lab', title: '切换记录，追踪请求去向', keywords: '实验 缓存 TTL 长连接 故障切换' },
    {
      id: 'go',
      title: '把解析接回 Go 调用链',
      keywords: 'Resolver LookupNetIP httptrace DialContext Context',
    },
    { id: 'followups', title: '继续追问地址与故障', keywords: '双栈 UDP TCP 负缓存 服务发现' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: 'RFC Go 版本 资料' },
  ],
  sources: [
    {
      title: 'RFC 1034 · §3、§4、§5',
      note: 'DNS 层级、权威、递归与迭代解析、缓存',
      url: 'https://www.rfc-editor.org/rfc/rfc1034',
    },
    {
      title: 'RFC 2308 · §3、§5',
      note: '否定响应的 SOA 与负缓存有效期',
      url: 'https://www.rfc-editor.org/rfc/rfc2308',
    },
    {
      title: 'Go net · Name Resolution / Resolver',
      note: '系统与纯 Go 解析路径，LookupNetIP 与 Context',
      url: 'https://pkg.go.dev/net#Resolver',
    },
    {
      title: 'Go httptrace · ClientTrace',
      note: 'DNS、连接获取、复用与首字节事件',
      url: 'https://pkg.go.dev/net/http/httptrace#ClientTrace',
    },
  ],
  Content: lazy(() => import('../lessons/network-dns.mdx')),
};
export const dnsQuestions: Question[] = [
  {
    id: 'net-dns-layer',
    lessonId: 'network-dns',
    title: '名字和连接各管一层',
    prompt: 'api.example.test 的 A 记录已经解析成功，能据此认定订单接口正常吗？',
    options: [
      '能，DNS 成功就是 HTTP 成功',
      '不能，还要连接、协议交互和业务处理',
      '能，只要 TTL 大于零',
    ],
    answer: 1,
    explanations: [
      'DNS 回答地址记录，不执行订单接口。',
      '正确。地址可获得，不代表端口可达、TLS 可信或业务正确。',
      'TTL 限定缓存使用时间，不是服务健康证明。',
    ],
    takeaway: '解析成功只完成找地址这一步。',
  },
  {
    id: 'net-dns-recursion',
    lessonId: 'network-dns',
    title: '谁在替你继续查',
    prompt: '应用向递归解析器询问 A 记录，而解析器缓存未命中。最准确的理解是？',
    options: [
      '应用必须亲自询问每一级服务器',
      '根服务器保存所有域名的最终 IP',
      '递归解析器可沿委派寻找答案，权威服务器负责相应区域',
    ],
    answer: 2,
    explanations: [
      '应用通常把继续查找的工作交给递归解析器；具体解析链还可包含转发器。',
      '根主要提供顶级域的委派信息，不保存所有最终地址。',
      '正确。缓存也可能让解析器从中间层继续，不必每次从根开始。',
    ],
    takeaway: '递归是代查责任，权威是答案归属。',
  },
  {
    id: 'net-dns-ttl',
    lessonId: 'network-dns',
    title: '过期不等于换连接',
    prompt: '缓存 TTL 已到期，但下一次请求复用了已有 TCP 连接。本节模型中请求去哪里？',
    options: ['仍去该连接的原目的地址', '立即改去最新 A 记录', '必须关闭全部活跃连接'],
    answer: 0,
    explanations: [
      '正确。已有连接不因 DNS 缓存到期自动迁移。',
      '只有需要地址解析时，DNS 才参与新的目的地址选择。',
      'DNS 不负责关闭应用的连接；切流需要单独管理。',
    ],
    takeaway: 'TTL 管缓存，连接有自己的生命周期。',
  },
  {
    id: 'net-dns-negative',
    lessonId: 'network-dns',
    title: '刚创建的名字仍然不存在',
    prompt: '域名查询之前返回 NXDOMAIN，随后你创建了记录。为什么部分客户端仍暂时报不存在？',
    options: [
      'DNS 永远不能新增域名',
      '否定响应也可能按规则被缓存',
      '每个 LookupNetIP 都保证绕过所有缓存',
    ],
    answer: 1,
    explanations: [
      'DNS 支持记录更新，但缓存不会同步推送刷新。',
      '正确。负缓存的寿命来自否定响应中的 SOA 等规则；应检查实际响应。',
      '系统、递归层等都可能存在缓存，Go 接口不保证全部绕过。',
    ],
    takeaway: '缓存也保存“没有”，排障要看响应类型与剩余寿命。',
  },
];
export const dnsFollowups: FollowupItem[] = [
  {
    question: 'DNS 只走 UDP 53 吗？',
    label: '传输与服务分层',
    answer:
      '不是。传统 DNS 同时支持 UDP 与 TCP，截断等情况可触发 TCP；也存在加密传输。记录语义与承载传输应分开理解，网络策略不能只凭“DNS 就是 UDP”制定。',
    deeper: '本地查得快，就证明权威服务器很快吗？',
    point:
      '不能。可能命中了应用、系统或递归缓存。需要知道请求实际经过哪一层，记录缓存状态和查询路径。',
  },
  {
    question: '同时有 A 与 AAAA，必然先连 IPv6 吗？',
    label: '地址选择',
    answer:
      '不能由记录存在推导连接顺序。解析结果、地址排序、双栈回退、操作系统与拨号配置共同影响选择。Go Dialer 有双栈回退策略，但这不是 DNS 协议的保证。',
    deeper: '抓到两次拨号就是应用重试了吗？',
    point: '不一定。地址族竞速与业务请求重试发生在不同层；比较连接事件和请求是否已发送。',
  },
  {
    question: '降低 TTL 能实现瞬时切流吗？',
    label: '变更窗口',
    answer:
      '不能。已经缓存的旧记录会按原有效期使用，已建立连接也可能继续服务。通常提前降低 TTL，观测传播，再结合连接排空与旧节点保留窗口。',
    deeper: '直接杀旧连接是不是更可靠？',
    point: '这可能中断在途请求并制造结果未知。应先设计重试与幂等边界，再决定连接老化和排空策略。',
  },
  {
    question: '为什么浏览器正常，Go 进程却解析失败？',
    label: '环境差异',
    answer:
      '两者可能使用不同代理、解析器、缓存、搜索域或加密 DNS。先比较相同网络命名空间下的解析配置与错误，再核对实际目标地址，不能只用浏览器结果替代进程证据。',
    deeper: 'DNS 返回一个健康 IP 就可以省掉服务发现了吗？',
    point:
      'DNS 记录本身不保证应用健康，也不定义连接池老化、权重或业务摘流。服务发现策略还要处理这些生命周期。',
  },
];
