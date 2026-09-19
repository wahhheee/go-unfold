import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { lessons } from '../src/content/lessons';
import { questions } from '../src/content/questions';

for (const lesson of lessons.filter((item) => item.moduleId === 'go')) {
  test(`${lesson.label}：正文、练习、追问、主题与记录`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(lesson.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(lesson.title);
    for (const section of lesson.sections)
      await expect(page.locator(`#${section.id}`)).toBeAttached();
    for (const code of await page.locator('article pre').all())
      await expect(code).toHaveClass(/shiki/);
    const lessonQuestions = questions.filter((question) => question.lessonId === lesson.id);
    expect(lessonQuestions.length).toBeGreaterThanOrEqual(3);
    await expect(page.locator('.quiz')).toHaveCount(lessonQuestions.length);
    for (const question of lessonQuestions) {
      const quiz = page.getByRole('region', { name: question.title, exact: true });
      await quiz.getByText(question.options[question.answer], { exact: true }).click();
      await quiz.getByRole('button', { name: '验证答案' }).click();
      await expect(quiz.getByRole('status')).toContainText('理解到位');
    }
    expect(await page.locator('.followup-trigger').count()).toBeGreaterThanOrEqual(4);
    for (const trigger of await page.locator('.followup-trigger').all()) {
      if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    }
    await page.getByRole('button', { name: '标记为已完成' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: '已完成 · 撤销标记' })).toBeVisible();
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.getByRole('button', { name: '切换暗色主题' }).click();
      const scan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        scan.violations.map((item) => ({
          id: item.id,
          targets: item.nodes.map((node) => node.target),
        })),
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    expect(errors).toEqual([]);
    await page.goto(`/practice?lesson=${lesson.id}`);
    await expect(page.locator('.quiz')).toHaveCount(lessonQuestions.length);
    await expect(page.locator('.quiz-feedback.success')).toHaveCount(lessonQuestions.length);
  });
}

test('值复制实验：共享与独立复制', async ({ page }) => {
  await page.goto('/learn/go-values#lab');
  const lab = page.getByRole('region', { name: '值复制实验' });
  await lab.getByRole('button', { name: '复制 a 到 b' }).click();
  await lab.getByRole('combobox', { name: '修改副本的字段' }).selectOption('age');
  await lab.getByRole('spinbutton', { name: '字段新值' }).fill('30');
  await lab.getByRole('button', { name: '应用修改' }).click();
  await expect(lab.getByRole('status')).toContainText('两边都读到新年龄');
  await lab.getByRole('checkbox').check();
  await lab.getByRole('button', { name: '复制 a 到 b' }).click();
  await lab.getByRole('button', { name: '应用修改' }).click();
  await expect(lab.getByRole('status')).toContainText('a 的年龄没有变');
  await expect(lab.locator('.value-cells')).toContainText('20');
  await expect(lab.locator('.value-cells')).toContainText('30');
});

test('接口实验：typed nil 与不可比较值', async ({ page }) => {
  await page.goto('/learn/go-interfaces#lab');
  const lab = page.getByRole('region', { name: '接口状态实验' });
  await lab.getByRole('button', { name: '验证判断' }).click();
  await expect(lab.locator('.comparison-results')).toContainText('false');
  await lab.getByRole('combobox', { name: '接口中的值' }).selectOption('slice');
  await expect(lab.locator('.comparison-results')).toContainText('待验证');
  await lab.getByRole('button', { name: '验证判断' }).click();
  await expect(lab.locator('.comparison-results')).toContainText('panic');
  await lab.getByRole('combobox', { name: '接口中的值' }).selectOption('nil');
  await lab.getByRole('button', { name: '验证判断' }).click();
  await expect(lab.locator('.comparison-results strong')).toHaveText(['true', 'true']);
});

test('泛型实验：类型集与 comparable 例外', async ({ page }) => {
  await page.goto('/learn/go-generics#lab');
  const lab = page.getByRole('region', { name: '类型约束实验' });
  await lab.getByRole('button', { name: '检查类型实参' }).click();
  await expect(
    lab.locator('.constraint-row').filter({ has: page.getByText('UserID', { exact: true }) }),
  ).toContainText('不满足');
  await lab.getByRole('combobox').selectOption('underlying');
  await lab.getByRole('button', { name: '检查类型实参' }).click();
  await expect(
    lab.locator('.constraint-row').filter({ has: page.getByText('UserID', { exact: true }) }),
  ).not.toContainText('不满足');
  await lab.getByRole('combobox').selectOption('comparable');
  await lab.getByRole('button', { name: '检查类型实参' }).click();
  await expect(lab.getByRole('status')).toContainText('Go 1.20');
  await expect(
    lab.locator('.constraint-row').filter({ has: page.getByText('[]int', { exact: true }) }),
  ).toContainText('不满足');
});

