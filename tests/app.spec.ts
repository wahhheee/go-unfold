import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('正文、代码、资源和主题正确渲染', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/learn/preface');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('从「背过」，到真正理解。');
  await expect(page.locator('article pre').first()).toBeAttached();
  for (const block of await page.locator('article pre').all()) {
    await expect(block).toHaveClass(/shiki/);
    await expect(block.locator('.line span').first()).toHaveAttribute('style', /--shiki-light/);
  }
  expect(
    await page
      .locator('.sidebar-growth img')
      .evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('练习反馈、重答与持久化', async ({ page }) => {
  await page.goto('/practice');
  const quiz = page.getByRole('region', { name: '先检查你的直觉' });
  await quiz.getByText('Redis 会自动回滚 SETNX', { exact: true }).click();
  await quiz.getByRole('button', { name: '验证答案' }).click();
  await expect(quiz.getByRole('status')).toContainText('正确答案：B');
  await page.getByRole('button', { name: '待巩固', exact: true }).click();
  await expect(page.locator('.quiz')).toHaveCount(1);
  await quiz.getByRole('button', { name: '重新作答' }).click();
  await page.getByRole('button', { name: '全部题目', exact: true }).click();
  await quiz.getByText('锁可能一直留着，其他请求无法拿到锁', { exact: true }).click();
  await quiz.getByRole('button', { name: '验证答案' }).click();
  await page.reload();
  await expect(quiz.getByRole('status')).toContainText('理解到位');
  await page.goto('/learn/preface#lock');
  await expect(
    page.getByRole('region', { name: '先检查你的直觉' }).getByRole('status'),
  ).toContainText('理解到位');
});

test('实验真实区分旧写入、误删与 fencing', async ({ page }) => {
  await page.goto('/learn/preface#lab');
  const lab = page.getByRole('region', { name: '分布式锁实验室' });
  await lab.getByRole('button', { name: '运行实验', exact: true }).click();
  await expect(lab.locator('.lab-result')).toContainText('锁没有被误删，旧写入仍然成功了', {
    timeout: 15000,
  });
  await lab.getByRole('button', { name: /02.*误删别人的锁/ }).click();
  await lab.getByRole('button', { name: '运行实验', exact: true }).click();
  await expect(lab.locator('.lab-result')).toContainText('旧持有者误删了新租约', {
    timeout: 15000,
  });
  await lab.getByRole('button', { name: /04.*资源拒绝旧写入/ }).click();
  await lab.getByRole('button', { name: '运行实验', exact: true }).click();
  await expect(lab.locator('.lab-result')).toContainText('资源端拒绝了过期持有者的写入', {
    timeout: 15000,
  });
});

test('JSON 可编辑、校验并运行', async ({ page }) => {
  await page.goto('/learn/preface#lab');
  const lab = page.getByRole('region', { name: '分布式锁实验室' });
  await lab.getByRole('button', { name: 'JSON', exact: true }).click();
  const editor = page.getByRole('textbox', { name: '实验 JSON 配置' });
  await editor.fill('{ "ttl": 0 }');
  await lab.getByRole('button', { name: '运行实验', exact: true }).click();
  await expect(lab.getByRole('alert')).toContainText('ttl 必须是');
  await editor.fill(
    JSON.stringify(
      { ttl: 5, work: 9, renew: true, pause: false, safeUnlock: true, fencing: false },
      null,
      2,
    ),
  );
  await expect(lab.locator('.editor-highlight .shiki span').first()).toBeAttached();
  await lab.getByRole('button', { name: '运行实验', exact: true }).click();
  await expect(lab.locator('.lab-result')).toContainText('本次时间安排下，没有出现旧写入', {
    timeout: 15000,
  });
  await lab.getByRole('button', { name: '参数', exact: true }).click();
  await expect(lab.getByRole('checkbox', { name: '自动续租' })).toBeChecked();
  await expect(lab.getByRole('checkbox', { name: 'A 发生长暂停' })).not.toBeChecked();
});

test('笔记、收藏、完成状态与导出', async ({ page }) => {
  await page.goto('/learn/preface');
  await page.getByRole('button', { name: '收藏序章', exact: true }).click();
  await page.getByRole('button', { name: '标记为已完成' }).click();
  await page.goto('/notes');
  await expect(page.locator('.bookmark-row')).toContainText('从「背过」到真正理解');
  await page
    .getByRole('textbox', { name: '序章笔记' })
    .fill('随机 token 防误删；fencing 在资源端防旧写入。');
  await page.reload();
  await expect(page.getByRole('textbox', { name: '序章笔记' })).toHaveValue(
    '随机 token 防误删；fencing 在资源端防旧写入。',
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 Markdown' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Go深入-学习笔记.md');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const content = Buffer.concat(chunks).toString('utf-8');
  expect(content).toContain('随机 token 防误删');
  expect(content).toContain('序章状态：已完成');
});

test('搜索、目录规划与未找到页面', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.locator('.search-trigger').click();
  await page.getByRole('textbox', { name: '搜索知识点' }).fill('JSON');
  await page.getByRole('button', { name: /让问题真实发生/ }).click();
  await expect(page).toHaveURL(/#lab$/);
  await expect(page.locator('#lab')).toBeInViewport();
  if (isMobile) await page.getByRole('button', { name: '打开导航' }).click();
  await page.getByRole('link', { name: '知识地图', exact: true }).click();
  await page.getByRole('button', { name: '语言基础', exact: true }).click();
  await expect(page.locator('.roadmap-module')).toHaveCount(2);
  await expect(page.locator('.roadmap-module').first()).toContainText('有已发布章节');
  await page.goto('/missing');
  await expect(page.getByRole('heading', { name: '这一页还没有写到。' })).toBeVisible();
  await page.getByRole('link', { name: '回到序章', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('从「背过」，到真正理解。');
});

test('浅色与暗色满足基础无障碍检查', async ({ page }) => {
  await page.goto('/learn/preface');
  await expect(page.locator('#sources')).toBeAttached();
  const light = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    light.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({ target: node.target, message: node.failureSummary })),
    })),
  ).toEqual([]);
  await page.getByRole('button', { name: '切换暗色主题' }).click();
  const dark = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(
    dark.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({ target: node.target, message: node.failureSummary })),
    })),
  ).toEqual([]);
});

test('旧版记录可迁移，未知章节不会冒充序章', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'go-deeper:learning:v1',
      JSON.stringify({ notes: '迁移前的思考', completed: true, bookmarked: true }),
    ),
  );
  await page.goto('/notes');
  await expect(page.getByRole('textbox', { name: '序章笔记' })).toHaveValue('迁移前的思考');
  await expect(page.locator('.bookmark-row')).toHaveCount(1);
  await page.goto('/learn/not-published');
  await expect(page.getByRole('heading', { name: '这一页还没有写到。' })).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('go-deeper:learning:v2') || '{}'),
  );
  expect(stored.lessons.preface.completed).toBe(true);
  expect(stored.lessons.preface.notes).toBe('迁移前的思考');
});
