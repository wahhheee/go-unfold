import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const interfacesLesson: LessonDefinition = {
  id: 'go-interfaces',
  moduleId: 'go',
  label: '1.2 接口与 nil',
  eyebrow: 'GO / INTERFACES',
  title: '指针是 nil，为什么接口不是？',
  shortTitle: '接口、方法集与 nil',
  path: '/learn/go-interfaces',
  description: [
    '用动态类型与动态值，解释 typed nil、断言和比较。',
    '区分“可以调用这个方法”与“这个类型实现了接口”。',
  ],
  minutes: 28,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    {
      id: 'contract',
      title: '接口描述能力，不描述继承',
      keywords: 'interface any 隐式实现 行为契约 io.Reader',
    },
    { id: 'nil', title: 'typed nil 的完整推理', keywords: 'nil error 动态类型 动态值 空接口' },
    { id: 'lab', title: '比较四种接口状态', keywords: '接口 nil 实验 比较 panic' },
    {
      id: 'methods',
      title: '方法集与可寻址调用',
      keywords: 'T *T 接收者 自动取地址 方法提升 嵌入',
    },
    {
      id: 'assertions',
      title: '断言与运行时比较',
      keywords: 'type switch assertion comma ok comparable',
    },
    { id: 'followups', title: '从语法能力到接口设计', keywords: 'itab 逃逸 去虚拟化 小接口 追问' },
    { id: 'sources', title: '记忆锚点与依据', keywords: '规范 版本 核验' },
  ],
  sources: [
    {
      title: 'Go 规范 · 接口类型',
      note: '接口类型、实现规则及接口的零值',
      url: 'https://go.dev/ref/spec#Interface_types',
    },
    {
      title: 'Go 规范 · 方法集',
      note: 'T、*T 与嵌入字段的方法集规则',
      url: 'https://go.dev/ref/spec#Method_sets',
    },
    {
      title: 'Go 规范 · 方法调用',
      note: '可寻址值的自动取地址是调用规则，不扩大 T 的方法集',
      url: 'https://go.dev/ref/spec#Calls',
    },
    {
      title: 'Go 规范 · 类型断言',
      note: '具体类型断言、接口断言与 comma-ok 形式',
      url: 'https://go.dev/ref/spec#Type_assertions',
    },
    {
      title: 'Go 规范 · 比较运算',
      note: '动态类型不可比较时的 panic 与 nil 比较例外',
      url: 'https://go.dev/ref/spec#Comparison_operators',
    },
    {
      title: 'Go FAQ · Why is my nil error value not equal to nil?',
      note: '有类型 nil 指针被装入 error 的典型问题',
      url: 'https://go.dev/doc/faq#nil_error',
    },
    {
      title: 'Go 1.27.1 · 接口 ABI 源码',
      note: '仅作为实现观察，不能替代语言语义',
      url: 'https://github.com/golang/go/blob/go1.27.1/src/internal/abi/iface.go',
    },
  ],
  Content: lazy(() => import('../lessons/go-interfaces.mdx')),
};

