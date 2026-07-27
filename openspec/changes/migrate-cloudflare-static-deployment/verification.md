# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 配置有效 | CLI | `wrangler types worker-configuration.d.ts` 后检查生成文件无漂移 | 成功 | CI log | Planned |
| dry-run | CLI | `wrangler deploy --dry-run` | bundle/assets 校验成功 | CI log | Planned |
| 同一 artifact | Hash | 比较 build/staging/production manifest hash | 完全一致 | release record | Planned |
| 路由兼容 | HTTP sweep | 请求 route manifest 全部路径 | 状态与基线一致 | route smoke JSON | Planned |
| 404 | HTTP | 请求随机不存在路径 | 正确 404 页面和状态 | smoke report | Planned |
| 缓存/PWA | Browser/HTTP | 检查 cache headers 和 SW upgrade | 符合策略 | trace/report | Planned |
| 纯静态边界 | Config/HTTP | 扫描配置并请求任意 `/api/*` | 无 Worker entrypoint/binding，路径按静态 404 处理 | config/smoke report | Planned |
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

填写 Worker 名称、deployment/version ID、域名切换时间、route 数量、错误率和回滚演练结果。

## Exceptions

Cloudflare 当前 CLI 或配置字段如有变化，更新 design/tasks 并附官方文档依据后再施工。
