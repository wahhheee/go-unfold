import type { Scenario } from './scenarios';

export const mutexScenarios: Scenario[] = [
  {
    id: 'split',
    label: '分开加锁：仍然超卖',
    frames: [
      {
        title: '只剩一件，两个请求到达',
        note: '两个 G 的每次读写都使用同一把锁，但一次预订被拆成了两个临界区。',
        lanes: [
          { label: '库存', value: '1' },
          { label: 'G1 / G2', value: '准备检查' },
        ],
      },
      {
        title: 'G1 检查后解锁',
        note: 'G1 读到 1，记住“可以扣减”。解锁后，这个判断不再获得保护。',
        lanes: [
          { label: '库存', value: '1' },
          { label: 'G1', value: '判断通过，未扣减' },
          { label: '锁', value: '空闲' },
        ],
      },
      {
        title: 'G2 也检查通过',
        note: 'G2 在自己的读临界区里同样看到 1。两次检查没有发生数据竞争。',
        lanes: [
          { label: '库存', value: '1' },
          { label: 'G1 / G2', value: '都认为可以扣减' },
        ],
      },
      {
        title: '两次扣减依次执行',
        note: '库存变为 -1：race 可以不报警，业务不变量却已经被打破。',
        lanes: [
          { label: '库存', value: '1 → 0 → -1' },
          { label: '结果', value: '两笔预订成功，超卖' },
        ],
      },
    ],
  },
  {
    id: 'whole',
    label: '完整临界区：检查并扣减',
    frames: [
      {
        title: '同一初始状态，改变保护范围',
        note: '一次预订持锁完成“检查 + 扣减”，没有中间解锁窗口。',
        lanes: [
          { label: '库存', value: '1' },
          { label: 'G1 / G2', value: '准备预订' },
        ],
      },
      {
        title: 'G1 持锁检查并扣减',
        note: 'G2 在 Lock 等待，不能在 G1 检查与扣减之间进入。',
        lanes: [
          { label: '库存', value: '1 → 0' },
          { label: 'G1', value: '预订成功' },
          { label: 'G2', value: '等待同一把锁' },
        ],
      },
      {
        title: '解锁后 G2 才检查',
        note: 'G2 看到最新库存 0，返回不足，不执行扣减。',
        lanes: [
          { label: '库存', value: '0' },
          { label: 'G2', value: '预订失败' },
        ],
      },
      {
        title: '业务关系保持成立',
        note: '无论谁先拿到锁，这个模型都只允许一笔成功：库存不会为负。',
        lanes: [
          { label: '成功数', value: '1' },
          { label: '保护对象', value: '检查与扣减的整体关系' },
        ],
      },
    ],
  },
  {
    id: 'recursive',
    label: '递归读锁：等待写者形成环',
    frames: [
      {
        title: 'G1 已持有一层读锁',
        note: 'RWMutex 允许并发读者，但不记录某个读者来自哪个 goroutine。',
        lanes: [
          { label: 'G1', value: '持有 RLock' },
          { label: 'G2', value: '尚未请求写锁' },
        ],
      },
      {
        title: 'G2 请求写锁',
        note: 'G2 等已有读者退出。从此新来的 RLock 会等待这个写者。',
        lanes: [
          { label: 'G1', value: '继续持有读锁' },
          { label: 'G2', value: '等待 G1 的 RUnlock' },
        ],
      },
      {
        title: 'G1 调用内部函数再次 RLock',
        note: '第二层 RLock 被等待的写者挡住，G1 无法运行到外层 RUnlock。',
        lanes: [
          { label: 'G1 等待', value: 'G2 写锁完成' },
          { label: 'G2 等待', value: 'G1 释放旧读锁' },
        ],
      },
      {
        title: '互相等待，谁都不能推进',
        note: '修复调用协议：让内部函数明确要求调用者已持锁，避免重复获取；不能依赖测试时恰好没有写者。',
        lanes: [
          { label: '等待环', value: 'G1 → G2 → G1' },
          { label: '结论', value: '读锁不能递归使用' },
        ],
      },
    ],
  },
];
