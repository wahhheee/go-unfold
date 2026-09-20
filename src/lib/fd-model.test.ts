import { expect, it } from 'vitest';
import { fdStep, newFd } from './fd-model';
it('dup 与 fork 共享打开描述，重新 open 偏移独立', () => {
  let s = fdStep(newFd(), 'dup', '父进程', 3);
  s = fdStep(s, 'fork', '父进程', 3);
  s = fdStep(s, 'read', '子进程', 4);
  expect(s.descriptions).toEqual([{ id: 1, offset: 2 }]);
  s = fdStep(s, 'open', '父进程', 3);
  expect(s.descriptions).toEqual([
    { id: 1, offset: 2 },
    { id: 2, offset: 0 },
  ]);
});
it('关闭不破坏其他引用，最后关闭释放描述，fd 编号可再用', () => {
  let s = fdStep(newFd(), 'fork', '父进程', 3);
  s = fdStep(s, 'close', '父进程', 3);
  expect(s.descriptions).toHaveLength(1);
  s = fdStep(s, 'read', '子进程', 3);
  expect(s.message).toContain('AB');
  s = fdStep(s, 'close', '子进程', 3);
  expect(s.descriptions).toEqual([]);
  s = fdStep(s, 'open', '父进程', -1);
  expect(s.fds[0]).toEqual({ process: '父进程', fd: 3, description: 2 });
});
