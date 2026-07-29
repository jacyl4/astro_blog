# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 可重复安装 | CI | `npm ci` 后检查 lockfile | 成功且 lockfile 无变化 | CI job log | Passed locally |
| 静态构建 | CI | `npm run check && npm run build` | 成功，页面数与基线一致 | build log | Passed |
| 路由稳定 | Artifact diff | `npm run routes:verify` | 无未批准删除或改变 | `.build/route-diff.json` | Passed, 86 routes |
| 构建身份 | Artifact | 检查 build manifest | app/content SHA 与 Pipeline 一致 | `.build/build-manifest.json` | Passed locally and Pipeline #421 staging |
| 重复 slug | Unit test | `npm run test:unit` | 冲突 fixture 明确失败 | test report | Passed |
| 评论 UI 为零 | Browser | 打开文章并检查 DOM | 不存在评论控件 | Playwright report | Passed |
| 评论网络为零 | Browser | 记录首次加载和切页请求 | 无 comments/auth 请求 | Playwright trace | Passed |
| 仓库零残留 | Static scan | `npm run comments:verify-removed` | 仅历史报告与退役证据允许命中 | decommission report | Passed |
| Cloudflare 零残留 | Cloudflare/API/DNS | 列出 Worker、route、domain、D1、secret 和 DNS | 所有现有评论资源均不存在 | decommission report | Passed during decommission |
| OAuth/CI 零残留 | Provider/UI/API | 检查 OAuth App、GitHub/GitLab variables/secrets/workflows | 不存在评论凭据或自动化 | decommission report | Passed during decommission |

## Blocking Checks

- 任何现有 URL 缺失且无 redirect 映射。
- 页面总数异常减少。
- 任何评论 UI、资源、请求、Cookie、环境变量、Worker、D1、OAuth、secret、DNS 或 adapter 仍然存在。
- collection 错误被吞并并生成空站点。

## Manual Checks

- 首页、归档、分类、标签各抽查一页。
- 20 篇文章覆盖中文标题、英文标题、重复相似标题、脚注、代码块和图片。
- 检查生产浏览器 Cookie 和网络中不存在评论会话痕迹。
- 检查删除前资源清单和可选 D1 导出可定位，且不含 secret。

## Actual Results

- 候选 commit：`aa62a37`
- route：86，评论动态路径 `/api/comments`、`/auth/session` 均为 404
- unit/browser：35/11
- production smoke 已由 Pipeline `#407` 完成；当前候选 Pipeline `#421` 的
  staging `86 + 3`、Playwright `11/11` 也已通过
- 最终 verify/archive 仍是未完成 rollout 门

## Exceptions

任何基线中已存在的异常 URL 必须作为已知债务登记，不在本 change 静默修正。
