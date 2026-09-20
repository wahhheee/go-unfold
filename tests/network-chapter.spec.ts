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

test('TCP：短读、消息定界与截断', async ({ page }, testInfo) => {
  await page.goto('/learn/network-tcp#lab');
  const lab = page.getByRole('region', { name: 'TCP 字节流与消息定界实验' });
  for (let i = 0; i < 4; i++) await lab.getByRole('button', { name: '读取一次' }).click();
  await expect(lab.locator('.network-cells')).toContainText('CAT、OK');
  await lab.screenshot({ path: testInfo.outputPath('tcp-light.png') });
  await lab.getByRole('slider').fill('7');
  await lab.getByRole('checkbox').check();
  await lab.getByRole('button', { name: '读取一次' }).click();
  await lab.getByRole('button', { name: '读取一次' }).click();
  await expect(lab.getByRole('status')).toContainText('截断');
  await expect(lab.getByRole('button', { name: '读取一次' })).toBeDisabled();
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  await lab.screenshot({ path: testInfo.outputPath('tcp-dark.png') });
  await lab.getByRole('checkbox').uncheck();
  await lab.getByRole('combobox').selectOption('read');
  await lab.getByRole('button', { name: '读取一次' }).click();
  await expect(lab.locator('.network-cells')).toContainText('?CAT?OK');
  await lab.getByRole('button', { name: '重置字节流' }).click();
  await expect(lab.locator('.live-label')).toHaveText('0 / 7 字节');
});

test('窗口：累计缺口、重传与慢消费者', async ({ page }, testInfo) => {
  await page.goto('/learn/network-flow#lab');
  const lab = page.getByRole('region', { name: 'TCP 窗口与丢失恢复实验' });
  await lab.getByRole('button', { name: '按窗口发送' }).click();
  await lab.getByRole('button', { name: '交付并返回 ACK' }).click();
  await expect(lab.getByRole('status')).toContainText('累计确认停在 1');
  await lab.screenshot({ path: testInfo.outputPath('flow-light.png') });
  await lab.getByRole('button', { name: '重传缺失段' }).click();
  await lab.getByRole('button', { name: '交付并返回 ACK' }).click();
  await expect(lab.getByRole('status')).toContainText('前进到 4');
  await lab.getByRole('button', { name: '按窗口发送' }).click();
  await expect(lab.getByRole('status')).toContainText('没有新发送额度');
  await lab.getByRole('button', { name: '应用读取连续数据' }).click();
  await lab.getByRole('button', { name: '按窗口发送' }).click();
  await expect(lab.getByRole('status')).toContainText('发送 4 段');
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  await lab.screenshot({ path: testInfo.outputPath('flow-dark.png') });
  await lab.getByRole('slider', { name: '拥塞窗口' }).fill('2');
  await expect(lab.locator('.live-label')).toHaveText('已交付应用 0 / 12');
  await lab.getByRole('button', { name: '按窗口发送' }).click();
  await expect(lab.getByRole('status')).toContainText('发送 2 段');
});

test('HTTP：响应体占用、复用与空闲关闭', async ({ page }, testInfo) => {
  await page.goto('/learn/network-http#lab');
  const lab = page.getByRole('region', { name: 'HTTP 响应体与连接池实验' });
  for (let i = 0; i < 2; i++) await lab.getByRole('button', { name: '发起新请求' }).click();
  await lab.getByRole('button', { name: '收到响应头' }).click();
  await expect(lab.locator('.network-cells')).toContainText('请求 2');
  await lab.screenshot({ path: testInfo.outputPath('http-light.png') });
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '读取一块' }).click();
  await expect(lab.locator('.network-lane')).toContainText('连接 1 · 请求 2');
  await lab.getByRole('button', { name: '收到响应头' }).click();
  await lab.getByRole('button', { name: '发起新请求' }).click();
  await lab.getByRole('button', { name: '提前关闭 Body' }).click();
  await expect(lab.locator('.network-lane')).toContainText('连接 2 · 请求 3');
  await lab.getByRole('button', { name: '关闭空闲连接', exact: true }).click();
  await expect(lab.locator('.network-lane')).toHaveCount(1);
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  await lab.screenshot({ path: testInfo.outputPath('http-dark.png') });
  await lab.getByRole('combobox').selectOption('2');
  await expect(lab.locator('.network-lane')).toHaveCount(0);
});

test('多路复用：TCP 缺口、QUIC 独立流与压缩依赖', async ({ page }, testInfo) => {
  await page.goto('/learn/network-multiplex#lab');
  const lab = page.getByRole('region', { name: 'HTTP 多路复用与队头阻塞实验' });
  for (let i = 0; i < 6; i++) await lab.getByRole('button', { name: '推进一个到达事件' }).click();
  await expect(lab.locator('.network-cell strong')).toHaveText([
    '可交付 0 / 2',
    '可交付 0 / 2',
    '可交付 0 / 2',
  ]);
  await lab.screenshot({ path: testInfo.outputPath('multiplex-light.png') });
  await lab.getByRole('combobox', { name: '承载协议' }).selectOption('h3');
  for (let i = 0; i < 6; i++) await lab.getByRole('button', { name: '推进一个到达事件' }).click();
  await expect(lab.locator('.network-cell strong')).toHaveText([
    '可交付 0 / 2',
    '可交付 2 / 2',
    '可交付 2 / 2',
  ]);
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  await lab.screenshot({ path: testInfo.outputPath('multiplex-dark.png') });
  await lab.getByRole('checkbox').check();
  for (let i = 0; i < 6; i++) await lab.getByRole('button', { name: '推进一个到达事件' }).click();
  await expect(lab.locator('.network-cell strong')).toHaveText([
    '可交付 0 / 2',
    '可交付 0 / 2',
    '可交付 0 / 2',
  ]);
  await lab.getByRole('button', { name: '补齐丢失与依赖' }).click();
  await expect(lab.locator('.network-cell strong')).toHaveText([
    '可交付 2 / 2',
    '可交付 2 / 2',
    '可交付 2 / 2',
  ]);
  await lab.getByRole('button', { name: '回退一步' }).click();
  await expect(lab.locator('.live-label')).toHaveText('6 / 7 步');
});
