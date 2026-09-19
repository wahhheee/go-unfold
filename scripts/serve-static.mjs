import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

// 仅用于本地验证，刻意不提供 SPA 回退，以发现缺失的 Pages 静态入口。
const root = resolve('dist');
const base = '/go-unfold/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:4173');
  try {
    const pathname = decodeURIComponent(url.pathname);
    if (!pathname.startsWith(base)) throw new Error('站点外路径');
    let file = resolve(root, pathname.slice(base.length));
    if (file !== root && !file.startsWith(root + sep)) throw new Error('非法文件路径');
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      }
      file = resolve(file, 'index.html');
    }
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(await readFile(resolve(root, '404.html')));
  }
});
server.listen(4173, '127.0.0.1', () => console.log(`静态站点：http://127.0.0.1:4173${base}`));
