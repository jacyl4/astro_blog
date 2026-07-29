# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 配置有效 | CLI | `wrangler types worker-configuration.d.ts --check` | 成功 | CI log | Passed locally |
| dry-run | CLI | `wrangler deploy --dry-run` | bundle/assets 校验成功 | CI log | Passed locally, staging/production |
| 同一 artifact | Hash | 比较 build/staging/production manifest hash | 完全一致 | release record | Staging passed; production candidate pending |
| 路由兼容 | HTTP sweep | 请求 route manifest 全部路径 | 状态与基线一致 | route smoke JSON | Passed on staging, 86 routes |
| 404 | HTTP | 请求随机不存在路径 | 正确 404 页面和状态 | smoke report | Passed on staging, 3 static 404 checks |
| 缓存/PWA | Browser/HTTP | `PLAYWRIGHT_BASE_URL=<staging> npm run test:staging` | Worker 接管、离线首页与更新策略符合契约 | trace/report | Passed on staging |
| 桌面/移动 | Browser | responsive Playwright sampling | 导航可达、无横向溢出、文章切页成功 | screenshots/trace | Passed on staging |
| 纯静态边界 | Config/HTTP | 扫描配置并请求任意 `/api/*` | 无 Worker entrypoint/binding，路径按静态 404 处理 | config/smoke report | Passed locally |
| CI 发布契约 | Static/unit | `npm run ci:verify && npm run test:unit` | manual feature staging、默认分支 production、resource groups、freshness 成立 | log | Passed, 21 contract checks / 34 tests |
| 回滚 | Staging rehearsal | 发布 N+1 后恢复 N | HTML/manifest/runtime identity 与 URL 恢复 | rollback evidence | Identity gate proved; final two identity-aware versions pending |

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

- Pipeline `#421` / Job `#699` 将不可变 release 发布为
  `cc7a9a1e-db98-4def-87d8-f83da17925e2`。
- 身份探测在第 20～22 次才连续确认 HTML、manifest 与 runtime asset 同时指向
  `aa62a371…`，证明门禁能够阻止传播窗口内的过早 smoke。
- 收敛后 `86 + 3` HTTP sweep、Playwright `11/11`、PWA、桌面/移动和性能硬预算
  全部通过；证据见 `operations/staging-rollback-evidence-2026-07-29.md`。
- 身份标记引入前的历史版本不能满足新门禁；最终回滚验收保持未完成，直到两个
  身份完整版本间的 N→N−1→N 演练通过。

## Exceptions

Cloudflare 当前 CLI 或配置字段如有变化，更新 design/tasks 并附官方文档依据后再施工。
