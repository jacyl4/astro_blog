# 模块化 Blog 领域

## Why

当前 BlogService 同时承担 Content Collections 读取、标题和 category 规范化、slug 分配、tag 清洗、排序、缓存以及所有 selector。它是高连接割点，任何改动都需要同时理解框架、领域规则和页面需求。

## Current Behavior

页面多数通过 BlogService 获取文章数据，这是正确的方向；服务内部职责过度集中，slug 和显示标题还包含隐含契约。

## What Changes

- 建立 `src/modules/blog` 模块。
- 纯领域逻辑不依赖 `astro:content`。
- Astro Content Collection 访问集中到 infrastructure adapter。
- 页面通过模块 `index.ts` 公共入口调用应用服务。
- 保留短期兼容 façade，逐页迁移后移除旧 BlogService。
- 增加导入边界和循环依赖检查。

## Capabilities

### New Capabilities

- `blog-module-boundary`：建立可由静态检查和测试验证的 Blog 模块公开入口、依赖方向与框架隔离契约。

### Modified Capabilities

无。URL、列表顺序、分类、标签、归档和页面输出必须保持一致。

## Scope

### In Scope

- Blog 类型、normalize、selector、repository adapter、application service。
- 页面调用迁移。
- 模块依赖规则和单元测试。

### Out of Scope

- slug 行为改变。
- 内容编译语法改变。
- 页面视觉改版。
- 缓存平台化。

## Dependencies

依赖 URL 基线；建议在内容编译器的标准模型确定后执行。

## Impact

`src/services/BlogService.ts`、相关页面、内容 adapter、测试和 import 路径。

## Risk Summary

风险来自隐含排序、标题优先级和 slug 冲突历史行为。重构采用 characterization tests 和 façade 渐进迁移。

## Rollback Triggers

任何路由、文章顺序、分类、标签、归档或 frontmatter 显示结果发生变化。
