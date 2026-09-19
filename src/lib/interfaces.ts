export const interfaceCases = {
  nil: {
    label: '没有赋值的 any',
    type: '无动态类型',
    value: '无动态值',
    equalNil: 'true',
    equalSelf: 'true',
    reason: '接口没有动态类型，才是 nil 接口。',
  },
  pointer: {
    label: '装入 (*Fault)(nil)',
    type: '*Fault',
    value: 'nil 指针',
    equalNil: 'false',
    equalSelf: 'true',
    reason: '动态类型已经是 *Fault。指针可比较，即使指针值是 nil，整个接口也不是 nil。',
  },
  slice: {
    label: '装入 []int(nil)',
    type: '[]int',
    value: 'nil 切片',
    equalNil: 'false',
    equalSelf: 'panic',
    reason:
      '接口与 nil 比较不会深入比较切片；接口与自身比较时，动态类型 []int 不可比较，发生 panic。',
  },
  integer: {
    label: '装入 int(0)',
    type: 'int',
    value: '0',
    equalNil: 'false',
    equalSelf: 'true',
    reason: '零值不是 nil。整数 0 有动态类型 int，并且可以比较。',
  },
};
