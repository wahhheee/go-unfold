export const constraintTypes = [
  'int',
  'UserID',
  'string',
  '[]int',
  'any',
  'struct{ V any }',
  '*int',
] as const;
export const constraintCases = {
  exact: {
    label: 'int',
    accepted: [true, false, false, false, false, false, false],
    note: '精确的 int 类型项不包含定义类型 UserID；type UserID int 会建立新类型。',
  },
  underlying: {
    label: '~int',
    accepted: [true, true, false, false, false, false, false],
    note: '~int 接受底层类型为 int 的类型，包括 UserID。',
  },
  union: {
    label: '~int | ~string',
    accepted: [true, true, true, false, false, false, false],
    note: '联合接受两组类型。函数体只能使用对两组类型都合法的操作；+ 可以，位运算不行。',
  },
  comparable: {
    label: 'comparable',
    accepted: [true, true, true, false, true, true, true],
    note: 'Go 1.20 起 any 和含接口字段的可比较结构体也可满足该约束。接受不代表运行时比较不会 panic。',
  },
};
export type ConstraintChoice = keyof typeof constraintCases;
