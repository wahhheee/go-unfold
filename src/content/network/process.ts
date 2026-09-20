import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const processLesson: LessonDefinition = {
  id: 'network-process',
  moduleId: 'network',
  label: '3.7 进程、线程与描述符',
  eyebrow: 'SYSTEM / PROCESS',
  title: '关闭了一个句柄，文件为什么还能继续读？',
  shortTitle: '进程、线程、系统调用与文件描述符',
  path: '/learn/network-process',
  description: [
    '从资源归属理解进程，从执行现场理解线程。',
    '追踪描述符背后的共享引用，避免把一个整数当成整份资源。',
  ],
  minutes: 35,
  labCount: 1,
  verifiedAt: '2026-09-20',
  sections: [
    {
      id: 'ownership',
      title: '资源容器与执行现场',
      keywords: '进程 线程 goroutine 地址空间 寄存器 栈',
    },
    {
      id: 'syscalls',
      title: '系统调用不等于线程切换',
      keywords: '用户态 内核态 syscall 上下文切换',
    },
    { id: 'lab', title: '复制引用，追踪共享偏移', keywords: '实验 fd dup open fork 打开文件描述' },
    {
      id: 'lifecycle',
      title: '创建、替换与回收进程',
      keywords: 'exec wait 僵尸 CLOEXEC os/exec ExtraFiles',
    },
    { id: 'followups', title: '沿资源生命周期继续追问', keywords: '追问 泄漏 unlink 管道 close' },
    { id: 'sources', title: '记忆锚点与核验依据', keywords: 'Linux Go 资料' },
  ],
  sources: [
    {
      title: 'Linux close(2)',
      note: '关闭错误与编号复用，不能盲目重试',
      url: 'https://man7.org/linux/man-pages/man2/close.2.html',
    },
    {
      title: 'Linux unlink(2)',
      note: '删除路径与已打开引用的不同生命周期',
      url: 'https://man7.org/linux/man-pages/man2/unlink.2.html',
    },
    {
      title: 'Linux pthreads(7)',
      note: '线程共享进程资源与各自执行状态',
      url: 'https://man7.org/linux/man-pages/man7/pthreads.7.html',
    },
    {
      title: 'Linux open(2) / dup(2)',
      note: '描述符、打开文件描述、共享偏移与编号复用',
      url: 'https://man7.org/linux/man-pages/man2/open.2.html',
    },
    {
      title: 'Linux dup(2)',
      note: '新描述符引用同一打开文件描述',
      url: 'https://man7.org/linux/man-pages/man2/dup.2.html',
    },
    {
      title: 'Linux fork(2)',
      note: '地址空间与继承的描述符引用',
      url: 'https://man7.org/linux/man-pages/man2/fork.2.html',
    },
    {
      title: 'Linux execve(2)',
      note: '替换进程映像，close-on-exec 语义',
      url: 'https://man7.org/linux/man-pages/man2/execve.2.html',
    },
    {
      title: 'Linux wait(2)',
      note: '退出状态与僵尸进程回收',
      url: 'https://man7.org/linux/man-pages/man2/wait.2.html',
    },
    {
      title: 'Go os/exec · Cmd',
      note: 'Start/Wait、取消、ExtraFiles 与进程管理',
      url: 'https://pkg.go.dev/os/exec#Cmd',
    },
  ],
  Content: lazy(() => import('../lessons/network-process.mdx')),
};
export const processQuestions: Question[] = [
  {
    id: 'net-process-thread',
    lessonId: 'network-process',
    title: '同进程的线程共享什么',
    prompt: 'Linux 同一进程中的两个普通线程，哪个说法最准确？',
    options: [
      '它们共享地址空间和打开文件描述符，但各有执行栈与寄存器状态',
      '各自拥有完全隔离的堆',
      '其中一个修改内存，另一个永远看不到',
    ],
    answer: 0,
    explanations: [
      '正确。线程栈仍处在共享地址空间中，不能把“各有栈”误解成内存隔离。',
      '普通线程共享进程地址空间，堆不是自动隔离的。',
      '共享需要同步保证正确可见性，不是天然互相不可见。',
    ],
    takeaway: '共享资源与独立执行现场可以同时存在。',
  },
  {
    id: 'net-process-dup',
    lessonId: 'network-process',
    title: 'dup 复制的是引用',
    prompt: 'fd3 读到 AB 后，dup 得到 fd4。随后从 fd4 读两字节，本节普通文件 ABCDEFGH 模型中得到？',
    options: ['AB', 'CD', '必然 EOF'],
    answer: 1,
    explanations: [
      'dup 没有为新引用重置偏移；重新 open 才创建独立描述。',
      '正确。两个描述符指向同一打开文件描述，共享已前进到 2 的偏移。',
      '文件仍有剩余内容，复制引用不会读到结尾。',
    ],
    takeaway: 'fd 是表项，偏移在它引用的打开文件描述里。',
  },
  {
    id: 'net-process-fork',
    lessonId: 'network-process',
    title: '父进程关闭后子进程仍持有',
    prompt: 'fork 后父子 fd3 引用同一打开文件描述，父进程关闭 fd3。子进程的 fd3 会怎样？',
    options: ['自动关闭', '变成相同整数的任意新文件', '仍有自己的引用，可继续按共享偏移读取'],
    answer: 2,
    explanations: [
      '父子描述符表独立，关闭父表项不删除子表项。',
      '编号只在各自表中解释，不会自动改指向。',
      '正确。需要在每个拥有者处管理继承的引用。',
    ],
    takeaway: '复制表不等于复制底层对象；关闭一份引用不等于所有引用消失。',
  },
  {
    id: 'net-process-exec',
    lessonId: 'network-process',
    title: 'exec 换程序，wait 收退出',
    prompt: 'Linux execve 成功执行新程序后，哪种说法正确？',
    options: [
      '创建了全新的 PID，旧进程继续等待',
      '替换当前进程映像；没有自动变成一个新的进程身份',
      '只切换到另一个 goroutine',
    ],
    answer: 1,
    explanations: [
      'exec 本身替换现有进程，不像 fork 那样创建新进程。',
      '正确。部分进程属性保留，标记 CLOEXEC 的描述符会关闭。',
      '这是操作系统级程序替换，不能用 goroutine 调度描述。',
    ],
    takeaway: 'fork 创建，exec 替换，wait 回收退出信息。',
  },
];
export const processFollowups: FollowupItem[] = [
  {
    question: '进入内核态一定切换到另一个线程吗？',
    label: '两种切换',
    answer:
      '不一定。系统调用可以由当前线程进入内核执行后返回；若需要等待或被调度器抢占，才可能发生线程调度切换。权限级别变化与换执行线程不能混为一谈。',
    deeper: '一次库函数调用就是一次系统调用吗？',
    point:
      '也不一定。库可以缓存、合并或完全在用户态完成，例如缓冲读可能不再触发内核读取；应测实际调用路径。',
  },
  {
    question: '打开文件后删掉路径，句柄马上失效吗？',
    label: '名字与对象',
    answer:
      '在 Linux 普通文件语义下，移除目录项不自动撤销已有打开引用。文件数据可能在仍有引用时继续可读，空间释放还取决于链接与引用等条件。',
    deeper: '日志删了磁盘空间却没降，先看什么？',
    point:
      '检查进程是否仍打开已删除文件，以及是否还有其他硬链接；先安排日志重开与生命周期，避免只重复删路径。',
  },
  {
    question: 'close 返回错误，可以拿同一个 fd 数字无限重试吗？',
    label: '编号复用',
    answer:
      '在 Linux 上通常不能这样做。内核可能已释放描述符编号，随后它被其他线程重新分配；重试可能关闭无关资源。错误处理要按具体平台 close 契约，而不是盲目重复。',
    deeper: '保存 fd 数字就能保证资源还活着？',
    point:
      '不能。要保存有明确所有权与生命周期的对象，并防止关闭与使用并发冲突；整数不是引用计数协议。',
  },
  {
    question: 'CommandContext 取消会自动杀掉所有子孙进程吗？',
    label: '管理范围',
    answer:
      '不能默认如此。默认取消主要终止被管理的进程，进程组、子孙、管道和退出等待仍要专门处理。Start 成功后调用 Wait 回收状态并收尾；不能只发送终止信号就当管理完成。',
    deeper: '为什么 Go 服务不建议自己裸 fork 后执行任意 Go 代码？',
    point:
      '多线程进程 fork 后只保留调用线程，其他线程持有的运行时或库锁状态可能留存。使用 os/exec 的受支持创建路径，不自行拼接运行时不支持的流程。',
  },
];
