# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 配置有效 | CLI | `wrangler types worker-configuration.d.ts --check` | 成功 | CI log | Passed locally |
| dry-run | CLI | `wrangler deploy --dry-run` | bundle/assets 校验成功 | CI log | Passed locally, staging/production |
| 同一 artifact | Hash | 比较 build/staging/production manifest hash | 完全一致 | release record | Passed on Pipeline `#442` staging and production |
| 路由兼容 | HTTP sweep | 请求 route manifest 全部路径 | 状态与基线一致 | route smoke JSON | Passed on staging, 86 routes |
| 404 | HTTP | 请求随机不存在路径 | 正确 404 页面和状态 | smoke report | Passed on staging, 3 static 404 checks |
| 缓存/PWA | Browser/HTTP | `PLAYWRIGHT_BASE_URL=<staging> npm run test:staging` | Worker 接管、离线首页与更新策略符合契约 | trace/report | Passed on staging |
| 桌面/移动 | Browser | responsive Playwright sampling | 导航可达、无横向溢出、文章切页成功 | screenshots/trace | Passed on staging |
| 纯静态边界 | Config/HTTP | 扫描配置并请求任意 `/api/*` | 无 Worker entrypoint/binding，路径按静态 404 处理 | config/smoke report | Passed locally |
| CI 发布契约 | Static/unit | `npm run ci:verify && npm run test:unit` | manual feature staging、默认分支 production、resource groups、freshness 成立 | log | Passed, 21 contract checks / 35 tests |
| 回滚 | Staging rehearsal | N→N−1→N | HTML/manifest/runtime identity 与 URL 恢复 | rollback evidence | Passed between versions `05193450-…` and `cc7a9a1e-…` |
| Pages 平台回退 | Controlled production drill | Pages 直连 sweep、DNS 权限预检、安全中止、Worker 恢复 | 不损坏健康生产且步骤可执行 | `operations/pages-fallback-validation-2026-07-30.md` | Passed; final CNAME activation correctly requires DNS Write |

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

- Pipeline `#423` / Job `#709` 将不可变 release 发布为
  `05193450-0648-4e68-8850-93e46eb93419`。
- 候选发布的身份探测在第 14～16 次连续确认 HTML、manifest 与 runtime asset
  同时指向 `cd94bda9…`，证明门禁能够阻止传播窗口内的过早 smoke。
- 收敛后 `86 + 3` HTTP sweep、Playwright `11/11`、PWA、桌面/移动和性能硬预算
  全部通过；证据见 `operations/staging-rollback-evidence-2026-07-29.md`。
- 随后执行 `05193450-… → cc7a9a1e-… → 05193450-…`：回退端在第 5～7 次、
  恢复端在第 6～8 次连续收敛；两端 `86 + 3` 通过，恢复后 Playwright
  `11/11` 通过。最终回滚验收完成。
- 默认分支 Pipeline `#442` / production `#775` 后再次执行 `86 + 3` 和
  Playwright `11/11`；86 route console/pageerror/requestfailed 均为 0。
- `/`、真实 404、`/sw.js` 和 build manifest 均返回预期 content type、
  `cache-control` 与 `CF-Cache-Status: HIT`，未发现缓存或 404 异常。
- Pages 直连入口完成 `86 + 3`；实际 custom-domain 尝试在缺少 DNS Write 时以
  `CNAME record not set` 安全中止，随后 Worker 身份和 `86 + 3` 全量恢复。
  2026-08-04 复核 Pages 项目 `Git Provider: No`、Project Domains 仅
  `blog-4la.pages.dev`，证明自动部署和生产域名绑定均已移除。
- 仓库不存在 `.github/workflows`；重复 Cloudflare token 与内容仓旧触发 token
  已删除，旧实施报告的迁移期待办已更新为关闭状态。

## Exceptions

Cloudflare 当前 CLI 或配置字段如有变化，更新 design/tasks 并附官方文档依据后再施工。
