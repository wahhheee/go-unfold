import type { Scenario, ScenarioFrame } from './scenarios';
function frame(
  title: string,
  note: string,
  value: string,
  stack: string,
  output: string,
): ScenarioFrame {
  return {
    title,
    note,
    lanes: [
      { label: '当前值', value },
      { label: '待执行', value: stack },
      { label: '输出', value: output },
    ],
  };
}
export const deferScenarios: Scenario[] = [
  {
    id: 'arguments',
    label: '实参快照与闭包读取',
    frames: [
      frame('x 初始化为 1', '此时还没有注册 defer。', 'x = 1', '无', '无'),
      frame(
        '登记带实参的调用',
        'defer fmt.Println("arg", x) 现在求值并保存参数 x=1。',
        'x = 1',
        'Println(arg, 1)',
        '无',
      ),
      frame(
        '登记闭包',
        '闭包执行时才读取 x。后注册的调用会先执行。',
        'x = 1',
        '闭包 → Println(arg, 1)',
        '无',
      ),
      frame(
        '把 x 改为 2',
        '保存过的实参不会变化；闭包将来读取的变量已经变化。',
        'x = 2',
        '闭包 → Println(arg, 1)',
        '无',
      ),
      frame(
        '函数退出，先调用闭包',
        '闭包读取当前 x，因此输出 closure 2。',
        'x = 2',
        'Println(arg, 1)',
        'closure 2',
      ),
      frame(
        '再执行保存了实参的调用',
        '实参仍为登记时的 1。执行顺序与登记顺序相反。',
        'x = 2',
        '无',
        'closure 2；arg 1',
      ),
    ],
  },
  {
    id: 'result',
    label: '命名返回值的最后修改',
    frames: [
      frame('返回变量初始化', 'func result() (n int) 的 n 起初为零值。', 'n = 0', '无', '尚未返回'),
      frame('登记 n++ 的闭包', '这个闭包稍后可以修改同一个返回变量。', 'n = 0', 'n++', '尚未返回'),
      frame(
        '执行 return 5 的赋值阶段',
        '先把返回表达式的结果赋给 n，尚未回到调用方。',
        'n = 5',
        'n++',
        '尚未返回',
      ),
      frame('执行 defer', '闭包把返回变量从 5 改成 6。', 'n = 6', '无', '尚未返回'),
      frame('回到调用者', '调用者拿到最终返回值 6。', 'n = 6', '无', '返回 6'),
    ],
  },
];
