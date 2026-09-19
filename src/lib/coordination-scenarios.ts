import type { Scenario } from './scenarios';

export const coordinationScenarios: Scenario[] = [
  {
    id: 'waitgroup',
    label: 'WaitGroup：先登记，再等完成',
    frames: [
      {
        title: '调用方登记两个任务',
        note: 'wg.Go 将任务计入 WaitGroup，再启动对应的 goroutine。',
        lanes: [
          { label: '计数', value: '2' },
          { label: '结果', value: '尚未完成' },
        ],
      },
      {
        title: '调用方进入 Wait',
        note: '计数尚未为 0，Wait 等待这批已经登记的任务。',
        lanes: [
          { label: '调用方', value: '阻塞在 Wait' },
          { label: '任务 A/B', value: '各自工作' },
        ],
      },
      {
        title: '两个任务写入各自结果并返回',
        note: '回调返回时任务移出计数。独立结果位置避免任务之间抢写同一变量。',
        lanes: [
          { label: '计数', value: '2 → 1 → 0' },
          { label: '结果', value: 'A、B 都完成' },
        ],
      },
      {
        title: 'Wait 返回，开始汇总',
        note: '调用方现在可以读取完成结果；这不代表 WaitGroup 曾保护任务之间的共享写入。',
        lanes: [
          { label: '同步边界', value: '任务返回 → Wait 返回' },
          { label: '下一步', value: '读取与汇总结果' },
        ],
      },
    ],
  },
  {
    id: 'once',
    label: 'OnceValues：错误也会缓存',
    frames: [
      {
        title: '首次调用初始化闭包',
        note: '多个调用者共享同一闭包的执行状态。',
        lanes: [
          { label: '调用次数', value: '1' },
          { label: '实际初始化', value: '正在执行' },
        ],
      },
      {
        title: '第一次连接返回临时错误',
        note: 'OnceValues 缓存整组返回值，不检查 error 是否表示临时故障。',
        lanes: [
          { label: '缓存结果', value: 'nil, 连接失败' },
          { label: '初始化次数', value: '1' },
        ],
      },
      {
        title: '第二个调用者到达',
        note: '它直接取得缓存的错误，不会发起第二次连接。',
        lanes: [
          { label: '调用次数', value: '2' },
          { label: '初始化次数', value: '仍然是 1' },
        ],
      },
      {
        title: '服务恢复，也不会自动重试',
        note: '需要重试时，必须另设初始化状态与重试策略；Once 承诺执行一次，不承诺成功一次。',
        lanes: [
          { label: '远端状态', value: '已经恢复' },
          { label: '本地返回', value: '仍为首次错误' },
        ],
      },
    ],
  },
  {
    id: 'cond',
    label: 'Cond：两个等待者，一份数据',
    frames: [
      {
        title: '两个消费者都在等待',
        note: '二者持锁检查队列为空，再调用 Wait 释放锁并等待。',
        lanes: [
          { label: '队列', value: '空' },
          { label: 'G1 / G2', value: 'Wait 中，不持锁' },
        ],
      },
      {
        title: '生产者放入一个值并广播',
        note: 'Broadcast 唤醒两个等待者，但没有给每个人保留一份数据。',
        lanes: [
          { label: '队列', value: '[7]' },
          { label: 'G1 / G2', value: '重新竞争关联锁' },
        ],
      },
      {
        title: 'G1 先获得锁并消费',
        note: 'G1 取走 7，队列又变为空。G2 尚未从 Wait 返回。',
        lanes: [
          { label: '队列', value: '空' },
          { label: 'G1', value: '消费成功' },
          { label: 'G2', value: '等待重新获得锁' },
        ],
      },
      {
        title: 'G2 得到锁后重新检查条件',
        note: '条件已不成立，G2 再次 Wait。这不是无通知的虚假唤醒，而是通知后状态又变了。',
        lanes: [
          { label: '通知', value: '确实收到过 Broadcast' },
          { label: '条件', value: '队列现在仍为空' },
        ],
      },
    ],
  },
];