test('切片实验：共享追加与容量隔离', async ({ page }) => {
  await page.goto('/learn/go-sequences#lab');
  const lab = page.getByRole('region', { name: '切片别名实验' });
  await lab.getByRole('button', { name: '执行 append' }).click();
  await expect(lab.locator('.memory-cells b')).toHaveText(['10', '20', '99', '40']);
  await lab.getByRole('button', { name: '执行 b[0] = 7', exact: true }).click();
  await expect(lab.locator('.memory-cells b')).toHaveText(['7', '20', '99', '40']);
  await lab.getByRole('combobox').selectOption('limit');
  await lab.getByRole('button', { name: '执行 append' }).click();
  await lab.getByRole('button', { name: '执行 b[0] = 7', exact: true }).click();
  await expect(lab.locator('.memory-cells b')).toHaveText(['10', '20', '30', '40']);
  await expect(lab.getByRole('status')).toContainText('没有改变');
  await lab.getByRole('combobox').selectOption('share');
  await lab.getByRole('spinbutton', { name: '初始切片长度' }).fill('4');
  await lab.getByRole('spinbutton', { name: '追加的整数' }).fill('55');
  await lab.getByRole('button', { name: '执行 append' }).click();
  await expect(lab.locator('.slice-descriptors')).toContainText('[10 20 30 40 55]');
  await expect(lab.getByRole('status')).toContainText('不再共享');
});

test('map 探测：碰撞、墓碑与不存在的键', async ({ page }) => {
  await page.goto('/learn/go-maps#lab');
  const lab = page.getByRole('region', { name: '哈希探测实验' });
  await lab.getByRole('button', { name: '推进一步' }).click();
  await expect(lab.locator('.probe-slot.candidate')).toHaveCount(2);
  await lab.getByRole('button', { name: '推进一步' }).click();
  await expect(lab.getByRole('status')).toContainText('deleted 不是 empty');
  await lab.getByRole('button', { name: '推进一步' }).click();
  await lab.getByRole('button', { name: '推进一步' }).click();
  await expect(lab.locator('.probe-slot.found')).toContainText('k42');
  await lab.getByRole('combobox').selectOption('k77');
  for (let i = 0; i < 4; i++) await lab.getByRole('button', { name: '推进一步' }).click();
  await expect(lab.getByRole('status')).toContainText('键不存在');
  await expect(lab.locator('.probe-slot.found')).toHaveCount(0);
});

test('调度时间线：阻塞线程移交 P 与播放控制', async ({ page }) => {
  await page.goto('/learn/go-scheduler#lab');
  const lab = page.getByRole('region', { name: '调度时间线' });
  await lab.getByRole('combobox').selectOption('syscall');
  await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.getByRole('status')).toContainText('线程本身');
  await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.locator('.scenario-lanes')).toContainText('交给 M1');
  await expect(lab.locator('.scenario-lanes')).toContainText('仍在系统调用');
  await lab.getByRole('button', { name: '重新播放' }).click();
  await expect(lab.locator('.scenario-navigation')).toContainText('步骤 1');
  await lab.getByRole('combobox').selectOption('preempt');
  await lab.getByRole('button', { name: '自动播放' }).click();
  await expect(lab.getByRole('button', { name: '暂停播放' })).toBeVisible();
  await expect(lab.getByRole('status')).toContainText('不保证你的业务', { timeout: 8000 });
  await expect(lab.getByRole('button', { name: '下一步' })).toBeDisabled();
  await lab.getByRole('button', { name: '上一步', exact: true }).click();
  await expect(lab.getByRole('status')).toContainText('重新变成可运行');
});

