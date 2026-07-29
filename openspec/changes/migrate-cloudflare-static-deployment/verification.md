# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 配置有效 | CLI | `wrangler types worker-configuration.d.ts --check` | 成功 | CI log | Passed locally |
| dry-run | CLI | `wrangler deploy --dry-run` | bundle/assets 校验成功 | CI log | Passed locally, staging/production |
| 同一 artifact | Hash | 比较 build/staging/production manifest hash | 完全一致 | release record | Planned |
| 路由兼容 | HTTP sweep | 请求 route manifest 全部路径 | 状态与基线一致 | route smoke JSON | Planned |
| 404 | HTTP | 请求随机不存在路径 | 正确 404 页面和状态 | smoke report | Current staging contract observed; candidate pending |
| 缓存/PWA | Browser/HTTP | `PLAYWRIGHT_BASE_URL=<staging> npm run test:staging` | Worker 接管、离线首页与更新策略符合契约 | trace/report | Implemented; candidate pending |
| 桌面/移动 | Browser | responsive Playwright sampling | 导航可达、无横向溢出、文章切页成功 | screenshots/trace | Passed locally; candidate pending |
| 纯静态边界 | Config/HTTP | 扫描配置并请求任意 `/api/*` | 无 Worker entrypoint/binding，路径按静态 404 处理 | config/smoke report | Passed locally |
| CI 发布契约 | Static/unit | `npm run ci:verify && npm run test:unit` | manual feature staging、默认分支 production、resource groups、freshness 成立 | log | Passed, 17 checks / 32 tests |
| 回滚 | Staging rehearsal | 发布 N+1 后恢复 N | manifest 和 URL 恢复 | rollback evidence | Planned |

## Blocking Checks

- staging 与 Pages 路由或状态码存在未解释差异。
- production job 重新构建内容。
- 无法识别或恢复上一稳定版本。
- 404、headers、PWA 或自定义域名行为异常。

## Manual Checks

- 不同浏览器和无缓存/有缓存场景。
- 从中国大陆常用网络和海外网络各做基础访问抽样（条件允许时）。
- Cloudflare Dashboard 中绑定、route 和 deployment identity 与仓库配置一致。

## Actual Results

- 当前 staging 域名已观察到 `/about` → `/about/` 307、未知路径 404、
  manifest/SW/register 200，且 Cloudflare 返回 ETag 与
  `max-age=0, must-revalidate`。
- 上述结果属于旧稳定 staging 的交付合同抽样；Astro 7 候选 deployment/version、
  全路由 sweep 和回滚证据仍等待 Runner 恢复。

## Exceptions

Cloudflare 当前 CLI 或配置字段如有变化，更新 design/tasks 并附官方文档依据后再施工。
