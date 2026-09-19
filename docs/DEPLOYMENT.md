# GitHub Pages 部署

- 项目：Go 探原 / Go Unfold。
- 公开仓库：https://github.com/wahhheee/go-unfold
- 在线站点：https://wahhheee.github.io/go-unfold/
- 发布源：GitHub Actions，主分支 `main`。

## 发布流程

`.github/workflows/ci.yml` 对推送和 PR 执行格式、类型、模型、Go、桌面与手机浏览器检查。随后使用 `npm run build:pages` 构建 `/go-unfold/` 前缀版本，执行 `npm run test:pages`，并在 main 推送或手动运行成功后上传产物、部署到 `github-pages` 环境。PR 不部署。

GitHub 仓库的 Settings → Pages → Build and deployment → Source 设置为 GitHub Actions。工作流使用只读代码权限，发布 job 单独申请 `pages: write` 与 `id-token: write`；无需提交个人令牌。站点构建失败时保留已有部署，并在 Actions 中查看失败步骤。

## 子路径与刷新

Vite 构建参数为 `--base=/go-unfold/`，路由器从 `import.meta.env.BASE_URL` 取得 basename，静态图片也共用此前缀。未来变更仓库名或自定义域名时，同步调整 `build:pages`、静态验证前缀、README 和包元信息。

`scripts/prepare-static.mjs` 从已发布注册表生成 `dist/learn/<lessonId>/index.html`，为 `/roadmap/`、`/practice/`、`/notes/` 生成入口，并生成 `404.html` 和 `.nojekyll`。这些是应用入口文件，正文仍由 React 按需加载，不是服务端渲染。新增课节注册后自动进入构建，不需要手工复制页面。

目录地址可由静态主机重定向到尾斜线版本，应用同时兼容这两种路径。查询参数和正文锚点保留；未知地址返回 404，并显示应用的未找到页面。

## 本地复验

```bash
npm run format:check
npm run check
npm run test:e2e -- --workers 3
npm run build:pages
npm run test:pages
```

`test:pages` 自动在 4173 端口启动仅绑定本机的静态服务器，刻意禁用 SPA 回退，结束后关闭。它检查所有发布入口的 HTTP 200、未知页面的 404、图片与许可文件、深链接刷新、翻页、主题和带查询参数的笔记。需要事先安装 Playwright Chromium。

## 许可与数据

发布目录携带 MIT 全文、第三方素材说明、打包依赖许可及 DM Sans OFL 全文。不要在部署时删除这些文件。

浏览器学习记录仍使用历史存储键；换成 GitHub Pages 域名不会自动带入 localhost 的记录，这是浏览器按来源隔离存储的结果。发布不增加账户系统或后台数据收集。

配置依据：[Vite 静态部署](https://vite.dev/guide/static-deploy.html#github-pages)、[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
