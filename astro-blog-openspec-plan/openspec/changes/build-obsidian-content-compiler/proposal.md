# 建设 Obsidian 内容编译器

## Why

当前 `jacyl4/obsidian-digital:Blog/` 中的 Markdown 被提交到 Astro Content Collection。Obsidian wikilink、callout、短链接歧义和未来插件语法会直接泄漏到站点层，使 Astro 配置同时承担内容兼容、链接解析和渲染职责。需要一个独立、确定性、可测试的编译边界。

## Current Behavior

- Obsidian 文章目录直接写入 `src/content/blog`。
- 内容 schema 较宽松，部分身份和标题从路径或 frontmatter 隐式推导。
- Wikilink 和内部引用缺少统一 inventory 与构建期完整性检查。
- Markdown 解析逻辑容易分散到 Astro config、组件和临时脚本。

## What Changes

- 建立独立 `tools/content-compiler`。
- 使用 Unified/Remark 生态解析 Markdown AST。
- 两阶段执行：先 inventory `Blog/` 中全部 Markdown 与 permalink，再转换每篇内容。
- 支持 frontmatter、GFM、Obsidian wikilink、heading link 和 callout。
- 输出标准化 Markdown、内容 manifest 和结构化诊断。
- 引入稳定 `id`、`slug` 与 `title` 分离规则。
- 通过兼容模式迁移历史内容，最终切换严格模式。

## Capabilities

### New Capabilities

- `obsidian-content-normalization`
- `content-integrity-validation`
- `content-identity`

### Modified Capabilities

无。

## Scope

### In Scope

- `[[note]]`、别名和 heading。
- Obsidian callout 转换。
- `Blog/` 目录发布边界、断链、歧义、循环和 schema 诊断。
- 现有内容迁移工具和 fixture 测试。

### Out of Scope

- Dataview 查询。
- Canvas。
- 任意第三方 Obsidian 插件语法。
- 完整 note transclusion 第一阶段实现；只建立设计和明确诊断。
- 评论 Markdown 渲染。
- 本地图片、音频、视频和 PDF 附件发布；当前发布树仅含 Markdown，出现本地附件时必须明确失败并另开 change。

## Dependencies

依赖 `establish-refactor-baseline` 的 URL 与页面清单。

## Impact

- 新增编译器依赖和工具目录。
- Astro 内容入口改读 `.build/content`。
- 内容仓库逐步补齐永久 `id` 与 `slug`。
- CI 增加内容验证和编译 artifact。

## Risk Summary

历史内容可能存在同名笔记和不一致 frontmatter。迁移分为兼容期与严格期，不在一次提交中强制全部人工修复。

## Rollback Triggers

- 标准化后正文、代码块、脚注或链接出现系统性变化；
- 页面数量或 URL 与基线不一致；
- 编译器写回或修改原始内容仓库；
- 同一输入产生不稳定输出。
