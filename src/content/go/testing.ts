import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const testingLesson: LessonDefinition = {
  id: 'go-testing',
  moduleId: 'go',
  label: '1.10 测试与工程闭环',
  eyebrow: 'GO / VERIFY',
  title: '一个样例通过了，你究竟证明了什么？',
  shortTitle: '测试、模糊测试与工程闭环',
  path: '/learn/go-testing',
  description: [
    '把结论变成能失败的断言，把反例变成长期保留的测试。',
    '用并行测试、虚拟时间、fuzz、race 与 CI 建立持续核验闭环。',
  ],
  minutes: 36,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'contract', title: '从契约推导测试', keywords: '表驱动 边界 断言 覆盖率' },
    { id: 'lifecycle', title: '并行测试与清理顺序', keywords: 't.Parallel Cleanup Context Go1.24' },
    { id: 'time', title: '时间与并发也能被控制', keywords: 'synctest Go1.25 虚拟时间 Wait' },
    { id: 'lab', title: '用一个反例推翻错误实现', keywords: 'fuzz 属性 反例 JSON 实验' },
    {
      id: 'workflow',
      title: '从本地命令到 CI',
      keywords: 'race vet govulncheck mod toolchain 缓存 shuffle',
    },
    { id: 'followups', title: '测试之后仍有哪些不确定性', keywords: '追问 测试 集成 PostgreSQL' },
    { id: 'sources', title: '本章收束与核验依据', keywords: '第一章 回顾 版本 核验' },
  ],
  sources: [
    {
      title: '标准库 testing',
      note: '表驱动、子测试、Parallel、Cleanup、Context 与 fuzz',
      url: 'https://pkg.go.dev/testing',
    },
    {
      title: 'Go 1.24 · testing 更新',
      note: 'T.Context 等 API 的版本起点',
      url: 'https://go.dev/doc/go1.24#testing',
    },
    {
      title: '标准库 testing/synctest',
      note: '隔离 bubble、虚拟时间和 durably blocked 条件',
      url: 'https://pkg.go.dev/testing/synctest',
    },
    {
      title: 'Go 1.25 · testing/synctest',
      note: '正式可用的并发测试支持',
      url: 'https://go.dev/doc/go1.25#testing/synctest',
    },
    {
      title: 'Go fuzzing 指南',
      note: '种子、属性、失败语料与持续探索',
      url: 'https://go.dev/doc/security/fuzz/',
    },
    {
      title: 'Go race detector 指南',
      note: '检测已执行路径上的竞态，不能证明没有所有问题',
      url: 'https://go.dev/doc/articles/race_detector',
    },
    { title: 'Go modules 参考', note: 'go.mod、依赖与模块维护', url: 'https://go.dev/ref/mod' },
    {
      title: 'Go toolchains 指南',
      note: 'go 版本要求、toolchain 建议与自动选择',
      url: 'https://go.dev/doc/toolchain',
    },
    {
      title: 'Go 漏洞检测指南',
      note: 'govulncheck 的已知漏洞与可达性分析',
      url: 'https://go.dev/doc/security/vuln/',
    },
  ],
  Content: lazy(() => import('../lessons/go-testing.mdx')),
};
export const testingQuestions: Question[] = [
  {
    id: 'go-test-coverage',
    lessonId: 'go-testing',
    title: '覆盖率不能替代断言',
    prompt: '某函数达到 100% 语句覆盖率，能证明边界行为和并发行为正确吗？',
    options: [
      '能，每行都执行过就足够',
      '不能，执行过不代表断言了正确结果，也不代表覆盖所有组合',
      '能，只要没有 panic',
    ],
    answer: 1,
    explanations: [
      '覆盖率描述执行位置，不直接描述属性、输入空间和调度组合。',
      '正确。还要从契约推导边界、失败和交互行为，再选择合适检查。',
      '没有 panic 不代表结果、清理或共享状态正确。',
    ],
    takeaway: '覆盖率找遗漏，断言检查契约。',
  },
  {
    id: 'go-test-cleanup',
    lessonId: 'go-testing',
    title: '父函数返回时，并行子测试可能还未完成',
    prompt: '父测试建立共享资源，子测试调用 t.Parallel()。资源应何时关闭？',
    options: [
      '父测试用 defer 关闭一定安全',
      '用父级 t.Cleanup，让该测试及其子测试完成后再清理',
      '子测试登记完立刻关闭',
    ],
    answer: 1,
    explanations: [
      '父函数的 defer 可能在并行子测试继续运行之前执行，过早关闭资源。',
      '正确。Cleanup 的生命周期包含该测试及其子测试，仍需确保资源自身的并发安全。',
      '登记子测试不等于它们已经执行完成。',
    ],
    takeaway: '并行子测试的共享资源，跟随 Cleanup 生命周期。',
  },
  {
    id: 'go-test-fuzz',
    lessonId: 'go-testing',
    title: 'fuzz 成功发现问题，接下来做什么',
    prompt: 'Fuzz 找到 [0] 会让编码解码往返丢失元素。最合理的下一步是什么？',
    options: [
      '把 [0] 从输入域排除，直到测试全绿',
      '确认性质与业务契约，保留反例，修复后持续回归',
      '只增加 fuzz 运行时间，不修改实现',
    ],
    answer: 1,
    explanations: [
      '只有业务契约本来就排除该输入时才应限制输入域，不能为了通过测试临时改规则。',
      '正确。失败语料把一次探索结果变成可重复的回归证据。',
      '更长探索有助于发现其他问题，不能自动修复已知缺陷。',
    ],
    takeaway: '反例要留住，契约要守住。',
  },
  {
    id: 'go-test-race',
    lessonId: 'go-testing',
    title: '动态工具的结论要带范围',
    prompt: 'go test -race 全部通过，可以宣布程序不存在任何数据竞争吗？',
    options: [
      '可以，它会枚举全部调度顺序',
      '不可以，只能说明本次覆盖路径没有报告检测到的竞态',
      '可以，再加 100% 覆盖率就成为数学证明',
    ],
    answer: 1,
    explanations: [
      '动态检测依赖实际运行，不穷举所有输入与调度。',
      '正确。设计中的同步关系、负载覆盖和其他测试仍然需要审查。',
      '语句覆盖也不等于所有并发交错，两个指标不能合成完备证明。',
    ],
    takeaway: 'race 查执行证据，正确性仍靠同步设计。',
  },
];
export const testingFollowups: FollowupItem[] = [
  {
    question: '表驱动加 t.Parallel，就自动是高质量测试了吗？',
    label: '契约',
    answer:
      '表驱动只是组织形式。用例应覆盖业务边界、错误、nil/空、资源释放和状态变化；并行执行还要求测试隔离。Go 1.22 的循环变量新语义减少一类捕获问题，却不能修复共享 map、环境变量或外部资源的冲突。',
    deeper: '能在并行测试里随便 t.Setenv 吗？',
    point:
      '不能。环境变量是进程级状态，testing 会限制在并行测试或有并行祖先的测试中使用 Setenv；其他全局状态也应隔离。',
  },
  {
    question: 'synctest.Wait 是不是会把所有未来定时器都跑完？',
    label: '虚拟时间',
    answer:
      '不是。Wait 等其他 goroutine 进入持久阻塞或结束，然后可返回，不等同于推进到所有未来事件。虚拟时钟在 bubble 内所有 G 都满足规定的阻塞条件时才有机会前进；网络 I/O、外部进程等不属于任意可加速的虚拟世界。',
    deeper: '在 bubble 里写忙循环等待结果会怎样？',
    point:
      '仍在运行的忙循环可能阻止虚拟时间前进。用受支持的同步方式表达等待，而不是反复读变量或睡一个猜测时长。',
  },
  {
    question: '单元测试已经 mock 了数据库，还需要 PostgreSQL 集成测试吗？',
    label: '跨边界',
    answer:
      '需要覆盖真实依赖语义。mock 可以验证调用参数和错误路径，但不能证明 SQL、约束、事务隔离、驱动取消、迁移和连接池行为。针对这些契约，应在受控版本的 PostgreSQL 上运行必要集成测试，使用隔离数据和确定性清理；不能把 MySQL 的默认行为替换进去。',
    deeper: '是不是每个测试都应该启动真实数据库？',
    point:
      '按风险分层。纯逻辑单测保持快速，关键跨边界契约做集成，重要用户流程做端到端，避免机械重复。',
  },
  {
    question: 'CI 全绿，为什么上线仍可能失败？',
    label: '持续验证',
    answer:
      '测试只能覆盖设计并实际运行的条件。生产数据分布、配置、依赖版本、CPU 配额、迁移顺序和流量形态可能不同。需要保留版本与环境信息，运行必要兼容检查，并结合渐进发布、指标与可回滚设计；全绿是证据，不是无限保证。',
    deeper: '怎样让这门课程里的结论以后也不过时？',
    point:
      '把规范、实现版本、可执行反例与参考资料绑定；版本升级时复核受影响内容，修订结论并保留变更记录。',
  },
];
