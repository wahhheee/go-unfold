import { expect, test } from '@playwright/test';
import { lessons } from '../src/content/lessons';

test('Pages 子路径的所有已发布页面都有真实静态入口', async ({ request }) => {
  for (const route of [
    '/',
    '/roadmap',
    '/practice',
    '/notes',
    ...lessons.map((lesson) => lesson.path),
  ]) {
    const response = await request.get(`/go-unfold${route}`);
    expect(response.status(), route).toBe(200);
    expect(await response.text()).toContain('/go-unfold/assets/');
  }
  for (const file of [
    'favicon.svg',
    'favicon.png',
    'apple-touch-icon.png',
    'assets/gopher.png',
    'LICENSE.txt',
    'THIRD_PARTY_NOTICES.md',
    'THIRD_PARTY_LICENSES.md',
  ])
    expect((await request.get(`/go-unfold/${file}`)).status(), file).toBe(200);
  const licenses = await (await request.get('/go-unfold/THIRD_PARTY_LICENSES.md')).text();
  expect(licenses).toContain('SIL OPEN FONT LICENSE');
  expect(licenses).toContain('Lucide');
  expect((await request.get('/go-unfold/learn/not-published/')).status()).toBe(404);
});

test('Pages 深链接刷新、锚点、翻页与主题可用', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(request.url()));
  const response = await page.goto('learn/concurrency-diagnostics/#lab');
  expect(response?.status()).toBe(200);
  const lab = page.getByRole('region', { name: '交错执行实验' });
  await expect(lab).toBeInViewport();
  await lab.getByRole('combobox').selectOption('split-1');
  for (let i = 0; i < 4; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.getByRole('status')).toContainText('只得到 1');
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  expect((await page.reload())?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page).toHaveTitle(/Go 探原$/);
  const previous = page.getByRole('navigation', { name: '章节翻页' }).getByRole('link');
  await expect(previous).toHaveAttribute('href', '/go-unfold/learn/concurrency-rate');
  await previous.click();
  await expect(page.getByRole('region', { name: '令牌桶与突发实验' })).toBeAttached();
  expect((await page.reload())?.status()).toBe(200);
  for (const selector of ['.brand-mark', '.sidebar-growth img'])
    expect(
      await page.locator(selector).evaluate((image) => (image as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('带尾斜线的笔记页面保留标题、查询参数和记录', async ({ page }) => {
  await page.goto('notes/?lesson=concurrency-memory');
  await expect(page).toHaveTitle('我的笔记 · Go 探原');
  await expect(page.getByRole('combobox', { name: '选择笔记章节' })).toHaveValue(
    'concurrency-memory',
  );
  await page.locator('.notes-editor').fill('静态入口也保留我的学习记录。');
  await page.reload();
  await expect(page.locator('.notes-editor')).toHaveValue('静态入口也保留我的学习记录。');
  await page.getByRole('link', { name: '回到2.1 内存模型与顺序正文' }).click();
  await expect(page).toHaveURL(/\/go-unfold\/learn\/concurrency-memory$/);
});
