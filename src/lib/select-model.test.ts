import { expect, it } from 'vitest';
import { selectCandidates } from './select-model';
it('取消与数据都就绪时没有隐藏优先级', () => {
  expect(selectCandidates('value', true, true).map((x) => x.id)).toEqual(['data', 'cancel']);
});
it('nil 不就绪，default 只在无就绪通信时出现', () => {
  expect(selectCandidates('nil', false, false)).toEqual([]);
  expect(selectCandidates('nil', false, true).map((x) => x.id)).toEqual(['default']);
  expect(selectCandidates('empty', true, true).map((x) => x.id)).toEqual(['cancel']);
});
it('关闭接收一直就绪，关闭发送也是可能被选中的失败分支', () => {
  expect(selectCandidates('closed', false, true)[0].result).toContain('ok=false');
  expect(selectCandidates('closed-send', true, false)).toHaveLength(2);
  expect(selectCandidates('closed-send', false, false)[0].result).toContain('panic');
});
