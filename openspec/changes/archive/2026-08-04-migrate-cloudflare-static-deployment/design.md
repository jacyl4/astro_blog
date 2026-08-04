# Design

## Context

Astro 保持静态站点。Cloudflare Workers Static Assets 将 `dist`、环境、版本与回滚置于同一仓库化交付模型，不引入动态代码。

## Goals

- Wrangler 管理 staging/production 静态发布。
- 静态路由和缓存行为与现有 Pages 等价。
- 发布 artifact 不在部署阶段重新构建。
- 具备版本身份、观测和回滚。

## Non-Goals

- 不将页面切换到 SSR。
- 不实现任何动态 API、Service Binding 或数据 binding。
- 不在本 change 调整内容或页面模块。

## Architecture and Boundaries

```text
wrangler.jsonc
  assets.directory = ./dist
  staging / production env
```

配置不包含 `main`、`run_worker_first`、`services`、D1、KV 或 R2 binding。

## Data and Artifact Flow

```text
build job: dist + manifests
  → staging deploy same artifact
  → smoke tests
  → manual protected production deploy
  → record deployment/version
```

## Decisions

### 1. Workers Static Assets 作为目标交付面

理由：静态站点保持简单，同时获得仓库化配置、同一 artifact 的 staging/production 发布和版本回滚能力。

### 2. `wrangler.jsonc` 而非分散 Dashboard 设置

公开配置版本化、可审查；secret 保持在 Cloudflare/GitLab secret 系统。

### 3. staging 和 production 使用同一配置模型

环境只覆盖名称、route 和必要变量，避免两套手写配置漂移。

### 4. build once, deploy many

staging 与 production 部署同一个 `dist` artifact，生产 job 不执行 `astro build`。

### 5. Pages 延迟下线

平台迁移有 DNS/route/缓存不确定性，保留稳定 Pages 一个观察期比立即删除成本更低。

## Alternatives Considered

- 继续 Pages Git Integration：对单仓静态站点简单，但双仓 prepare、build-once/deploy-many 和版本证据仍较分散。
- Pages Direct Upload：可继续使用，但长期仍是 Pages/Worker 两套边界。
- Astro SSR on Workers：增加运行时和故障面，没有当前需求。

## Failure Modes

- trailing slash 差异 → 全路由 baseline 请求测试。
- `_headers`/重定向处理差异 → staging 响应头对比。
- 404 状态不一致 → 专门 smoke。
- Service Worker 持有旧资源 → 版本化缓存和升级场景测试。
- `compatibility_date` 漂移 → 定期显式升级，升级单独 PR。
- Dashboard 配置覆盖 → IaC/配置审计和文档化手工项。

## Security and Integrity

- API Token 最小权限、masked、protected。
- deployment job 仅默认分支和受保护环境可运行。
- 不配置动态 Worker entrypoint、service binding、数据 binding 或已退役能力的 secret。
- build manifest 可公开，但不包含 secret 或内部 token。

## Observability

记录 deployment identity、Wrangler 输出、manifest 和外部 HTTP smoke。静态资产默认不执行 Worker，因此不把 Worker request logs 或 tracing 当作纯静态站点的可观测性来源。

## Test Strategy

- Wrangler config schema/type check。
- `wrangler deploy --dry-run`。
- staging 全 route manifest 请求。
- headers、404、资产 cache-control、PWA 更新。
- production 后 manifest 与抽样 URL。
- 实际回滚演练。

## Migration Plan

1. 创建 staging Worker。
2. 发布当前稳定 dist 并全量对比。
3. 创建 production Worker，但不切域名。
4. 发布同一 artifact。
5. 低流量窗口切换 route/domain。
6. 观察七天。
7. 停止 Pages 自动部署并最终下线。

## Rollback Design

首选 Wrangler version rollback；次选恢复自定义域名至 Pages。两种路径在生产切换前均记录并至少演练一次 staging 等价流程。

## Risks and Mitigations

- [Cloudflare CLI/配置持续变化] → 每次施工前查询当前文档和本地 config schema。
- [静态资产版本回滚限制] → 切换前验证实际账户和计划上的回滚行为，保留 Pages 兜底。

## Open Questions

- 已确认生产域名由 Worker custom domain 提供；Pages 项目冻结且仅保留
  `blog-4la.pages.dev`。回退前必须具备 DNS Write，并先完成 Pages 直连 sweep。
- 当前 Service Worker 缓存策略需要从源码验证后补充精确清理规则。
