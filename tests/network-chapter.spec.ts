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

test('TLS：信任、名字、有效期与协议独立校验', async ({ page }, testInfo) => {
  await page.goto('/learn/network-tls#lab');
  const lab = page.getByRole('region', { name: 'TLS 身份与协议协商实验' });
  for (let i = 0; i < 4; i++) await lab.getByRole('button', { name: '推进握手' }).click();
  await expect(lab.getByRole('status')).toContainText('握手完成');
  await lab.screenshot({ path: testInfo.outputPath('tls-light.png') });
  await lab.getByRole('checkbox', { name: '服务名字匹配' }).uncheck();
  for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: '推进握手' }).click();
  await expect(lab.getByRole('status')).toContainText('服务名字不匹配');
  await expect(lab.getByRole('button', { name: '推进握手' })).toBeDisabled();
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  await lab.screenshot({ path: testInfo.outputPath('tls-dark.png') });
  await lab.getByRole('checkbox', { name: '存在共同 ALPN' }).uncheck();
  for (let i = 0; i < 2; i++) await lab.getByRole('button', { name: '推进握手' }).click();
  await expect(lab.getByRole('status')).toContainText('没有共同 ALPN');
  await lab.getByRole('button', { name: '重置握手' }).click();
  await expect(lab.locator('.live-label')).toHaveText('阶段 0 / 4');
});

test('描述符：dup、继承与重新 open 的偏移', async ({ page }, testInfo) => {
  await page.goto('/learn/network-process#lab');
  const lab = page.getByRole('region', { name: '进程描述符与共享偏移实验' });
  await lab.getByRole('button', { name: '读取两字节' }).click();
  await lab.getByRole('button', { name: '复制描述符 dup' }).click();
  await lab.getByRole('combobox', { name: '操作描述符' }).selectOption('4');
  await lab.getByRole('button', { name: '读取两字节' }).click();
  await expect(lab.getByRole('status')).toContainText('读到 CD');
  await lab.getByRole('button', { name: '创建子进程视图' }).click();
  await lab.screenshot({ path: testInfo.outputPath('process-light.png') });
  await lab.getByRole('button', { name: '关闭所选描述符' }).click();
  await lab.getByRole('combobox', { name: '操作进程' }).selectOption('子进程');
  await lab.getByRole('button', { name: '读取两字节' }).click();
  await expect(lab.getByRole('status')).toContainText('读到 EF');
  await lab.getByRole('button', { name: '重新 open 文件' }).click();
  await lab.getByRole('combobox', { name: '操作描述符' }).selectOption('5');
  await lab.getByRole('button', { name: '读取两字节' }).click();
  await expect(lab.getByRole('status')).toContainText('读到 AB');
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  await lab.screenshot({ path: testInfo.outputPath('process-dark.png') });
  await lab.getByRole('button', { name: '重置描述符' }).click();
  await expect(lab.locator('.live-label')).toHaveText('1 个引用');
});

test('虚拟内存：共享驻留、写时复制与释放', async ({ page }, testInfo) => {
  await page.goto('/learn/network-memory#lab');
  const lab = page.getByRole('region', { name: '虚拟页、驻留与写时复制实验' });
  await expect(lab.locator('.network-cell strong')).toHaveText(['0 / 0 KiB', '0 KiB']);
  await lab.getByRole('button', { name: '写入所选页 +1' }).click();
  await lab.getByRole('button', { name: '派生子进程映射' }).click();
  await expect(lab.locator('.network-cell strong')).toHaveText(['4 / 4 KiB', '4 KiB']);
  await lab.screenshot({
    path: testInfo.outputPath('memory-light.png'),
    style: '.topbar,.skip-link{visibility:hidden}',
  });
  await lab.getByRole('combobox', { name: '操作进程' }).selectOption('child');
  await lab.getByRole('button', { name: '写入所选页 +1' }).click();
  await expect(lab.getByRole('status')).toContainText('写时复制');
  await expect(lab.locator('.network-cell strong')).toHaveText(['4 / 4 KiB', '8 KiB']);
  await expect(lab.locator('.network-lane').first()).toContainText('值 1');
  await expect(lab.locator('.network-lane').last()).toContainText('值 2');
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  await lab.screenshot({
    path: testInfo.outputPath('memory-dark.png'),
    style: '.topbar,.skip-link{visibility:hidden}',
  });
  await lab.getByRole('button', { name: '释放子进程映射' }).click();
  await expect(lab.locator('.network-cell strong')).toHaveText(['4 / 0 KiB', '4 KiB']);
  await lab.getByRole('button', { name: '重置虚拟内存' }).click();
  await expect(lab.locator('.live-label')).toHaveText('模型缺页 0 次');
});
