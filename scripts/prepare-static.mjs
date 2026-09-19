import { appendFile, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const output = resolve('dist');
const server = await createServer({
  cacheDir: 'node_modules/.vite-static',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom',
});

try {
  // 与页面共用真实注册表，新增课程后自动获得可直接访问的静态入口。
  const { lessons } = await server.ssrLoadModule('/src/content/lessons.ts');
  const routes = [...lessons.map((lesson) => lesson.path), '/roadmap', '/practice', '/notes'];
  const html = await readFile(resolve(output, 'index.html'), 'utf8');
  for (const route of routes) {
    if (!/^\/[a-z0-9/-]+$/.test(route)) throw new Error(`非法静态路由：${route}`);
    const directory = resolve(output, route.slice(1));
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, 'index.html'), html);
  }
  await writeFile(resolve(output, '404.html'), html);
  await writeFile(resolve(output, '.nojekyll'), '');
  await copyFile('LICENSE', resolve(output, 'LICENSE.txt'));
  // 字体是 CSS 引用的静态资源，显式携带全文，不依赖打包器是否收集它。
  const fontLicense = await readFile('node_modules/@fontsource-variable/dm-sans/LICENSE', 'utf8');
  await appendFile(
    resolve(output, 'THIRD_PARTY_LICENSES.md'),
    `\n\n## DM Sans 字体许可\n\n${fontLicense}\n`,
  );
  console.log(`已生成 ${routes.length} 个静态页面入口、404 与许可文件。`);
} finally {
  await server.close();
}
