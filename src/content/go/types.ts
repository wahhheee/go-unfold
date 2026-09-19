import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';

export const typesLesson: LessonDefinition = {
  id: 'go-values',
  moduleId: 'go',
  label: '1.1 值与类型',
  eyebrow: 'GO / VALUES & TYPES',
  title: '值被复制了，为什么数据还是变了？',
  shortTitle: '值、类型与内存布局',
  path: '/learn/go-values',
  description: [
    '从一次结构体赋值出发，分清变量、值与被指向的数据。',
    '把类型约束、零值和内存布局，放回它们真正适用的边界里。',
  ],
  minutes: 28,
  labCount: 1,
  verifiedAt: '2026-09-19',
  intro: {
    title: '本节先建立一个可靠起点：Go 的赋值和传参复制值。',
    body: '复制指针值，不会自动复制指针指向的对象。',
  },
  sections: [
    { id: 'copy', title: '变量、值与可达对象', keywords: '值传递 指针 结构体 深拷贝 浅拷贝' },
    { id: 'lab', title: '亲手改变副本', keywords: '值复制 实验 指针 引用' },
    { id: 'types', title: '定义类型与类型别名', keywords: 'underlying type alias 常量 转换 溢出' },
    { id: 'zero', title: '零值、new 与 make', keywords: 'Go1.26 new 表达式 栈 堆 nil' },
    {
      id: 'layout',
      title: '对齐与布局的边界',
      keywords: 'unsafe Sizeof Alignof padding struct amd64',
    },
    { id: 'scope', title: '作用域与循环变量', keywords: 'Go1.22 loopvar shadow 短变量声明' },
    { id: 'followups', title: '从值语义到工程取舍', keywords: '接收者 mutex 拷贝 面试 追问' },
    { id: 'sources', title: '记忆锚点与依据', keywords: '规范 版本 核验' },
  ],
  sources: [
    {
      title: 'Go 规范 · 赋值与调用',
      note: '参数值赋给新的形参变量；赋值不会深拷贝可达对象',
      url: 'https://go.dev/ref/spec#Assignment_statements',
    },
    {
      title: 'Go 规范 · 类型身份与可赋值性',
      note: '定义类型、别名、底层类型与无类型常量的规则',
      url: 'https://go.dev/ref/spec#Type_identity',
    },
    {
      title: 'Go 规范 · 分配',
      note: 'new 的类型参数与表达式参数形式',
      url: 'https://go.dev/ref/spec#Allocation',
    },
    {
      title: 'Go 1.26 发布说明',
      note: 'new 支持表达式，不再只接受类型',
      url: 'https://go.dev/doc/go1.26#language',
    },
    {
      title: 'Go 规范 · 大小与对齐',
      note: 'Sizeof 计算值本身，不包含通过引用可达的数据',
      url: 'https://go.dev/ref/spec#Size_and_alignment_guarantees',
    },
    {
      title: 'Go 1.22 发布说明',
      note: '使用声明形式的循环变量每次迭代有独立变量，注意模块语言版本',
      url: 'https://go.dev/doc/go1.22#language',
    },
  ],
  Content: lazy(() => import('../lessons/go-values.mdx')),
};

