# 升级 Astro 主版本

## Why

当前静态博客使用 Astro 5。2026-07-27 的依赖审计显示，Astro 及其可选
sharp/esbuild 构建链存在只能通过跨主版本升级解决的公告。架构重构、内容流水线
迁移和平台切换必须先独立稳定，不能把框架主版本行为变化混入当前施工。

## Current Behavior

- Astro 5.18.x 负责静态生成，产物不包含 Node/SSR 运行时。
- Astro Content Layer 消费 `.build/content/blog`。
- `@swup/astro`、Vite PWA、Markdown/rehype/remark 与 Astro 构建耦合。
- 公开 URL 和 86 页 `<main>` HTML 已有基线。

## What Changes

- 在独立分支评估并升级到受支持的 Astro 主版本。
- 同步验证 Content Layer、Swup、PWA、Markdown sanitization 和静态产物。
- 重新分类 npm audit，并只在证据完整后接受必要的基线变化。

## Capabilities

### Modified Capabilities

- `astro-major-upgrade-safety`

## Scope

### In Scope

Astro 与直接兼容依赖、类型配置、构建配置、测试及升级文档。

### Out of Scope

视觉重设计、评论重建、内容正文修改、Cloudflare 动态 Worker 或 URL 迁移。

## Dependencies

当前重构和 Workers Static Assets staging 已稳定；至少存在一个可回滚的生产版本。

## Impact

Astro 配置、Content Layer、客户端集成、PWA 构建、Markdown pipeline 与 lockfile。

## Risk Summary

主版本可能改变路由、Content Layer、HTML 输出、Vite、图片处理和集成事件。必须按
依赖组逐步升级，并以 route、HTML、浏览器和 staging 证据阻断漂移。

## Rollback Triggers

- 公开 URL 或核心 HTML 出现未批准变化；
- Content Layer、Swup 或 PWA 行为无法与基线解释；
- 新 audit 风险或构建不稳定高于当前版本；
- staging 回滚失败。
