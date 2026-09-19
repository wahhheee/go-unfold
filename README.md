# Go 深入

一本面向 Go 服务端开发的交互式学习手册。以原理、工程边界和追问链组织内容，避免把过时结论当成标准答案。

序章与第一章“Go 语言与运行时”十节已完成。第一章包含 37 道随堂练习、40 组追问、10 个交互实验及对应的真实 Go 示例，逐节检查后单独提交。其余模块保留为课程规划；详细范围与核验记录见 [第一章交付记录](docs/GO_CHAPTER.md)。

## 本地运行

需要 Node.js 22.12+，建议使用 Node.js 24 LTS。

```bash
npm ci
npm run dev
```

打开终端中显示的地址，默认是 `http://localhost:5173`。直接进入序章，不需要账号、数据库或环境变量。

```bash
npm run check          # 类型检查、单元测试、生产构建
npm run test:go        # 真实 Go 示例，另需 Go 1.27+ 工具链
npm run test:go:vet    # Go 静态检查
npm run test:go:race   # 竞态检查，打乱测试顺序并重新执行
npm run test:go:fuzz   # 运行 5 秒往返性质探索
npm run format:check   # 格式检查
npx playwright install chromium
npm run test:e2e       # 桌面、手机、明暗主题与无障碍检查
npm run build
npm run preview       # 本地预览生产构建
```

浏览器测试默认使用 5173 端口；本地已运行的开发服务器会被复用，CI 会自动启动服务器。部署时将 `dist/` 作为站点目录，并把不存在的文件请求回退到 `index.html`，以支持 `/learn/preface` 等客户端路由。

## 已实现

- 三栏阅读布局、手机抽屉导航、浅色和暗色主题。
- 九个模块的课程地图，显式区分已发布内容与规划主题。
- 可检索的已发布章节目录和规划主题，支持关键词与正文锚点跳转。
- MDX 正文组件，代码围栏在构建期通过 Shiki 高亮，内联代码统一样式。
- 共 40 道随堂单选题、逐项解释、错题筛选、按节回顾与跨页面答题状态。
- Redis 租约实验：参数滑块、开关、可编辑且高亮的 JSON、事件动画、单步、重放、场景预设。
- Go 实验覆盖值复制、接口、类型约束、切片、哈希探测、调度、GC、性能画像、defer 与反例发现。
- 每节连续面试追问、记忆锚点、一手参考资料与固定核验日期。
- 本地阅读完成状态、收藏、笔记自动保存与 Markdown 导出。
- 类型检查、模型和内容注册测试、Go 示例与诊断、Playwright 流程测试、axe 无障碍检查与 GitHub Actions 配置。

第一章以 Go 1.27.1 / linux / amd64 为实际核验环境，区分语言版本与工具链版本，注明 Swiss Table、Green Tea、泛型方法等变化的适用范围。序章核对了 Redis 8.4 的 `DELEX ... IFEQ`。浏览器实验是受限模型，不提供远程任意代码执行；真实 Go 测试在本地示例模块中运行，模型假设在实验面板内列出。

## 项目结构

```text
src/
  content/
    curriculum.ts            # 模块规划、序章元信息和参考资料
    lessons.ts               # 已发布章节注册表，统一驱动导航与阅读
    questions.ts             # 题目、正确答案、逐项解释与记忆点
    go/                      # 各节元信息、题目与追问
    lessons/                 # 序章与第一章的 MDX 正文
  components/
    Lesson.tsx               # 阅读框架与 MDX 组件映射
    Quiz.tsx                 # 随堂练习
    *Lab.tsx                 # 各实验界面
    ScenarioPlayer.tsx       # 可暂停、单步和重放的教学时间线
    JsonEditor.tsx            # 按需加载的高亮配置编辑器
    Followups.tsx             # 追问链
    CodeBlock.tsx             # 代码复制与展示
  lib/                      # 独立于界面的模型与边界测试
  pages/                     # 课程地图、练习回顾和笔记
  state/learning.tsx         # 带版本号的浏览器学习记录
examples/go/                 # 十组真实 Go 示例、基准和复验记录
tests/                       # 应用与整章浏览器集成、无障碍测试
docs/
  AUTHORING.md               # 内容编写与扩展指南
  CONTENT_POLICY.md          # 核验与内容更新规范
  ARCHITECTURE.md            # 技术边界与下一阶段演进
```

## 维护与扩展

先阅读 [内容编写指南](docs/AUTHORING.md) 与 [内容核验规范](docs/CONTENT_POLICY.md)。知识点、题目、实验模型和 UI 独立维护；新增实验不应把业务逻辑写进 MDX。

新章节只需新增 MDX，并在 `src/content/lessons.ts` 注册元信息和按需加载函数；路由、目录、搜索、收藏和进度会自动接入。题目通过 `lessonId` 关联章节。学习记录按章节隔离，支持从初始单篇记录自动迁移。详见 [架构说明](docs/ARCHITECTURE.md)。

提交采用 Conventional Commits，描述、项目注释与文档使用简体中文，例如：

```text
feat(content): 增加切片扩容的边界实验
fix(lab): 修正租约到期与写入同刻的处理顺序
docs(redis): 补充条件删除命令的适用版本
```

项目当前使用纯前端静态部署，没有账号服务、跨设备同步、真实 Go 沙箱或线上 Redis。浏览器记录可能因清理站点数据丢失，笔记可以导出。

## 素材

Go Gopher 由 Renee French 创作，按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用，来源为 [Go 官方博客](https://go.dev/blog/gopher)。原图位于 `public/assets/gopher.png`，仅做显示尺寸调整。界面图标使用 Lucide；DM Sans 通过 Fontsource 自托管，不依赖外部字体服务。详见 [素材来源](docs/ASSETS.md)。
