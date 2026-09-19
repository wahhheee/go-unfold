export type ChannelState = {
  capacity: number;
  nil: boolean;
  buffer: number[];
  sender: number | null;
  receiver: boolean;
  closed: boolean;
  message: string;
};
export type ChannelAction =
  { type: 'send'; value: number } | { type: 'receive' } | { type: 'close' };
export function createChannel(capacity = 1, nil = false): ChannelState {
  return {
    capacity: nil ? 0 : capacity,
    nil,
    buffer: [],
    sender: null,
    receiver: false,
    closed: false,
    message: '通道已准备好。发送、接收与关闭由不同操作方推进。',
  };
}
export function channelStep(previous: ChannelState, action: ChannelAction): ChannelState {
  const state = { ...previous, buffer: [...previous.buffer] };
  if (action.type === 'close') {
    if (state.nil || state.closed) {
      state.message = `panic：${state.nil ? '不能关闭 nil channel' : '不能重复关闭 channel'}。`;
      return state;
    }
    state.closed = true;
    state.message =
      state.sender !== null
        ? '通道关闭：阻塞的发送会 panic；关闭不是让发送正常完成。'
        : state.receiver
          ? '通道关闭：等待的接收得到 0, ok=false。'
          : '通道关闭：已缓冲的值仍可接收，读空后才是 ok=false。';
    state.sender = null;
    state.receiver = false;
    return state;
  }
  if (action.type === 'send') {
    if (state.closed) {
      state.message = 'panic：向已关闭 channel 发送。';
      return state;
    }
    if (state.sender !== null) {
      state.message = '这个发送方仍在等待，尚不能执行下一次发送。';
      return state;
    }
    if (state.nil) {
      state.sender = action.value;
      state.message = '发送阻塞：nil channel 永远不会就绪。';
      return state;
    }
    if (state.receiver) {
      state.receiver = false;
      state.message = `完成交接：接收得到 ${action.value}, ok=true；发送可完成。`;
      return state;
    }
    if (state.buffer.length < state.capacity) {
      state.buffer.push(action.value);
      state.message = `${action.value} 进入缓冲区；发送完成不代表业务已处理。`;
      return state;
    }
    state.sender = action.value;
    state.message =
      state.capacity === 0 ? '发送阻塞：无缓冲通道需要接收方。' : '发送阻塞：缓冲区已满。';
    return state;
  }
  if (state.receiver) {
    state.message = '这个接收方仍在等待，尚不能发起下一次接收。';
    return state;
  }
  if (state.nil) {
    state.receiver = true;
    state.message = '接收阻塞：nil channel 永远不会就绪。';
    return state;
  }
  if (state.buffer.length) {
    const value = state.buffer.shift();
    state.message = `接收得到 ${value}, ok=true。`;
    if (state.sender !== null) {
      state.buffer.push(state.sender);
      state.sender = null;
      state.message += ' 空位让等待的发送进入缓冲区。';
    }
    return state;
  }
  if (state.sender !== null) {
    state.message = `完成交接：接收得到 ${state.sender}, ok=true；发送可完成。`;
    state.sender = null;
    return state;
  }
  if (state.closed) {
    state.message = '接收得到 0, ok=false：通道已关闭且已读空。';
    return state;
  }
  state.receiver = true;
  state.message = '接收阻塞：没有待接收的值。';
  return state;
}
