import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const requestDiagnosisLesson: LessonDefinition = {
  id: 'network-diagnosis',
  moduleId: 'network',
  label: '3.10 请求诊断与退出',
  eyebrow: 'NETWORK / DIAGNOSIS',
  title: '客户端超时了，服务端到底做完没有？',
  shortTitle: '分段观测、超时、重试与退出',
  path: '/learn/network-diagnosis',
  description: [
    '用一次请求的时间线，把前九节连成完整的诊断路径。',
    '分清等待结束与业务结果，再把重试和优雅退出纳入生命周期。',
  ],
  minutes: 40,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    {
      id: 'evidence',
      title: '先把慢拆成几个阶段',
      keywords: 'httptrace DNS Connect TLS GotConn TTFB 连接池 观测',
    },
    {
      id: 'lab',
      title: '同一份预算，覆盖范围不同',
      keywords: '实验 Context Client Timeout ResponseHeaderTimeout 响应体',
    },
    {
      id: 'retry',
      title: '超时后的第三种结果',
      keywords: '结果未知 幂等 重试 Retry-After 退避 副作用',
    },
    {
      id: 'shutdown',
      title: '入口停下后，等待工作真正退出',
      keywords: 'Shutdown Close Server ErrServerClosed 优雅退出 WebSocket',
    },
    { id: 'followups', title: '把证据串成诊断闭环', keywords: '追问 p99 分位数 流式 服务端超时' },
    { id: 'sources', title: '本章回顾与核验依据', keywords: '资料 章节回顾 网络 操作系统' },
  ],
  sources: [
    {
      title: 'Go net/http/httptrace',
      note: '单次请求的连接、DNS、TLS 和首字节钩子及并发边界',
      url: 'https://pkg.go.dev/net/http/httptrace',
    },
    {
      title: 'Go net/http · Client、Transport、Server',
      note: '总超时、阶段超时、响应体与 Shutdown 契约',
      url: 'https://pkg.go.dev/net/http',
    },
    {
      title: 'Go net.Dialer.DialContext',
      note: '拨号 Context 的覆盖范围与连接建立后的边界',
      url: 'https://pkg.go.dev/net#Dialer.DialContext',
    },
    {
      title: 'Go Context',
      note: '传播截止时间、取消与释放资源',
      url: 'https://pkg.go.dev/context',
    },
    {
      title: 'RFC 9110 §9.2.2 · Idempotent Methods',
      note: '幂等语义与自动重试边界，不把超时当成未执行',
      url: 'https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2',
    },
    {
      title: 'Go 1.27.1 · net/http/server.go',
      note: '核验 Shutdown 和连接读写截止时间的具体实现',
      url: 'https://github.com/golang/go/blob/go1.27.1/src/net/http/server.go',
    },
  ],
  Content: lazy(() => import('../lessons/network-diagnosis.mdx')),
};
export const requestDiagnosisQuestions: Question[] = [
  {
    id: 'net-diag-reuse',
    lessonId: 'network-diagnosis',
    title: '没发生 DNS 不等于缺日志',
    prompt: '第二个请求的 GotConn 显示 Reused=true，没有 DNS 和 TLS 钩子。合理解释是什么？',
    options: [
      '一定是追踪系统坏了',
      '请求可能复用了已有连接，因此没有新解析与握手',
      'HTTP 请求可以不使用任何网络连接',
    ],
    answer: 1,
    explanations: [
      '需要先看连接复用，不能凭缺少某类事件断言追踪损坏。',
      '正确。阶段是否出现与执行路径有关，不是每次请求都走冷启动链。',
      '这里仍有连接，只是创建发生在之前。',
    ],
    takeaway: '阶段缺席也可能是路径证据，结合 Reused 判断。',
  },
  {
    id: 'net-diag-body',
    lessonId: 'network-diagnosis',
    title: '响应头超时保护不到哪里？',
    prompt:
      '仅设置 ResponseHeaderTimeout，服务器很快发送响应头，随后响应体一直很慢。该字段能限制整个响应体耗时吗？',
    options: [
      '能，它等同于 http.Client.Timeout',
      '不能，需要覆盖整个请求的预算或适合流式读取的策略',
      '能，Do 返回就代表响应体读完',
    ],
    answer: 1,
    explanations: [
      '它只覆盖指定的响应头等待阶段。',
      '正确。请求 Context 和 Client 总超时的覆盖范围不同于响应头计时。',
      'Do 返回响应不等于后续 Body 消费完成。',
    ],
    takeaway: '先画覆盖区间，再选择超时字段。',
  },
  {
    id: 'net-diag-unknown',
    lessonId: 'network-diagnosis',
    title: '扣款提交后响应丢失',
    prompt: '服务端已提交一次扣款，客户端等不到响应而超时。客户端应如何理解并安排后续？',
    options: [
      '确定没有扣款，立即换个请求号再扣一次',
      '确定服务端自动回滚，重试没有副作用',
      '结果未知；查询状态或使用具备原子去重契约的同一业务键重试',
    ],
    answer: 2,
    explanations: [
      '超时只说明没有在预算内观察到结果，换新键会破坏去重。',
      '网络取消不自动撤销已经完成的业务提交。',
      '正确。重试资格还取决于语义、可重放请求、剩余预算和服务端去重契约。',
    ],
    takeaway: '等待失败、业务失败与结果未知是三种不同描述。',
  },
  {
    id: 'net-diag-shutdown',
    lessonId: 'network-diagnosis',
    title: 'Serve 返回后能直接退出主程序吗？',
    prompt:
      '开始 Shutdown 后 Serve 返回 ErrServerClosed，但还有活跃请求。main 立即返回有什么问题？',
    options: [
      '进程退出会截断正在等待的排空流程，需要显式等待 Shutdown 及自管任务完成',
      '没有问题，ErrServerClosed 证明所有业务已提交',
      '没有问题，Shutdown 自动等待任何 WebSocket 和后台 goroutine',
    ],
    answer: 0,
    explanations: [
      '正确。停止接受与存量工作结束是不同事件，退出责任必须接起来。',
      '该错误表示服务入口停止，不是全业务完成凭证。',
      '被劫持连接、后台任务等需要应用单独管理。',
    ],
    takeaway: '入口关闭不是生命周期闭环，必须等待工作和清理结束。',
  },
];
export const requestDiagnosisFollowups: FollowupItem[] = [
  {
    question: '把 DNS p99、TLS p99、处理 p99 相加就是请求 p99 吗？',
    label: '分布边界',
    answer:
      '不是。各阶段高分位数可能来自不同请求，阶段还可能缺席或重叠。应从同一请求的时间线分析因果，再用总体分布观察变化；不要把分位数当作可直接相加的普通时长。',
    deeper: '首字节慢就是数据库慢吗？',
    point:
      '还可能包含连接等待、网络、请求发送、排队与应用处理。客户端首字节指标不能独自定位数据库；需与服务端队列、span、CPU、锁等待等关联。',
  },
  {
    question: '服务端的四种超时各保护哪里？',
    label: '输入输出边界',
    answer:
      'ReadHeaderTimeout 约束读请求头；ReadTimeout 约束读取整个请求（含 Body）；WriteTimeout 约束响应写入的期限；IdleTimeout 约束长连接等待下个请求。零值、继承关系及协议实现都要按文档确认。',
    deeper: 'WriteTimeout 能中断死循环 handler 吗？',
    point:
      '不能把连接写期限当成通用抢占器。业务和下游调用仍需 Context 与协作取消；TLS 握手和流式场景还要核对实际期限设置，不能照抄一组数值。',
  },
  {
    question: '流式响应应该直接关闭所有超时吗？',
    label: '长寿命请求',
    answer:
      '长连接的总时长预算与“多久没有进展”的空闲期限不同。可以按协议与 API 能力采用心跳、进展期限、最大流寿命及关闭策略；不要把一个短的 Client.Timeout 套在长流上，也别因此取消全部保护。',
    deeper: '能不能直接改复用 TCP 连接的 deadline？',
    point:
      'HTTP/2 等连接上可能承载多个流，连接级 deadline 会影响其他工作。优先使用请求或流级 API，明确连接所有权后再操作底层。',
  },
  {
    question: '重试和优雅退出有什么共同点？',
    label: '剩余预算',
    answer:
      '都需要把当前状态、剩余时间与资源归属说清楚。重试不能重置外层总预算，排空不能无限延长进程退出；它们也都不能凭一个本地返回值推断远端副作用消失。',
    deeper: '已经有重试，为什么还要限流？',
    point:
      '故障期间重试会放大压力。限制次数、退避并加抖动、尊重适用的 Retry-After 与并发额度，在剩余预算不足或语义不安全时停止。',
  },
];
