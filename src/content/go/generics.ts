import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const genericsLesson: LessonDefinition = {
  id: 'go-generics',
  moduleId: 'go',
  label: '1.3 泛型与约束',
  eyebrow: 'GO / GENERICS',
  title: '把类型留作参数，哪些操作还能成立？',
  shortTitle: '泛型、类型集与约束',
  path: '/learn/go-generics',
  description: [
    '从一份去重函数出发，理解约束到底承诺了什么。',
    '读懂类型集、comparable 的例外与 Go 1.27 的泛型方法。',
  ],
  minutes: 32,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'purpose', title: '为什么需要类型参数', keywords: '泛型 去重 类型安全 实例化 推断' },
    { id: 'sets', title: '约束是一组允许的类型', keywords: '~ 联合 交集 underlying 类型集' },
    { id: 'lab', title: '亲手筛选类型实参', keywords: 'comparable any 满足 实现 Go1.20' },
    { id: 'methods', title: '泛型方法的版本边界', keywords: 'Go1.27 泛型方法 接口 Go1.24 alias' },
    { id: 'design', title: '保留类型与选择抽象', keywords: '切片 S ~[]E 指针 方法集 性能' },
    { id: 'followups', title: '约束之后仍有哪些问题', keywords: '泛型 追问 零值 断言 性能' },
    { id: 'sources', title: '记忆锚点与依据', keywords: '版本 核验' },
  ],
  sources: [
    {
      title: 'Go 规范 · 类型约束',
      note: '允许的类型实参与可用操作',
      url: 'https://go.dev/ref/spec#Type_constraints',
    },
    {
      title: 'Go 规范 · 通用接口',
      note: '类型项、~、联合与交集；非基本接口只用作约束',
      url: 'https://go.dev/ref/spec#General_interfaces',
    },
    {
      title: 'Go 规范 · 满足约束',
      note: 'Go 1.20 起 comparable 的例外',
      url: 'https://go.dev/ref/spec#Satisfying_a_type_constraint',
    },
    {
      title: 'Go 规范 · 方法声明',
      note: 'Go 1.27 允许非接口方法声明独立类型参数',
      url: 'https://go.dev/ref/spec#Method_declarations',
    },
    {
      title: 'Go 规范 · 类型推断',
      note: '实例化与赋值上下文；泛型类型仍需类型实参',
      url: 'https://go.dev/ref/spec#Type_inference',
    },
    {
      title: 'Go 规范 · 类型别名',
      note: 'Go 1.24 支持泛型别名',
      url: 'https://go.dev/ref/spec#Alias_declarations',
    },
  ],
  Content: lazy(() => import('../lessons/go-generics.mdx')),
};
export const genericQuestions: Question[] = [
  {
    id: 'go-generic-tilde',
    lessonId: 'go-generics',
    title: '定义类型能不能进入集合',
    prompt: 'type UserID int。函数 F[T int](x T) 与 G[T ~int](x T)，哪个能接受 UserID 变量？',
    options: [
      '两个都可以，底层类型相同即可',
      '只有 G，~int 包含底层类型为 int 的定义类型',
      '两个都不可以，泛型只接受预声明类型',
    ],
    answer: 1,
    explanations: [
      '精确类型项 int 的集合里只有 int 本身，不自动包含所有定义类型。',
      '正确。~ 扩大为具有该底层类型的一组类型，不进行值转换。',
      '类型参数可以接受满足约束的定义类型；这正是 ~ 的常见用途。',
    ],
    takeaway: 'T 写身份，~T 写底层类型。',
  },
  {
    id: 'go-generic-comparable',
    lessonId: 'go-generics',
    title: '通过约束之后还会不会 panic',
    prompt:
      'Go 1.27：func Equal[T comparable](a,b T) bool { return a == b }。Equal[any]([]int{1}, []int{1}) 会怎样？',
    options: [
      '编译失败，any 永远不能满足 comparable',
      '返回 true，泛型会逐元素比较',
      '可以实例化，但运行时比较切片发生 panic',
    ],
    answer: 2,
    explanations: [
      'Go 1.20 起存在约束满足例外，普通接口 any 可以作为这个实参。',
      '== 不会因泛型而变成深度比较。',
      '正确。静态的约束满足不消除接口动态值不可比较的风险。',
    ],
    takeaway: 'comparable 允许 ==，接口实参仍有动态风险。',
  },
  {
    id: 'go-generic-method',
    lessonId: 'go-generics',
    title: '旧结论需要标注语言版本',
    prompt: '包使用 Go 1.27 语言语义。关于 func (b Box[T]) Map[U any](f func(T) U) U，哪项正确？',
    options: [
      '非接口方法可以声明独立类型参数 U，但不能据此让接口方法也声明类型参数',
      'Go 的所有版本都禁止方法有独立类型参数',
      '它会自动实现所有包含 Map(int) int 的接口',
    ],
    answer: 0,
    explanations: [
      '正确。Go 1.27 新增泛型方法；接口方法仍不能声明自己的类型参数。',
      '这是适用于较早版本的限制，不能继续当作当前通则。',
      '泛型方法本身不是实例化后的普通接口方法签名，不能自动满足这个接口。',
    ],
    takeaway: '1.27 有泛型方法；接口方法的限制仍在。',
  },
];
export const genericFollowups: FollowupItem[] = [
  {
    question: '约束是 any，为什么函数体不能随便做加法？',
    label: '允许的操作',
    answer:
      '函数体必须对约束允许的所有类型成立。any 包含不能相加的切片、结构体等类型，所以 x+y 不成立。约束 ~int|~string 的所有类型都支持 +，但并非都支持位运算；操作权限来自整个类型集。',
    deeper: '那 any(x).(int) 能恢复成整数吗？',
    point:
      '转换成普通接口后可以做运行时断言，但这引入动态分支和失败策略；对类型参数变量直接做类型断言不成立。',
  },
  {
    question: 'comparable 不是“可安全比较”的证明吗？',
    label: '版本边界',
    answer:
      '对严格可比较的具体类型，可以排除动态不可比较值造成的 panic。但 Go 1.20 之后 any 等普通接口也可满足约束，这些接口内部仍可能保存切片。因此实例化成功只保证泛型函数体可以写 ==，不保证每组输入都安全。NaN 还会让自比较为 false。',
    deeper: '把约束缩到 ~int|~string 会怎样？',
    point: '这组类型没有接口动态内容，也不会引入切片比较 panic；约束越精确，能承诺的行为越明确。',
  },
  {
    question: 'T 有指针接收者方法，new(T).M() 为什么不一定能编译？',
    label: '方法集',
    answer:
      '一个类型参数的约束方法集，并不自动成为 *T 的方法集。*T 是指向类型参数的指针类型，不能凭具体实例的直觉推导它的能力。可以让调用者传入已经构造好的满足接口的值；必要时使用第二个参数 PT interface{ *T; M() } 同时表达指针形状和方法要求。',
    deeper: '为什么不直接把整个 API 写成复杂约束？',
    point: '让约束复杂度服务真实复用需求；能用构造函数或小接口表达时，先评估调用方成本。',
  },
  {
    question: '泛型一定比接口更快吗？',
    label: '测量',
    answer:
      '不一定。语言规范不承诺单态化策略、字典传递方式、内联结果或分配次数。具体编译器可能共享代码，也可能优化接口调用。泛型主要提供静态类型关系与复用能力；性能要固定版本、输入、构建参数后测量。',
    deeper: '零值应该用 nil、T{} 还是 var zero T？',
    point:
      '对任意 T，var zero T 最通用。nil 仅适用于可为 nil 的类型，T{} 也要求约束支持该复合字面量形式。',
  },
];
