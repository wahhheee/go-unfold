import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const errorsLesson: LessonDefinition = {
  id: 'go-errors',
  moduleId: 'go',
  label: '1.9 错误与 defer',
  eyebrow: 'GO / FAILURE & CLEANUP',
  title: '失败以后，错误怎么传，资源谁来收？',
  shortTitle: '错误、defer 与 panic',
  path: '/learn/go-errors',
  description: [
    '把错误身份、调用上下文和清理责任同时保留下来。',
    '用分步执行说明 defer，再界定 panic 与 recover 的能力。',
  ],
  minutes: 34,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'errors',
      title: '错误是契约，不只是字符串',
      keywords: 'error %w errors.Is AsType Go1.26',
    },
    { id: 'trees', title: '错误链也可能是一棵树', keywords: 'Join Unwrap 多错误 清理失败' },
    { id: 'lab', title: 'defer 的求值与返回顺序', keywords: 'defer LIFO 闭包 命名返回 实验' },
    { id: 'resources', title: '让资源生命周期跟随作用域', keywords: 'Close defer 循环 回滚 错误' },
    {
      id: 'panic',
      title: 'recover 的边界',
      keywords: 'panic recover goroutine Goexit os.Exit panicnil',
    },
    { id: 'followups', title: '失败以后还能继续吗', keywords: '追问 错误 API 取消 故障' },
    { id: 'sources', title: '记忆锚点与依据', keywords: '版本 核验' },
  ],
  sources: [
    {
      title: '标准库 errors',
      note: 'Is、As、AsType、错误树与匹配协议',
      url: 'https://pkg.go.dev/errors',
    },
    {
      title: 'Go 1.26 · errors.AsType',
      note: '泛型错误匹配 API 的版本边界',
      url: 'https://go.dev/doc/go1.26#errors',
    },
    {
      title: 'fmt.Errorf',
      note: '%w 的包装关系与多个错误操作数',
      url: 'https://pkg.go.dev/fmt#Errorf',
    },
    {
      title: 'Go 规范 · defer',
      note: '登记时求值，逆序执行，返回赋值后执行',
      url: 'https://go.dev/ref/spec#Defer_statements',
    },
    {
      title: 'Go 规范 · panic 与 recover',
      note: '同 goroutine、直接调用与恢复后的返回行为',
      url: 'https://go.dev/ref/spec#Handling_panics',
    },
    {
      title: 'runtime.PanicNilError',
      note: 'Go 1.21 起 panic(nil) 的默认行为变化',
      url: 'https://pkg.go.dev/runtime#PanicNilError',
    },
    {
      title: 'Go 官方博客 · Working with Errors in Go 1.13',
      note: '包装错误会成为 API 可观察契约的一部分',
      url: 'https://go.dev/blog/go1.13-errors',
    },
  ],
  Content: lazy(() => import('../lessons/go-errors.mdx')),
};
export const errorQuestions: Question[] = [
  {
    id: 'go-error-wrap',
    lessonId: 'go-errors',
    title: '附加上下文之后还认得原错误吗',
    prompt:
      'base := errors.New("missing")；err := fmt.Errorf("load user: %w",base)。哪个判断正确？',
    options: [
      'err == base 为 true',
      'errors.Is(err,base) 为 true',
      'errors.Is(err,errors.New("missing")) 必然为 true',
    ],
    answer: 1,
    explanations: [
      '外层包装错误与原错误不是同一个值。',
      '正确。Is 会沿包装关系匹配，不只看最外层值。',
      '每次 errors.New 产生不同错误值，相同文本不等于相同身份。',
    ],
    takeaway: '文本给人看，Is 沿契约识别。',
  },
  {
    id: 'go-error-join',
    lessonId: 'go-errors',
    title: '一条 Unwrap 调用走不完错误树',
    prompt: 'a、b 都是非 nil 错误，joined := errors.Join(a,b)。哪项正确？',
    options: [
      'errors.Unwrap(joined) 自动返回全部子错误',
      'errors.Is(joined,b) 可以沿树匹配，但 errors.Unwrap(joined) 返回 nil',
      'Join 只保留第一个错误',
    ],
    answer: 1,
    explanations: [
      'errors.Unwrap 的辅助函数只调用 Unwrap() error，不处理 Unwrap() []error。',
      '正确。Is、As、AsType 支持错误树，而单步 Unwrap 辅助函数有更窄的契约。',
      'Join 会保留多个非 nil 错误，并丢弃 nil 参数。',
    ],
    takeaway: '错误可以成树；匹配用 Is/AsType，别手写单链遍历。',
  },
  {
    id: 'go-defer-result',
    lessonId: 'go-errors',
    title: '返回值在 defer 之前已经赋值',
    prompt: 'func result() (n int) { defer func(){ n++ }(); return 5 } 返回什么？',
    options: ['0', '5', '6'],
    answer: 2,
    explanations: [
      '命名返回变量虽初始化为 0，但 return 5 会先给它赋值。',
      '函数真正返回前，defer 仍能修改这个命名返回变量。',
      '正确。先 n=5，再执行 n++，调用方最终得到 6。',
    ],
    takeaway: 'return 先赋值，defer 再执行，最后回到调用者。',
  },
  {
    id: 'go-recover-boundary',
    lessonId: 'go-errors',
    title: '父调用栈不是子 goroutine 的保护网',
    prompt:
      '父 goroutine 中 defer 了 recover，随后启动一个未设置自身恢复边界的子 goroutine，子 goroutine panic。父级 recover 能捕获吗？',
    options: [
      '能，因为子 goroutine 是父函数启动的',
      '不能，recover 只处理同一 goroutine 的 panic 展开',
      '能，只要父 goroutine 正在等待子任务',
    ],
    answer: 1,
    explanations: [
      '创建关系不等于共享同一条调用栈。',
      '正确。未恢复的 panic 会终止程序，不能靠另一 goroutine 的 defer 兜住。',
      '等待关系不改变 recover 的作用范围。',
    ],
    takeaway: '恢复沿同一条调用栈，不跨 goroutine。',
  },
];
export const errorFollowups: FollowupItem[] = [
  {
    question: '所有底层错误都用 %w 包出去，信息不是最多吗？',
    label: 'API 契约',
    answer:
      '包装让调用方能够通过 Is 或 AsType 观察到底层身份和类型，也可能把数据库驱动等实现细节变成 API 依赖。应有意识地选择：保留需要调用方处理的语义，或在边界映射为稳定的领域错误；人类可读上下文与机器可依赖契约要分开。',
    deeper: '换数据库后错误类型变了，算不算破坏兼容？',
    point:
      '如果调用方已经被允许依赖这个类型，就可能构成兼容性变化。先设计错误边界，再决定是否包装。',
  },
  {
    question: 'defer 不是很慢吗，要不要全部删掉？',
    label: '实现与正确性',
    answer:
      '不能用旧基准概括当前实现。编译器会对适合的 defer 做优化，开销取决于形态和版本；循环中的动态登记还可能累积资源。先维护清晰、完整的收尾路径，再在实际热点上测量，不能用早期版本常量证明所有 defer 都该删除。',
    deeper: '在循环里 defer Close，为什么文件句柄还是用完了？',
    point:
      'defer 在函数退出时执行，不是在循环一轮结束时执行。把每项工作提取到拥有清晰生命周期的函数。',
  },
  {
    question: 'recover 住 panic 就能把服务当作成功继续吗？',
    label: '状态完整性',
    answer:
      '不能。恢复只是停止这一条 panic 展开，不能撤销已经修改的共享状态或外部副作用。应在明确隔离边界决定能否恢复，记录必要上下文和栈，并向调用方报告失败。某些运行时 fatal 不是普通可恢复 panic，不能建立“捕获一切”的承诺。',
    deeper: 'recover 后会从 panic 下一行继续吗？',
    point: '不会。被恢复的函数按规则执行剩余 defer 后返回调用者，中间被展开的调用不恢复执行。',
  },
  {
    question: 'context.Canceled 应不应该当作严重错误反复记录？',
    label: '错误分类',
    answer:
      '取决于上下文。调用方主动离开通常不等于服务内部故障，截止时间也可能提示容量或依赖问题。用 errors.Is 识别包装后的取消和超时，结合请求结果与指标分类；避免每层既记录又包装，制造同一故障的重复日志。',
    deeper: '取消后重试能保证没有副作用吗？',
    point:
      '不能。操作可能已在外部提交，取消只改变本地等待或协作状态。结果未知与幂等问题仍需业务协议处理。',
  },
];
