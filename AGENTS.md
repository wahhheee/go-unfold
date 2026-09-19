# 项目协作约定

- 项目为面向 Go 服务端学习的中文 Web 应用，已发布状态以章节注册表为准，规划条目不得伪装成已完成内容。
- 代码注释、文档、提交描述使用简体中文。提交采用 Conventional Commits，例如 `feat(content): 增加并发语义练习`。
- 新内容先阅读 `docs/CONTENT_POLICY.md`，事实优先引用一手资料，记录版本前提与核验日期。
- 课程正文放在 `src/content/lessons/`；交互模型放在 `src/lib/`；不要把模型规则散落进 JSX。
- 新章节通过 `src/content/lessons.ts` 注册，题目指定 `lessonId`；保护章节与题目的稳定 ID，存储变更必须有迁移。
- 使用现有 Lucide、Shiki、MDX 和 CSS 变量；同时维护浅色、暗色与手机布局。
- 不给实验接入任意代码执行，除非任务明确要求并实现独立的执行隔离。
- 修改后按影响范围运行检查；发布前执行 `npm run format:check`、`npm run check` 与 `npm run test:e2e`。
- 第一章逐节交付范围见 `docs/GO_CHAPTER.md`，每节还需运行 `npm run test:go`，检查好质量后单独提交。
