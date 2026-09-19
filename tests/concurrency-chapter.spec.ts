import { expect, test } from '@playwright/test';

test('锁时间线：完整临界区与递归读锁等待环', async ({ page }) => {
  await page.goto('/learn/concurrency-mutex#lab');
  const lab = page.getByRole('region', { name: '临界区与等待环实验' });
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.getByRole('status')).toContainText('库存变为 -1');
  await lab.getByRole('combobox').selectOption('whole');
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.getByRole('status')).toContainText('只允许一笔成功');
  await lab.getByRole('combobox').selectOption('recursive');
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.locator('.scenario-lanes')).toContainText('G1 → G2 → G1');
  await lab.getByRole('button', { name: '重新播放' }).click();
  await expect(lab.locator('.live-label')).toHaveText('1 / 4');
});

test('select 实验：取消不优先，default 只处理无就绪状态', async ({ page }) => {
  await page.goto('/learn/concurrency-select#lab');
  const lab = page.getByRole('region', { name: 'select 就绪集合实验' });
  await expect(lab.locator('.select-candidates')).toContainText('2 个分支');
  await lab.getByRole('button', { name: '推演一次选择' }).click();
  await expect(lab.getByRole('status')).toContainText('取消不自动优先');
  await lab.getByRole('combobox').selectOption('nil');
  await lab.getByRole('checkbox', { name: '取消已发生' }).uncheck();
  await lab.getByRole('button', { name: '推演一次选择' }).click();
  await expect(lab.getByRole('status')).toContainText('阻塞');
  await lab.getByRole('checkbox', { name: '包含 default' }).check();
  await lab.getByRole('button', { name: '推演一次选择' }).click();
  await expect(lab.getByRole('status')).toContainText('本次选择：default');
  await lab.getByRole('combobox').selectOption('closed-send');
  await lab.getByRole('button', { name: '推演一次选择' }).click();
  await expect(lab.getByRole('status')).toContainText('panic');
});

test('通道实验：缓冲、阻塞、关闭与 nil', async ({ page }) => {
  await page.goto('/learn/concurrency-channels#lab');
  const lab = page.getByRole('region', { name: 'Channel 状态实验' });
  await lab.getByRole('button', { name: '发送', exact: true }).click();
  await lab.getByRole('button', { name: '发送', exact: true }).click();
  await expect(lab.getByRole('status')).toContainText('缓冲区已满');
  await lab.getByRole('button', { name: '接收', exact: true }).click();
  await expect(lab.locator('.channel-queue')).toContainText('7');
  await lab.getByRole('button', { name: '关闭', exact: true }).click();
  await lab.getByRole('button', { name: '接收', exact: true }).click();
  await expect(lab.getByRole('status')).toContainText('ok=true');
  await lab.getByRole('button', { name: '接收', exact: true }).click();
  await expect(lab.getByRole('status')).toContainText('ok=false');
  await lab.getByRole('button', { name: '发送', exact: true }).click();
  await expect(lab.getByRole('status')).toContainText('panic');
  await lab.getByRole('combobox', { name: '通道容量' }).selectOption('0');
  await lab.getByRole('button', { name: '发送', exact: true }).click();
  await expect(lab.getByRole('status')).toContainText('无缓冲');
  await lab.getByRole('button', { name: '接收', exact: true }).click();
  await expect(lab.getByRole('status')).toContainText('完成交接');
  await lab.getByRole('combobox', { name: '通道种类' }).selectOption('nil');
  await lab.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(lab.getByRole('status')).toContainText('不能关闭 nil');
});

test('发布实验：同步边必须先于读取', async ({ page }) => {
  await page.goto('/learn/concurrency-memory#lab');
  const lab = page.getByRole('region', { name: '发布顺序实验' });
  const run = lab.getByRole('button', { name: '检查顺序' });
  await run.click();
  await expect(lab.getByRole('status')).toContainText('不能证明');
  await lab.getByRole('combobox').selectOption('close');
  await run.click();
  await expect(lab.getByRole('status')).toContainText('W → P → O → R');
  await lab.getByRole('combobox').selectOption('late');
  await run.click();
  await expect(lab.getByRole('status')).toContainText('同步发生得太晚');
  await lab.getByRole('combobox').selectOption('atomic');
  await run.click();
  await expect(lab.getByRole('status')).toContainText('读取有序。');
});
