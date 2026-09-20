import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const netpollLesson: LessonDefinition = {
  id: 'network-netpoll',
  moduleId: 'network',
  label: '3.9 就绪通知与 netpoll',
  eyebrow: 'SYSTEM / I/O',
  title: '十万连接都在等，为什么不需要十万线程？',
  shortTitle: '阻塞、epoll 与 Go netpoll',
  path: '/learn/network-netpoll',
  description: [
    '把等待、就绪、读取和执行拆成四个事件。',
    '从没有读完的两个字节，理解 ET 的边界和 Go 的同步外观。',
  ],
  minutes: 36,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    {
      id: 'waiting',
      title: '是谁在等待？',
      keywords: '阻塞 非阻塞 同步 异步 readiness completion',
    },
    { id: 'lab', title: '有数据，却等不到新通知', keywords: '实验 epoll ET LT EAGAIN EOF 排空' },
    {
      id: 'netpoll',
      title: 'Go Read 背后的等待路径',
      keywords: 'netpoll goroutine G M P runtime internal poll',
    },
    {
      id: 'capacity',
      title: '多连接的成本没有消失',
      keywords: '背压 公平性 fd 限制 内存 cgo 普通文件',
    },
    { id: 'followups', title: '沿就绪与生命周期追问', keywords: '追问 ONESHOT Close 超时 可写' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: '资料 Linux Go' },
  ],
  sources: [
    {
      title: 'Linux epoll(7)',
      note: '兴趣集合、就绪集合、LT/ET、EAGAIN 与公平性',
      url: 'https://man7.org/linux/man-pages/man7/epoll.7.html',
    },
    {
      title: 'Linux read(2)',
      note: '短读、EOF、EAGAIN 与 EINTR',
      url: 'https://man7.org/linux/man-pages/man2/read.2.html',
    },
    {
      title: 'Go 1.27.1 · runtime/netpoll_epoll.go',
      note: 'Linux 的 epoll 注册和事件到运行时的衔接',
      url: 'https://github.com/golang/go/blob/go1.27.1/src/runtime/netpoll_epoll.go',
    },
    {
      title: 'Go 1.27.1 · internal/poll/fd_unix.go',
      note: '先尝试读取，EAGAIN 后等待，再重新尝试',
      url: 'https://github.com/golang/go/blob/go1.27.1/src/internal/poll/fd_unix.go',
    },
    {
      title: 'Go net.Conn',
      note: '并发调用、关闭与截止时间的 API 契约',
      url: 'https://pkg.go.dev/net#Conn',
    },
    {
      title: 'Go os.File.SetDeadline',
      note: '并非所有文件支持截止时间，普通文件与可轮询对象有别',
      url: 'https://pkg.go.dev/os#File.SetDeadline',
    },
  ],
  Content: lazy(() => import('../lessons/network-netpoll.mdx')),
};
export const netpollQuestions: Question[] = [
  {
    id: 'net-poll-ready',
    lessonId: 'network-netpoll',
    title: '就绪不等于已经读完',
    prompt: 'epoll 返回某连接可读，此时能确认什么？',
    options: [
      '请求已经完整进入应用缓冲',
      '可以尝试读取，但仍需处理实际返回的数据、EOF 或错误',
      '下一次 Read 一定恰好读满缓冲区',
    ],
    answer: 1,
    explanations: [
      'epoll 提供事件通知，消息解析和数据读取还没完成。',
      '正确。就绪只提供进行 I/O 的条件，结果由实际调用确认。',
      '字节流允许短读，也没有自动的业务消息边界。',
    ],
    takeaway: '就绪是行动线索，Read 才给出结果。',
  },
  {
    id: 'net-poll-et',
    lessonId: 'network-netpoll',
    title: '剩下的字节没有消失',
    prompt: 'ET 实验中四字节到达，取事件后只读两字节，没有新数据时再取事件为什么可能没有通知？',
    options: [
      '剩余数据被 epoll 丢弃了',
      'ET 会自动补读剩余字节',
      '部分读取后仍有数据，但没有新的变化通知；应继续处理到 EAGAIN 或结束',
    ],
    answer: 2,
    explanations: [
      '缓冲仍有数据，事件机制不会代替应用丢弃它们。',
      '事件通知与读取操作是两回事。',
      '正确。若提前重新等待，可能等着已经在缓冲里的数据。',
    ],
    takeaway: 'ET 下保留“尚未处理完”的状态，不要依赖下一次提醒。',
  },
  {
    id: 'net-poll-go',
    lessonId: 'network-netpoll',
    title: '同步写法不等于独占线程',
    prompt: '普通 Go TCP 连接没有数据时，conn.Read 通常怎样等待？',
    options: [
      '运行时可挂起当前 G，等就绪后再调度，不要求每连接占住一个线程',
      '每个连接永久绑定一个操作系统线程',
      'Go 在浏览器里每毫秒查询一次',
    ],
    answer: 0,
    explanations: [
      '正确。对支持轮询的网络描述符，运行时负责非阻塞尝试和等待衔接。',
      '这是把用户看到的阻塞调用等同于内核阻塞线程。',
      'Go netpoll 使用系统提供的事件机制，且本应用的实验仅为教学模型。',
    ],
    takeaway: 'API 的同步外观与内部等待机制分开看。',
  },
  {
    id: 'net-poll-capacity',
    lessonId: 'network-netpoll',
    title: '节省线程后还需要额度吗？',
    prompt: '采用 netpoll 后，服务是否可以无限接受连接并启动下游请求？',
    options: [
      '可以，等待不消耗任何资源',
      '可以，epoll 保证所有业务延迟恒定',
      '不可以，描述符、缓冲、G 栈、CPU 与下游仍有限',
    ],
    answer: 2,
    explanations: [
      '等待仍保留连接、状态、缓冲等资源。',
      '就绪机制不保证业务调度公平、CPU 充足或下游可用。',
      '正确。仍需并发边界、截止时间与背压，把第二章的预算落实到 I/O。',
    ],
    takeaway: '复用等待资源没有取消容量规划。',
  },
];
export const netpollFollowups: FollowupItem[] = [
  {
    question: '可写是不是对端应用已经准备好接收？',
    label: '观察边界',
    answer:
      '通常只表示本端当前可向内核发送缓冲推进一些数据；不证明对端进程已经读取，更不证明业务提交。拥塞、接收窗口与应用处理仍是不同层。',
    deeper: '一直监听可写会怎样？',
    point:
      'LT 下空闲连接可能持续可写，若没有待发送数据却反复处理，会空转。事件循环通常按实际待办调整兴趣或状态。',
  },
  {
    question: '读到 EAGAIN 可以关闭连接吗？',
    label: '暂时与结束',
    answer:
      'EAGAIN 表示当前操作会等待，是暂时没有进展条件；EOF 才表示字节流读方向结束。EOF 之前仍可能有缓冲数据。不要把空缓冲当成断线。',
    deeper: '多个读取者竞争呢？',
    point:
      '另一个读取者可能先消耗数据，所以即使刚收到就绪也应处理 EAGAIN。业务协议通常由明确的单一读取所有者完成定界。',
  },
  {
    question: 'ET 一次排空会不会让其他连接挨饿？',
    label: '公平推进',
    answer:
      '持续繁忙的连接可能占用太久。可设置每轮处理额度并把尚未排空的连接保存在应用就绪队列，稍后继续；不能只停止读取再盲等新边缘。',
    deeper: 'ONESHOT 能解决一切吗？',
    point:
      '它在一次通知后停用关联兴趣，需要显式重新武装。它是并发事件管理工具，不替代状态、所有权、排空与公平策略。',
  },
  {
    question: '取消 Context 为什么没叫醒裸 conn.Read？',
    label: '取消接线',
    answer:
      'Context 本身不认识任意连接。net.Conn 的 Read 没有 Context 参数，需要持有者设置 deadline 或关闭连接，或使用明确接收 Context 的上层 API。不要仅创建 Context 就假定所有阻塞都能退出。',
    deeper: 'Close 和 deadline 呢？',
    point:
      'net.Conn 契约规定 Close 可使阻塞的 Read/Write 返回错误；deadline 影响待进行和未来的 I/O，需按所有权安排，复用连接时也要处理截止时间状态。',
  },
];