export const interfaceQuestions: Question[] = [
  {
    id: 'go-interface-typednil',
    lessonId: 'go-interfaces',
    title: '先看动态类型有没有消失',
    prompt:
      'var p *Fault = nil；*Fault 实现 error。执行 var err error = p 后，err == nil 的结果是什么？',
    options: [
      'true，因为底层指针就是 nil',
      'false，因为 err 的动态类型是 *Fault',
      '一定 panic，因为接口不能保存 nil 指针',
    ],
    answer: 1,
    explanations: [
      '比较的是接口是否为 nil，不是仅仅检查它保存的指针值。',
      '正确。err 保存了动态类型 *Fault 和 nil 指针值。返回无错误时应直接返回 nil。',
      '接口可以保存有类型的 nil 指针。是否调用方法会 panic，还要看接收者和方法体。',
    ],
    takeaway: 'typed nil 有类型，nil 接口没有动态类型。',
  },
  {
    id: 'go-interface-methodset',
    lessonId: 'go-interfaces',
    title: '能调用，不代表值类型实现接口',
    prompt:
      'Counter 的 Increment 方法使用 *Counter 接收者；变量 c 是可寻址的 Counter。c.Increment() 能调用，那么 var i interface{ Increment() } = c 能编译吗？',
    options: [
      '能，编译器会在接口赋值时也自动取地址',
      '不能，应该把 &c 赋给接口',
      '不能，因为 Go 不允许隐式实现接口',
    ],
    answer: 1,
    explanations: [
      '可寻址调用的自动取地址规则不等于在接口赋值时改写动态类型。',
      '正确。Counter 的方法集不含 *Counter 接收者的方法；*Counter 实现该接口。',
      'Go 恰恰允许隐式实现接口，只是不满足方法集要求时不能赋值。',
    ],
    takeaway: '调用语法的便利，不改变类型的方法集。',
  },
  {
    id: 'go-interface-compare',
    lessonId: 'go-interfaces',
    title: '接口比较也可能在运行时失败',
    prompt: 'var x any = []int(nil)。哪组结果正确？',
    options: [
      'x == nil 为 true；x == x 为 true',
      'x == nil 为 false；x == x 发生 panic',
      '两次比较都无法通过编译',
    ],
    answer: 1,
    explanations: [
      'x 已保存动态类型 []int，不是 nil 接口；切片也不能因为是 nil 就变成可自比较类型。',
      '正确。和 nil 比较可以判断接口是否为空；两个同动态类型的接口相比较时，会碰到 []int 不可比较的限制。',
      'any 在静态类型上可比较，危险来自运行时动态类型。',
    ],
    takeaway: '接口能写 ==，不等于所有动态值都能安全相等比较。',
  },
];

export const interfaceFollowups: FollowupItem[] = [
  {
    question: 'err != nil 之后，err.Error() 一定不会 panic 吗？',
    label: '动态值',
    answer:
      '不能这样保证。err 可能保存一个 nil 的 *Fault，接口不为 nil。指针接收者方法允许收到 nil，但如果方法体直接解引用它，就会 panic；如果方法显式处理 nil，则可以正常返回。接口满足签名不等于满足所有运行时前提。',
    deeper: '是不是在所有边界都用反射判断 IsNil 就好了？',
    point:
      '优先让生产者遵守契约：无错误就返回 nil。反射只适用于明确支持 nil 的种类，不能随意对任意值调用 IsNil。',
  },
  {
    question: '为什么 c.M() 可以，接口赋值却不可以？',
    label: '方法集',
    answer:
      '可寻址的 c 允许把 c.M() 按 (&c).M() 处理。这是一条调用规则。接口赋值检查的是 Counter 自己的方法集，不会因此把值偷偷变成 *Counter。map 索引结果不可寻址，也不能享受这种自动取地址调用。',
    deeper: '那把 T 嵌入另一个结构体，方法集会如何变化？',
    point: '区分嵌入 T 与嵌入 *T，再分别计算外层 S 与 *S 的提升方法集。',
  },
  {
    question: '接口调用一定会分配堆内存、一定比直接调用慢吗？',
    label: '实现',
    answer:
      '都不是语言保证。具体值转接口是否分配，受值的表示、生命周期、内联与逃逸分析影响。编译器也可能去虚拟化已知具体类型的调用。反过来，接口会遮蔽某些静态信息，也可能阻碍优化，必须在实际调用路径上测量。',
    deeper: '面试里说接口就是两个机器字，可以吗？',
    point:
      '先说动态类型和动态值的逻辑模型。字数与 itab 属于特定编译器 ABI 的实现观察，不代表所有可达内存占用。',
  },
  {
    question: '依赖已经是接口了，为什么还不好测试？',
    label: '工程设计',
    answer:
      '一个包含几十个方法的大接口仍然耦合了大量能力。通常在消费侧定义满足当前用例的小接口，更容易替换；但只有一种实现、没有替换需求时也不必为每个结构体机械地造接口。测试替身还必须遵守行为约定，而不仅仅匹配方法签名。',
    deeper: '什么时候反而会看到 *interface{} 这样的参数？',
    point:
      '当 API 需要替换调用方的接口变量时可能需要它，例如 json.Unmarshal(data, &v)。普通依赖传递通常直接使用接口值。',
  },
];
