# 内容编写指南

## 一个知识点的最小闭环

1. 说明具体场景与目标，先让读者知道为什么需要它。
2. 给出准确的结论，并标注产品、版本和必要前提。
3. 用机制、代码或可验证例子解释为什么成立。
4. 至少给出一个反例或故障条件，避免绝对化表达。
5. 穿插一道预测题，再解释每个选项。
6. 将追问按失效前提展开，最后压缩成面试表达与记忆点。
7. 列出一手资料、核验日期与待确认事项。

## 编辑现有正文

正文位于 `src/content/lessons/`，使用 Markdown 与 React 组件混排。第一章的元信息、题目和追问按节放在 `src/content/go/*.ts`；序章元信息位于 `curriculum.ts`。顶层小节有稳定的 `id`，与该节元信息中的 `sections` 对应；修改标题时尽量保留 ID，避免破坏收藏和搜索锚点。

```mdx
<section id="stable-section-id" className="lesson-section">

<div className="section-kicker">01 / 一个具体问题</div>

## 标题讲清这节解决什么

先用正文描述问题，再给出代码或实验。

<Callout title="先明确适用范围" kind="fact">
  规范保证、运行时实现与工程经验，需要分别表述。
</Callout>

<Quiz id="已注册的题目 ID" />

</section>
```

代码围栏必须写语言名，例如 `go`、`sql`、`lua`、`redis`、`json`、`bash`。构建期 Shiki 提供双主题高亮；未知语言会导致构建失败，应该修正语言声明，不要静默退回无高亮展示。解释性的短代码使用内联代码。

`Callout` 支持 `note`、`warning`、`fact`。不要把整篇正文塞进提示框；仅把重要边界和容易混淆的结论突出。

## 新增练习

在各节元信息文件定义题目，并汇入 `src/content/questions.ts`，ID 要稳定且唯一。每一项必须有解释，包括错误选项。答案采用从 0 开始的下标。

```ts
{
  id: '明确且稳定的题目标识',
  lessonId: '所属章节的稳定 ID',
  title: '练习小标题',
  prompt: '具体问题，写清前提',
  options: ['选项一', '选项二', '选项三'],
  answer: 1,
  explanations: ['为什么错', '为什么对', '为什么错'],
  takeaway: '可以在面试里展开解释的记忆点',
}
```

正文通过 `<Quiz id="..." />` 引用。练习回顾读取同一份题目数据，不再复制题目或答案。修改已经发布的选项顺序或语义时，应迁移或清除对应历史答题记录，不能让旧下标误指向新答案。

## 新增实验

先把模型放在 `src/lib/`，用可测试的纯函数定义输入、事件和输出；再在 `src/components/` 添加界面，并注册到 `Lesson.tsx` 的 MDX 组件映射。

- 使用受限的结构化输入，不使用 `eval` 或 `new Function`。
- 参数变化应清除旧运行结果，避免结果与当前参数错配。
- 提供暂停、重放或单步等必要控制，完整说明模拟假设。
- 区分“本次事件序列成功”和“所有故障模型下正确”。
- 测试真正重要的边界，例如到期同刻、所有权变化和旧写入。
- 需要执行真实 Go 时，必须另外设计服务端沙箱、限时限额与隔离；本项目的 JSON 模拟器不能承担这个职责。

固定的 Go 教学案例放在 `examples/go/`，通过本地 `go test` 验证；不需要为固定测试开放 Web 执行接口。输出、反例、编译失败条件与性能结论应有相应证据，基准必须记录环境和结果的使用方式。

## 发布新章节

从 `docs/templates/lesson.mdx` 开始编写正文，在 `src/content/lessons.ts` 的 `lessons` 数组中注册一个 `LessonDefinition`，包含以下信息：

- 全局唯一的稳定 `id`，匹配 `[a-z0-9-]+`；`path` 使用 `/learn/章节ID`。
- `moduleId` 对应课程地图中的模块；`label` 是简短章节名，`title` 与 `shortTitle` 分别用于页首和导航。
- `description` 是页首简介，`minutes`、`labCount` 是实际内容的阅读时间和实验数量。
- `sections` 的 `id` 必须对应正文锚点；`keywords` 用于搜索，避免把所有关键词无差别绑定到每个小节。
- `sources` 写实际参考资料；`verifiedAt` 写人工核验日期；每篇必须保留 `sources` 章节。
- `Content` 使用 `lazy(() => import('./lessons/新章节.mdx'))`，保持正文按需加载。
- `intro` 是可选的阅读提示。正文按需使用 `<SourceList />` 与 `<LessonFinish />`，它们读取当前章节元信息。

路由、侧栏、课程地图、搜索、完成进度和笔记选择会自动读取注册表，发布普通章节不需要修改它们。为新题目设置 `lessonId` 即可接入全局练习回顾。新种类的交互组件才需要扩展 MDX 组件映射。

只有完成正文与核验的章节才进入注册表；计划标题留在 `curriculum.ts`，不会生成可点击的空白课程。

当一个模块的计划范围全部完成并审计后，才将 `curriculum.ts` 中的 `contentComplete` 设为 true。该标记驱动知识地图的整章发布状态，并移除搜索中的重复规划项；它不是读者的学习完成状态。元信息文件引用 `LessonDefinition`、`Question` 等类型时使用 `import type`，避免内容注册形成运行时循环依赖。

每次发布前运行 `npm run format:check`、`npm run check`、`npm run test:e2e`，并人工检查桌面、手机与明暗主题。Go 章节还运行 `npm run test:go`；变更 Go 示例后按范围执行 `test:go:vet`、`test:go:race` 和 `test:go:fuzz`。CI 已接入这些命令。浏览器流程测试运行期间不要修改应用文件，避免热更新干扰正在播放的实验。
