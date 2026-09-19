import { expect, test } from '@playwright/test';

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
