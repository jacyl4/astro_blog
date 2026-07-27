# 迁移 Cloudflare 静态发布

## Why

当前 Cloudflare Pages 链路能够发布站点，但工作流和配置存在分散、旧 Action 或触发范围不完整的风险。应将静态资产、版本、环境与回滚统一纳入 Wrangler 管理，并维持纯静态交付边界。

## Current Behavior

- Astro 输出 `dist/` 并发布到 Cloudflare Pages。
- Pages 与目标 Workers Static Assets 是迁移期内的两个发布单元。
- 生产配置、构建动作和回滚能力尚未完全形成仓库内契约。

## What Changes

- 创建 `wrangler.jsonc`，静态 assets 绑定 `dist/`。
- 创建 staging 和 production 环境。
- CI 执行 Wrangler type/config 检查、dry-run、staging deploy 和 production deploy。
- 验证 HTML 路由、404、headers、Service Worker 和缓存策略。
- 生产域名从 Pages 受控切换到 Workers Static Assets。
- Pages 保留观察窗口后下线。
- 不配置 Worker `main`、`run_worker_first`、service binding 或动态数据 binding。

## Capabilities

### New Capabilities

- `cloudflare-static-delivery`
- `cloudflare-release-rollback`

### Modified Capabilities

无。

## Scope

### In Scope

- Wrangler 配置和 GitLab deploy jobs。
- staging/production 环境。
- 自定义域名切换、缓存、404 和回滚演练。
- Cloudflare deployment/version 证据与外部 HTTP smoke。

### Out of Scope

- 实现任何动态 Worker API。
- 将 Astro 改为 SSR。
- 引入 D1、KV 或 R2 作为博客内容源。
- 同步进行 Astro 主版本升级。

## Dependencies

依赖稳定 CI、双仓 build manifest 和 URL 基线。

## Impact

- Cloudflare 项目、Worker 名称、域名 route。
- GitLab protected variables。
- 原 Pages deployment 和旧工作流。
- 缓存与 Service Worker 验证。

## Risk Summary

主要风险为 Pages 与 Workers Static Assets 在 trailing slash、404、headers 和 PWA 缓存上的细节差异。必须先完成 staging 全路由对比，再切换域名。

## Rollback Triggers

- 关键 URL 状态码、重定向或 HTML 行为变化；
- 404、静态资产或 Service Worker 失效；
- 生产部署无法确定版本或无法回滚；
- 自定义域名切换造成持续不可用。
