import { expect, it } from 'vitest';
import { createChannel, channelStep } from './channel-machine';
it('关闭后先读缓冲值，零值也能有 ok=true', () => {
  let state = channelStep(createChannel(), { type: 'send', value: 0 });
  state = channelStep(state, { type: 'close' });
  state = channelStep(state, { type: 'receive' });
  expect(state.message).toContain('0, ok=true');
  state = channelStep(state, { type: 'receive' });
  expect(state.message).toContain('ok=false');
  expect(channelStep(state, { type: 'send', value: 7 }).message).toContain('panic');
  expect(channelStep(state, { type: 'close' }).message).toContain('panic');
});
it('无缓冲交接与满缓冲发送保留待发送值', () => {
  let state = channelStep(createChannel(0), { type: 'send', value: 7 });
  expect(state.sender).toBe(7);
  state = channelStep(state, { type: 'receive' });
  expect(state.sender).toBeNull();
  expect(state.message).toContain('7, ok=true');
  state = channelStep(createChannel(1), { type: 'send', value: 1 });
  state = channelStep(state, { type: 'send', value: 2 });
  state = channelStep(state, { type: 'receive' });
  expect(state.buffer).toEqual([2]);
  expect(state.sender).toBeNull();
});
it('nil 上两个等待者也不配对，关闭只报告错误', () => {
  let state = channelStep(createChannel(0, true), { type: 'send', value: 7 });
  state = channelStep(state, { type: 'receive' });
  expect(state.sender).toBe(7);
  expect(state.receiver).toBe(true);
  state = channelStep(state, { type: 'close' });
  expect(state.closed).toBe(false);
  expect(state.message).toContain('panic');
});
it('关闭唤醒接收者，但令阻塞发送失败', () => {
  const receiving = channelStep(createChannel(0), { type: 'receive' });
  expect(channelStep(receiving, { type: 'close' })).toMatchObject({
    receiver: false,
    closed: true,
  });
  const sending = channelStep(createChannel(0), { type: 'send', value: 7 });
  expect(channelStep(sending, { type: 'close' }).message).toContain('发送会 panic');
});
