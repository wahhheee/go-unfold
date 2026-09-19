import type { Scenario } from './scenarios';

export const groupScenarios: Scenario[] = [
  {
    id: 'leak',
    label: '下游提前返回，发送者留下',
    frames: [
      {
        title: '上游连续生成结果',
        note: '输出通道无缓冲，发送需要接收者配对。',
        lanes: [
          { label: '上游', value: '生成结果 1、2、3' },
          { label: '下游', value: '只需要一个结果' },
        ],
      },
      {
        title: '第一个结果交接完成',
        note: '这次发送返回，只证明结果 1 完成交接，不证明后续结果有人接收。',
        lanes: [
          { label: '上游', value: '准备发送结果 2' },
          { label: '下游', value: '已经找到答案' },
        ],
      },
      {
        title: '下游直接返回',
        note: '没有取消路径，上游仍尝试向输出发送。接收方也不能贸然 close 它。',
        lanes: [
          { label: '上游', value: '阻塞在发送结果 2' },
          { label: '下游', value: '已退出' },
        ],
      },
      {
        title: '请求结束，工作仍被遗留',
        note: '发送者不会因创建它的函数返回而自动结束。有限缓冲不能替代取消和等待。',
        lanes: [
          { label: '遗留状态', value: '发送者及其引用仍可能存活' },
          { label: '缺失协议', value: '通知退出 + 阻塞点出口 + 等待完成' },
        ],
      },
    ],
  },
  {
    id: 'joined',
    label: '错误触发取消，Wait 等待清理',
    frames: [
      {
        title: '两个任务进入同一个组',
        note: '调用方持有任务组并负责最终 Wait；任务接收派生 Context。',
        lanes: [
          { label: '任务 A', value: '查询依赖' },
          { label: '任务 B', value: '等待数据' },
        ],
      },
      {
        title: 'A 返回非 nil 错误',
        note: '组记录错误并取消派生 Context。取消不是强制终止 B。',
        lanes: [
          { label: '任务 A', value: '已返回' },
          { label: '任务 B', value: '观察到 Done 关闭' },
        ],
      },
      {
        title: 'B 处理退出和清理',
        note: 'Wait 仍在等待 B 返回，即使 A 的错误早已知道。',
        lanes: [
          { label: '任务 B', value: '清理资源中' },
          { label: 'Wait', value: '尚未返回' },
        ],
      },
      {
        title: '全部任务返回后交还控制权',
        note: 'Wait 返回被组记录的首个错误；如果 B 不退出，等待就不会凭取消自动结束。',
        lanes: [
          { label: '任务组', value: '全部已启动任务结束' },
          { label: '调用方', value: '收到错误并继续处理' },
        ],
      },
    ],
  },
  {
    id: 'success',
    label: '成功 Wait 也取消派生 Context',
    frames: [
      {
        title: '创建组与派生 Context',
        note: '派生 Context 的生命周期属于这组任务。',
        lanes: [
          { label: '父请求', value: '仍有效' },
          { label: '派生 Context', value: '仍有效' },
        ],
      },
      {
        title: '所有任务返回 nil',
        note: '没有任务提交错误，组的结果可以是成功。',
        lanes: [
          { label: '任务结果', value: '全部成功' },
          { label: '等待者', value: '准备收尾' },
        ],
      },
      {
        title: 'Wait 返回 nil',
        note: 'WithContext 的契约同时取消派生 Context，并不要求任务失败。',
        lanes: [
          { label: 'Wait 结果', value: 'nil' },
          { label: '派生 Err()', value: 'context.Canceled' },
        ],
      },
      {
        title: '后续工作需要自己的适当上下文',
        note: '不能复用已经取消的组 Context 发起下一段工作。父 Context 是否有效要另行判断。',
        lanes: [
          { label: '父请求', value: '可能仍有效' },
          { label: '后续调用', value: '使用正确的父 Context 或新预算' },
        ],
      },
    ],
  },
  {
    id: 'singleflight',
    label: '一个等待者取消，另一人仍需结果',
    frames: [
      {
        title: 'A、B 请求相同 key',
        note: '共享工作使用服务管理的独立预算；两个等待者各自保留请求 Context。',
        lanes: [
          { label: '共享回源', value: '执行一次' },
          { label: '等待者', value: 'A 与 B' },
        ],
      },
      {
        title: 'A 的请求被取消',
        note: 'A 从自己的等待 select 中返回，不自动取消整个共享回源。',
        lanes: [
          { label: 'A', value: '放弃等待' },
          { label: 'B', value: '仍需要结果' },
        ],
      },
      {
        title: '共享回源完成',
        note: 'DoChan 的单个结果可以投递到各自的缓冲通道，A 不接收也不会要求 B 一起失败。',
        lanes: [
          { label: 'B', value: '取得结果' },
          { label: '共享结果', value: '按不可变协议使用' },
        ],
      },
      {
        title: '稍后 C 发起同 key 请求',
        note: '上一轮已不在执行，C 可以触发新一轮计算。singleflight 不是结果缓存。',
        lanes: [
          { label: 'C', value: '新的在途调用' },
          { label: '缓存策略', value: '需要单独设计' },
        ],
      },
    ],
  },
];