test('GC 实验：增长预算与根集合', async ({ page }) => {
  await page.goto('/learn/go-memory#lab');
  const lab = page.getByRole('region', { name: 'GC 堆目标实验' });
  await expect(lab.locator('.gc-metrics')).toContainText('18.0 MiB');
  await expect(lab.locator('.gc-metrics')).toContainText('2.00 / s');
  await lab.getByRole('slider', { name: 'GOGC', exact: true }).focus();
  await page.keyboard.press('End');
  await expect(lab.locator('.gc-metrics')).toContainText('38.0 MiB');
  await lab.getByRole('spinbutton', { name: '根扫描量 MiB' }).fill('4');
  await expect(lab.locator('.gc-metrics')).toContainText('44.0 MiB');
  await lab.getByRole('button', { name: '重置 GC 参数' }).click();
  await expect(lab.locator('.gc-metrics')).toContainText('18.0 MiB');
});

test('画像视角：累计分配与存活内存独立', async ({ page }) => {
  await page.goto('/learn/go-performance#lab');
  const lab = page.getByRole('region', { name: '内存画像视角实验' });
  await expect(lab.locator('.profile-row').first()).toContainText('sessionCache');
  await lab.getByRole('radio', { name: '累计分配 · alloc_space' }).check();
  await expect(lab.locator('.profile-row').first()).toContainText('decodeBuffer');
  await expect(lab.locator('.profile-bars')).toContainText('1340.0 MiB');
  await lab.getByRole('slider', { name: '缓存保留比例' }).focus();
  await page.keyboard.press('Home');
  await expect(lab.locator('.profile-bars')).toContainText('1340.0 MiB');
  await lab.getByRole('radio', { name: '当前存量 · inuse_space' }).check();
  await expect(lab.locator('.profile-row').first()).toContainText('decodeBuffer');
  await expect(lab.locator('.profile-bars')).toContainText('22.0 MiB');
});

test('defer 时间线：实参快照与命名返回值', async ({ page }) => {
  await page.goto('/learn/go-errors#lab');
  const lab = page.getByRole('region', { name: 'defer 执行时间线' });
  for (let i = 0; i < 5; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.locator('.scenario-lanes')).toContainText('closure 2；arg 1');
  await lab.getByRole('combobox').selectOption('result');
  for (let i = 0; i < 4; i++) await lab.getByRole('button', { name: '下一步' }).click();
  await expect(lab.locator('.scenario-lanes')).toContainText('返回 6');
  await expect(lab.getByRole('button', { name: '下一步' })).toBeDisabled();
});

test('往返实验：反例、修复、输入验证与重置', async ({ page }) => {
  await page.goto('/learn/go-testing#lab');
  const lab = page.getByRole('region', { name: '反例发现实验' });
  const run = lab.getByRole('button', { name: '验证往返性质' });
  const input = lab.getByRole('textbox', { name: '往返测试 JSON 输入' });
  await run.click();
  await expect(lab.getByRole('status')).toContainText('本次样例通过');
  await lab.getByRole('combobox', { name: '输入样例' }).selectOption('[0]');
  await expect(lab.locator('.roundtrip-output')).toContainText('待验证');
  await run.click();
  await expect(lab.getByRole('status')).toContainText('性质失败');
  await expect(lab.locator('.roundtrip-output code')).toHaveText(['[]', '[]']);
  await lab.getByRole('combobox', { name: '编码实现' }).selectOption('correct');
  await run.click();
  await expect(lab.locator('.roundtrip-output code')).toHaveText(['[0]', '[0]']);
  await input.fill('[0, 255]');
  await run.click();
  await expect(lab.getByRole('status')).toContainText('本次样例通过');
  await input.fill('[256]');
  await run.click();
  await expect(lab.getByRole('alert')).toBeVisible();
  await expect(lab.locator('.roundtrip-output')).toContainText('待验证');
  await input.fill(
    JSON.stringify(
      Array.from({ length: 64 }, () => 255),
      null,
      2,
    ),
  );
  await input.press('ControlOrMeta+End');
  expect(await input.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect
    .poll(() => lab.locator('.editor-highlight').evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await run.click();
  await expect(lab.getByRole('status')).toContainText('本次样例通过');
  await lab.getByRole('button', { name: '重置反例实验' }).click();
  await expect(input).toHaveValue('[1, 2, 3]');
  await expect(lab.getByRole('combobox', { name: '编码实现' })).toHaveValue('broken');
  await expect(lab.getByRole('status')).toContainText('目标性质');
});
