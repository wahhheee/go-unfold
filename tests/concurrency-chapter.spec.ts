import { expect, test } from '@playwright/test';

test('任务池：外部积压、拒绝、排空与中止', async ({ page }) => {
  await page.goto('/learn/concurrency-pool#lab');
  const lab = page.getByRole('region', { name: '有界任务池与背压实验' });
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '推进一步' }).click();
  await expect(lab.getByTestId('pool-outside')).toHaveText('5');
  await lab.getByRole('button', { name: '停止接单并排空' }).click();
  await expect(lab.getByTestId('pool-outside')).toHaveText('0');
  for (let i = 0; i < 6; i++) await lab.getByRole('button', { name: '推进一步' }).click();
  await expect(lab.getByRole('status')).toContainText('已排空');
  await lab.getByRole('combobox').selectOption('reject');
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '推进一步' }).click();
  await expect(lab.getByTestId('pool-outside')).toHaveText('0');
  await expect(lab.getByTestId('pool-rejected')).toHaveText('5');
  await lab.getByRole('button', { name: '中止未完成任务' }).click();
  await expect(lab.getByTestId('pool-canceled')).toHaveText('5');
  await expect(lab.getByRole('button', { name: '推进一步' })).toBeDisabled();
  await lab.getByRole('button', { name: '重置任务池' }).click();
  await lab.getByRole('button', { name: '自动播放' }).click();
  await expect(lab.locator('.live-label')).toHaveText(/第 [1-9]\d* 步/);
  await lab.getByRole('button', { name: '暂停播放' }).click();
});

test('任务组时间线：遗留发送、等待清理与共享调用', async ({ page }) => {
  await page.goto('/learn/concurrency-groups#lab');
  const lab = page.getByRole('region', { name: '任务组与共享调用时间线' });
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.getByRole('status')).toContainText('不会因创建它的函数返回而自动结束');
  await lab.getByRole('combobox').selectOption('joined');
  for (let i = 0; i < 2; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.locator('.scenario-lanes')).toContainText('尚未返回');
  await lab.getByRole('combobox').selectOption('success');
  for (let i = 0; i < 2; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.locator('.scenario-lanes')).toContainText('context.Canceled');
  await lab.getByRole('combobox').selectOption('singleflight');
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.getByRole('status')).toContainText('不是结果缓存');
});

test('Context 实验：继承、取消原因与独立预算', async ({ page }) => {
  await page.goto('/learn/concurrency-context#lab');
  const lab = page.getByRole('region', { name: 'Context 预算与取消实验' });
  const child = lab.getByTestId('context-child');
  await expect(child).toContainText('700ms');
  await lab.getByRole('button', { name: '取消父请求' }).click();
  await expect(child).toContainText('context.Canceled');
  await expect(child).toContainText('调用方取消');
  await lab.getByRole('combobox').selectOption('detached');
  await lab.getByRole('button', { name: '取消父请求' }).click();
  await expect(child).toContainText('未设置');
  await expect(child).not.toContainText('context.Canceled');
  await expect(lab.getByRole('slider', { name: '子任务预算' })).toBeDisabled();
  await lab.getByRole('combobox').selectOption('bounded');
  await lab.getByRole('button', { name: '取消父请求' }).click();
  for (let i = 0; i < 9; i++) await lab.getByRole('button', { name: '推进 100ms' }).click();
  await expect(child).toContainText('context.DeadlineExceeded');
  await lab.getByRole('button', { name: '重置时间' }).click();
  await expect(child).toContainText('900ms');
});

test('同步时间线：完成、错误缓存与条件重检', async ({ page }) => {
  await page.goto('/learn/concurrency-coordination#lab');
  const lab = page.getByRole('region', { name: '完成与条件时间线' });
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.getByRole('status')).toContainText('读取完成结果');
  await lab.getByRole('combobox').selectOption('once');
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.locator('.scenario-lanes')).toContainText('仍为首次错误');
  await lab.getByRole('combobox').selectOption('cond');
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.getByRole('status')).toContainText('不是无通知的虚假唤醒');
  await lab.getByRole('button', { name: '上一步' }).click();
  await expect(lab.locator('.scenario-stage h3')).toHaveText('G1 先获得锁并消费');
});

test('快照实验：浅复制污染、独立版本与发布后写入', async ({ page }) => {
  await page.goto('/learn/concurrency-atomic#lab');
  const lab = page.getByRole('region', { name: '原子快照与别名实验' });
  await lab.getByRole('button', { name: '创建新版本' }).click();
  await lab.getByRole('button', { name: '修改草稿', exact: true }).click();
  await expect(lab.getByTestId('snapshot-reader')).toContainText('额度 40');
  await expect(lab.getByTestId('snapshot-current')).toContainText('v1');
  await lab.getByRole('combobox').selectOption('clone');
  await lab.getByRole('button', { name: '创建新版本' }).click();
  await lab.getByRole('button', { name: '修改草稿', exact: true }).click();
  await lab.getByRole('button', { name: '原子发布', exact: true }).click();
  await expect(lab.getByTestId('snapshot-reader')).toContainText('额度 10');
  await expect(lab.getByTestId('snapshot-current')).toContainText('v2 → M2 · 额度 40');
  await lab.getByRole('slider').fill('70');
  await lab.getByRole('button', { name: '违规修改已发布对象' }).click();
  await expect(lab.getByTestId('snapshot-current')).toContainText('额度 70');
  await expect(lab.getByRole('status')).toContainText('发布后仍必须保持不可变');
  await lab.getByRole('button', { name: '重置快照' }).click();
  await expect(lab.getByRole('button', { name: '创建新版本' })).toBeEnabled();
});

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
