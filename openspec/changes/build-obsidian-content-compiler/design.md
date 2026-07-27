# Design

## Context

Astro 应消费已经规范化的内容，而不是承担 Obsidian 兼容层。编译器要适合 GitLab CI、可在本地运行、输出确定性，并允许现有内容逐步收紧。

## Goals

- 建立独立内容编译边界。
- 复用成熟 Markdown AST 生态。
- 对链接、身份和 `Blog/` 发布边界执行全局验证。
- 生成可供 Astro、CI 和审计使用的 manifest。

## Non-Goals

- 不直接输出最终站点 HTML。
- 不把 Obsidian 变成运行时依赖。
- 不在首版实现所有 note transclusion 和插件语法。

## Architecture and Boundaries

```text
tools/content-compiler/
├── index.ts                 # CLI
├── config.ts
├── model.ts
├── inventory.ts             # Pass 1
├── compiler.ts              # Pass 2 orchestration
├── diagnostics.ts
├── manifests.ts
├── output-transaction.ts
├── plugins/
│   ├── frontmatter.ts
│   ├── wikilinks.ts
│   ├── callouts.ts
│   ├── headings.ts
│   └── unsupported.ts
└── tests/fixtures/
```

Astro 只读取 `.build/content/blog`。该目录加入 `.gitignore`，由本地 prepare 命令和 CI prepare job 生成。

## Data and Artifact Flow

### Pass 1：Inventory

1. 扫描 `Blog/` 中允许的 `.md`/`.mdx`。
2. 解析 frontmatter。
3. 以 `Blog/` 目录成员资格判定公开状态。
4. 建立 `sourcePath → id → slug → permalink` 索引。
5. 建立 basename/shortest-path 候选索引。
6. 检测重复 id、slug 和路径歧义。

### Pass 2：Transform

1. Unified 解析 Markdown。
2. `remark-gfm` 处理 GFM。
3. `remark-frontmatter` 保留 frontmatter AST。
4. `@flowershow/remark-wiki-link` 或受控 fork 解析 wikilink 节点。
5. 自定义 transformer 解析 callout，并对本地附件生成不支持诊断。
6. 使用 inventory 解析目标 permalink。
7. 输出规范化 Markdown，并由 Astro 完成最终渲染。

### Output transaction

编译到临时目录：

```text
.build/.content-next-<uuid>
```

全部验证成功后使用目录 rename/swap 替换 `.build/content`，失败时删除临时目录，旧输出保持不变。

## Decisions

### 1. 使用 Unified/Remark AST，而非正则替换

理由：嵌套 Markdown、代码块、转义和链接别名需要语法树上下文，正则会误改代码块和文本。

### 2. 编译为标准 Markdown，而非直接 HTML

理由：保留 Astro 的 Markdown 渲染、代码高亮和组件布局能力，同时让 Obsidian 方言在上游消失。

### 3. 两阶段全局索引

理由：wikilink 解析依赖全站信息，单文件流式转换无法可靠判断歧义和发布边界。

### 4. 成熟插件只承担语法解析，业务解析由本项目控制

`@flowershow/remark-wiki-link` 可解析 `[[...]]` 语法。permalink、`Blog/` 发布边界、歧义策略和诊断仍由本项目 adapter 管理，避免第三方默认策略成为永久 URL 规则。

### 5. 兼容与严格两种模式

- `compat`：生成迁移报告，允许已有 URL 映射补位。
- `strict`：公开文章必须有 id/slug，所有断链和歧义阻断构建。

生产切换前必须进入 strict。

## Alternatives Considered

- Astro config 直接堆 remark plugin：缺少全局 inventory 和独立测试边界。
- 构建前 rsync 后原地改写 Markdown：污染源码目录且失败不原子。
- 远程 Content Loader 直接读 GitLab API：网络和鉴权进入 Astro runtime，复现性下降。
- 直接使用完整数字花园框架：会替换现有博客架构和视觉，范围过大。

## Failure Modes

- 插件升级改变 AST → fixture 和编译输出快照阻断。
- 同名短链接解析改变 → 显式歧义失败，不自动选择。
- 本地附件进入 `Blog/` → 明确阻断并要求单独设计附件发布能力。
- 编译中断留下半成品 → 临时目录 + 原子 swap。
- Vault 私有内容被索引 → 编译器输入根固定为 `Blog/`，不扫描仓库其他目录。

## Security and Integrity

- 原始 HTML 使用 allowlist 或在 Astro 渲染层统一清洗策略。
- 路径解析规范化并防止 `../` 越界。
- 只允许固定内容根 `Blog/`。
- 不执行 Dataview、模板脚本或任意 Obsidian 插件代码。

## Observability

编译摘要输出：扫描文件数、文章数、链接数、warning/error 数、内容 SHA 和 manifest hash。

## Test Strategy

- 插件单测：wikilink、callout、frontmatter 和本地附件拒绝。
- 全局集成：同名歧义、越出 `Blog/` 发布边界、循环 transclusion 诊断。
- Golden fixtures：输入笔记与预期规范化 Markdown。
- Astro 集成：编译后执行完整静态构建和 HTML smoke。
- 确定性：两个临时目录重复编译比较 hash。

## Migration Plan

1. 对现有内容运行 compat inventory。
2. 生成 id/slug/链接迁移报告。
3. 批量补录稳定字段，人工处理歧义。
4. 在不切换生产输入的情况下生成 `.build/content` 并与现有页面对比。
5. Astro staging 改读新输出。
6. 全部通过后切换 strict。

## Rollback Design

保留原 `src/content/blog` 读取 adapter 一个观察周期。通过单一配置切回 legacy source，并重新部署上一稳定构建。

## Risks and Mitigations

- [历史语法种类超出预期] → unsupported 诊断，不静默改写。
- [插件维护停滞] → 封装 adapter 和固定版本，语法 fixture 允许替换实现。
- [大量历史修复拖慢切换] → compat 报告分批修复，但生产 strict 前必须清零阻断项。

## Open Questions

无。实际 CI 已确认 `Blog/` 是目录式发布边界，当前发布树只有 Markdown；本地附件能力不在本 change 预设计。
