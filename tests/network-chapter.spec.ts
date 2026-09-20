import { expect, test } from '@playwright/test';

test('DNS：旧连接、缓存到期与新地址', async ({ page }, testInfo) => {
  await page.goto('/learn/network-dns#lab');
  const lab = page.getByRole('region', { name: 'DNS 缓存与连接路由实验' });
  await lab.getByRole('button', { name: '发起请求' }).click();
  await lab.getByRole('button', { name: '切换权威地址' }).click();
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '推进 10 秒' }).click();
  await lab.getByRole('button', { name: '发起请求' }).click();
  await expect(lab.getByRole('status')).toContainText('仍访问 192.0.2.10');
  await expect(lab.getByTestId('dns-queries')).toHaveText('1');
  await lab.screenshot({ path: testInfo.outputPath('dns-light.png') });
  await lab.getByRole('button', { name: '关闭空闲连接' }).click();
  await lab.getByRole('button', { name: '发起请求' }).click();
  await expect(lab.getByRole('status')).toContainText('新建连接到 192.0.2.20');
  await expect(lab.getByTestId('dns-queries')).toHaveText('2');
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  await lab.screenshot({ path: testInfo.outputPath('dns-dark.png') });
  await lab.getByRole('slider').fill('60');
  await expect(lab.getByTestId('dns-queries')).toHaveText('0');
  await expect(lab.getByRole('button', { name: '关闭空闲连接' })).toBeDisabled();
});