export const typesQuestions: Question[] = [
  {
    id: 'go-values-copy',
    lessonId: 'go-values',
    title: '结构体复制之后',
    prompt:
      'b = a 后，b.Score = 99，*b.Age = 30。a.Score 初始为 10，a.Age 指向 20。没有其他并发操作，a 里读到什么？',
    options: ['Score=99，年龄=30', 'Score=10，年龄=30', 'Score=10，年龄=20'],
    answer: 1,
    explanations: [
      'Score 是独立的值字段，改副本不改原字段。指针字段才让两份值连接到同一对象。',
      '正确。Score 字段被复制；Age 的指针值也被复制，两份指针仍指向同一年龄变量。',
      '只有显式复制 Age 指向的数据并改变副本指针，才可能得到互不影响的两个年龄单元。',
    ],
    takeaway: '复制值，不等于递归复制可达对象。',
  },
  {
    id: 'go-types-alias',
    lessonId: 'go-values',
    title: '两种 type 声明，不是一回事',
    prompt:
      'type UserID int64；type LegacyID = UserID。变量 u 为 UserID，变量 n 为 int64。以下哪项成立？',
    options: [
      'u = n 可以直接编译，因为底层类型相同',
      'LegacyID 和 UserID 是同一类型，n 赋给 u 通常需要 UserID(n)',
      'UserID(n) 会自动检查 n 是否是合法业务 ID',
    ],
    answer: 1,
    explanations: [
      '这里两边都是不同的命名类型，不会仅凭底层类型相同就隐式赋值。',
      '正确。别名只是同一类型的另一个名字；定义类型则建立新的类型身份。这里的整数转换也不替你检查业务规则。',
      '类型转换不是业务校验器。负数、零值或不存在的 ID 都需要另行验证。',
    ],
    takeaway: 'type T U 建立身份；type T = U 建立别名。',
  },
  {
    id: 'go-layout-size',
    lessonId: 'go-values',
    title: 'Sizeof 到底量了什么',
    prompt:
      '结构体中有一个指向 10 MiB 数据的指针。unsafe.Sizeof(这个结构体) 会把这 10 MiB 也算进去吗？',
    options: [
      '会，它测的是总内存占用',
      '不会，它只包含结构体本身的字段与必要填充',
      '只有数据分配在堆上时才会算进去',
    ],
    answer: 1,
    explanations: [
      'Sizeof 不是对象图的递归统计器，也不是进程内存观测工具。',
      '正确。指针字段本身参与大小计算，但指针所指向的数据不包含在返回值里。',
      'Sizeof 与对象在栈上还是堆上没有这种条件关系；可达数据始终不能通过这一调用递归统计。',
    ],
    takeaway: 'Sizeof 测值本身，内存画像看可达对象与分配。',
  },
  {
    id: 'go-loop-version',
    lessonId: 'go-values',
    title: '循环变量的新规则有前提',
    prompt:
      '包采用 Go 1.27 语言语义，var i int；for i = 0; i < 3; i++ { ps = append(ps, &i) }。循环结束后，解引用 ps 中的三个指针得到什么？',
    options: [
      '0、1、2，因为新版 Go 所有循环都创建新变量',
      '3、3、3，因为这里是给已声明的 i 赋值',
      '结果不确定，因为运行时会随机分配栈地址',
    ],
    answer: 1,
    explanations: [
      'Go 1.22 的变化针对循环声明变量的情形，例如 for i := ...。这里使用的是 =。',
      '正确。循环反复使用同一个 i，三个指针都指向它；循环结束时 i 已经递增到 3。',
      '这段代码没有并发竞争，变量身份由语言语义决定，不由随机栈地址决定。',
    ],
    takeaway: '循环中 := 声明新变量与 = 复用旧变量，要分开判断。',
  },
];

export const typesFollowups: FollowupItem[] = [
  {
    question: 'Go 到底有没有“引用传递”？',
    label: '语义',
    answer:
      'Go 传参按值传递。传入指针时，形参得到指针值的副本；它可以修改共同指向的对象，却不能只靠重新赋值形参指针就改变调用方保存的指针。切片和 map 的行为也要分析复制了什么、共享了什么，而不是另造一套传参规则。',
    deeper: '怎样让函数把调用方的指针换成另一个对象？',
    point: '返回新指针让调用方赋值，或显式传入指针的指针；不要混淆改指针与改对象。',
  },
  {
    question: '指针接收者一定比值接收者快吗？',
    label: '性能与正确性',
    answer:
      '不一定。指针避免复制较大的值，但可能引入共享、别名分析成本或逃逸。值接收者也可能被内联优化。是否需要修改原对象、是否包含不允许复制的锁、方法集是否匹配，都是先于微小性能差异的约束。',
    deeper: '结构体里嵌了 sync.Mutex，还能随便按值返回吗？',
    point: '使用后的 Mutex 不得复制。把正确性约束说清，再用基准与逃逸报告评估性能。',
  },
  {
    question: '把字段按大小排序，能当作通用优化吗？',
    label: '表示与兼容',
    answer:
      '调整字段顺序在某些架构上能减少填充，但效果要实测；它会影响无键字段的复合字面量、反射字段顺序和依赖布局的 unsafe/外部接口。减少几字节也不保证减少实际分配档位，更不等于端到端变快。',
    deeper: '结构体大小变小了，为什么堆内存可能没明显下降？',
    point: '分配器有尺寸分级，实际保留对象数与可达数据也会主导内存占用。',
  },
  {
    question: '拿到局部变量的地址，它是不是一定逃逸？',
    label: '规范与编译器',
    answer:
      '不会仅因为取地址就必然逃逸。规范保证对象活得足够久，不规定必须分配在栈还是堆。编译器根据指针是否可能被当前栈帧之外使用、内联和其他约束决定分配位置；返回局部地址也是合法 Go。',
    deeper: '为什么同一段代码加了 fmt.Println 后，逃逸报告就变了？',
    point: '调用路径影响分析结果。固定构建条件查看 -gcflags=-m=2，不把一次观察背成语言定律。',
  },
];
