import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const svg = await readFile('public/favicon.svg', 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  for (const size of [32, 180]) {
    await page.setViewportSize({ width: size, height: size });
    await page.locator('svg').evaluate((element, size) => {
      element.setAttribute('width', String(size));
      element.setAttribute('height', String(size));
      element.style.display = 'block';
    }, size);
    await page.locator('svg').screenshot({
      path: size === 32 ? 'public/favicon.png' : 'public/apple-touch-icon.png',
      omitBackground: true,
    });
  }
  console.log('已从 SVG 导出 32px favicon 与 180px 触屏图标。');
} finally {
  await browser.close();
}
