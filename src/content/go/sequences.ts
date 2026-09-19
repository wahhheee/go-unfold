import { lazy } from 'react';
import type { LessonDefinition } from '../lessons';
import type { Question } from '../questions';
import type { FollowupItem } from '../../components/Followups';
export const sequencesLesson: LessonDefinition = {
  id: 'go-sequences',
  moduleId: 'go',
  label: '1.4 切片与字符串',
  eyebrow: 'GO / SEQUENCES',
  title: 'append 之后，谁还在共享那块内存？',
  shortTitle: '数组、切片与字符串',
  path: '/learn/go-sequences',
  description: [
    '把长度、容量和底层数组分开看，才能推理一次 append。',
    '再用字节、码点与可达性，解释字符串和内存保留。',
  ],
  minutes: 34,
  labCount: 1,
  verifiedAt: '2026-09-19',
  sections: [
    { id: 'arrays', title: '数组值与切片视图', keywords: '数组 长度 类型 值复制 slice header' },
    { id: 'lab', title: '逐步执行 append', keywords: '容量 共享 切片 实验 full slice' },
    {
      id: 'ownership',
      title: '容量边界不是所有权边界',
      keywords: 'Clip Clone Delete copy 内存保留 nil JSON',
    },
    { id: 'strings', title: '字节、rune 与用户字符', keywords: 'UTF8 Unicode 字符串 RuneError' },
    { id: 'followups', title: '从语义追到工程边界', keywords: '切片 追问 并发 copy range' },
    { id: 'sources', title: '记忆锚点与依据', keywords: '版本 核验' },
  ],
  sources: [
    {
      title: 'Go 规范 · 数组、切片与字符串类型',
      note: '数组长度属于类型；字符串是不可变的字节序列',
      url: 'https://go.dev/ref/spec#Types',
    },
    {
      title: 'Go 规范 · 切片表达式',
      note: '二下标、三下标与容量边界',
      url: 'https://go.dev/ref/spec#Slice_expressions',
    },
    {
      title: 'Go 规范 · append 与 copy',
      note: '底层数组复用与重叠复制规则',
      url: 'https://go.dev/ref/spec#Appending_and_copying_slices',
    },
    {
      title: 'Go 规范 · range',
      note: '数组与切片遍历、字符串解码及错误处理',
      url: 'https://go.dev/ref/spec#For_range',
    },
    {
      title: '标准库 slices',
      note: 'Clone 是浅复制，Clip 不分配，Delete 清零废弃尾部',
      url: 'https://pkg.go.dev/slices',
    },
    {
      title: '标准库 unicode/utf8',
      note: 'RuneCount、ValidString 与 RuneError',
      url: 'https://pkg.go.dev/unicode/utf8',
    },
    {
      title: '标准库 strings.Clone',
      note: '为子串显式建立独立副本',
      url: 'https://pkg.go.dev/strings#Clone',
    },
    {
      title: '标准库 encoding/json',
      note: '默认编码 nil 切片、空切片与 []byte 的差异',
      url: 'https://pkg.go.dev/encoding/json#Marshal',
    },
  ],
  Content: lazy(() => import('../lessons/go-sequences.mdx')),
};
export const sequenceQuestions: Question[] = [
  {
    id: 'go-slice-append',
    lessonId: 'go-sequences',
    title: '长度没有变，数组却变了',
    prompt:
      'base := []int{10,20,30,40}; a := base[:2]; b := append(a,99)。此时 a、base 分别是什么？',
    options: [
      'a=[10 20 99]，base=[10 20 99 40]',
      'a=[10 20]，base=[10 20 99 40]',
      'a=[10 20]，base=[10 20 30 40]',
    ],
    answer: 1,
    explanations: [
      'append 返回新切片值，不会改写变量 a 的长度。',
      '正确。容量足够，append 复用数组；a 的描述符仍保持长度 2。',
      '容量足够时复用原数组，原数组的第三个元素会被覆盖。',
    ],
    takeaway: 'append 改共享元素，返回新长度；别把两件事合并。',
  },
  {
    id: 'go-slice-clip',
    lessonId: 'go-sequences',
    title: '容量缩小不等于释放数组',
    prompt: '小切片 s 引用一个大数组。t := slices.Clip(s) 能保证大数组被回收吗？',
    options: [
      '能，因为 cap(t)==len(t)',
      '不能，Clip 只限制容量，t 仍引用原数组',
      '能，只要随后手动调用 runtime.GC()',
    ],
    answer: 1,
    explanations: [
      '容量是切片边界，GC 可达性是另一个问题。',
      '正确。需要独立复制所需元素，并释放其他引用；何时回收仍由运行时决定。',
      '仍然可达的对象不能靠强制 GC 变成垃圾。',
    ],
    takeaway: 'Clip 限追加，Clone 分元素；回收看可达。',
  },
  {
    id: 'go-string-unicode',
    lessonId: 'go-sequences',
    title: '两个“长度”都要说清单位',
    prompt: 's := "Go中"。len(s) 与 utf8.RuneCountInString(s) 分别是多少？',
    options: ['3 和 3', '5 和 3', '5 和 5'],
    answer: 1,
    explanations: [
      'len 返回字节数，“中”在 UTF-8 中占 3 个字节。',
      '正确。两个 ASCII 字节加三个中文字节；码点数量为 3，但码点也不总等于用户感知字符。',
      'RuneCount 按 UTF-8 解码后的码点计数，不是计字节。',
    ],
    takeaway: 'len 数字节，rune 数码点，用户字符还需分段规则。',
  },
  {
    id: 'go-slice-nil',
    lessonId: 'go-sequences',
    title: '空与 nil 的接口语义',
    prompt:
      '使用标准库 encoding/json 的默认 Marshal，不含 omitempty 等字段选项。var a []int 与 b := []int{} 分别编码成什么？',
    options: ['都编码为 []', 'null 与 []', 'null 与 null'],
    answer: 1,
    explanations: [
      '两者 len 都为 0，但 nilness 不同，JSON 默认编码会区分。',
      '正确。具体 API 要决定空集合与缺省值的契约；[]byte 另有 base64 编码规则。',
      '非 nil 空 []int 编码为空数组。',
    ],
    takeaway: '相同长度不代表相同边界语义。',
  },
];
export const sequenceFollowups: FollowupItem[] = [
  {
    question: '切片扩容是小于 1024 翻倍，之后 1.25 倍吗？',
    label: '实现版本',
    answer:
      '不能当作当前通则。容量不足时必须拿到足够的存储，但精确新容量不是语言规范。当前运行时有分段增长策略，并受追加数量、元素尺寸、对齐和分配器尺寸分级影响；大批量 append 更不能机械套倍率。',
    deeper: '那预分配是不是越多越快？',
    point:
      '先按有依据的数量估计，避免反复增长；过度预分配会增加保留内存，指针元素还可能增加扫描负担。用真实负载验证。',
  },
  {
    question: '把一个小切片传给函数，三下标能保证函数改不了原数据吗？',
    label: '所有权',
    answer:
      '不能。s[:len(s):len(s)] 只阻止追加复用长度之外的容量。函数仍能直接修改已有的 s[0]；元素中若有指针，也能修改共同指向的对象。隔离已有元素需要复制，隔离对象图需要按业务定义更深的复制。',
    deeper: '两个 goroutine 分别 append 自己的切片副本，会有竞争吗？',
    point:
      '可能共享数组并写到相同位置。复制描述符不是同步机制；先划清可写区域和所有权，再使用同步。',
  },
  {
    question: '删除元素后内存为什么还降不下来？',
    label: '可达性',
    answer:
      '手写 append(s[:i],s[j:]...) 会移动元素，但尾部旧指针可能仍留在底层数组。Go 1.22 起 slices.Delete 等相关函数会清零废弃尾部。仍需接住返回的切片，并处理其他别名；即便对象已不再可达，GC 和向操作系统归还内存也不保证立即发生。',
    deeper: 'clear(s) 会释放数组吗？',
    point: 'clear 把当前长度内元素设为零值，不改变 len/cap，也不解除切片对数组的引用。',
  },
  {
    question: 'string 转 []byte 就一定分配吗？',
    label: '语义与优化',
    answer:
      '语言层面，正常转换得到可独立修改的字节切片，不能借它修改原字符串。但编译器可以在证明安全的只读使用场景中消除实际复制或分配；反向转换也存在优化。不要把某次分配结果当作语言规则，也不要为了省一次拷贝就让 unsafe 破坏字符串不可变性。',
    deeper: 'range 字符串每次下标加一吗？',
    point: '下标是起始字节位置，步长由 UTF-8 解码宽度决定；非法编码产生 RuneError 并前进一个字节。',
  },
];
