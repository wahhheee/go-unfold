import { expect, test } from '@playwright/test';

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
