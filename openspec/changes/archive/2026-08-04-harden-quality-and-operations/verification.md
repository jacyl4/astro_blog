# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| PR 门禁 | Fault injection | 令 unit/content/route 各失败一次 | PR 阻断，deploy 不运行 | pipeline links | Local fault gates and Pipeline #423 passed |
| OpenSpec | CLI | `openspec validate --all --strict` | 成功 | CI log | Passed; remaining changes are ready for final archive |
| 资产有效 | Fault injection | 放入空 PWA 图标 | asset gate 失败 | asset report | Passed |
| preload | Browser/network | 抽样页面 trace | 无高影响无效 preload | perf report | Passed locally |
| 生命周期 | Browser | 20 次导航 | 无增长泄漏 | Playwright trace | Passed locally and staging |
| 发布身份 | Manifest/log | 查询 production deployment | 定位双 SHA 和 Pipeline | release evidence | Previous production and current staging passed |
| 回滚演练 | Staging | N→N−1→N | HTML/manifest/runtime identity 与路由恢复 | rollback report | Passed between versions `05193450-…` and `cc7a9a1e-…` |
| 依赖分类 | Audit review | 生成分类报告 | 每项有暴露/处理结论 | dependency-risk.md | Passed, 17 build-only high |
| CI 契约 | Static/unit | `npm run ci:verify` | package、retry、resource group、manual production 和单次 Astro check 均受约束 | CI log | Passed locally; final main pipeline is the closing proof |

## Blocking Checks

- 确定性错误不能阻断 PR 或 production。
- production 无法定位 build manifest。
- 资产 gate 对零字节/缺失文件放行。
- staging browser failure 仍允许 production。
- 回滚演练无法恢复关键路径。

## Manual Checks

- 审核 CI 总耗时和开发体验。
- 审核日志和 artifact 可见性。
- 审核性能预算是否基于真实页面而非模板值。

## Actual Results

- fault injection：empty icon、broken link、deleted route、lifecycle listener 均被拒绝
- 本地候选：35 unit、11 browser；CI contract 已增加“verify 独占 Astro check、
  build 不重复检查”的确定性约束
- asset：178 dist files，约 6.83 MiB，PWA 155 precache entries
- Pipeline `#423` 自动阶段和功能分支 manual staging `#709` 成功；真实域名
  `86 + 3`、Playwright `11/11` 和性能硬预算通过
- staging 在版本 `05193450-… → cc7a9a1e-… → 05193450-…` 间完成真实回滚；
  两次身份门禁分别在第 5～7 与 6～8 次探测连续收敛，两端 `86 + 3` 通过，
  恢复后 Playwright `11/11` 通过
- PWA/Workbox 删除、Swup 兼容锁定、Astro 主版本和内容边界各自保留独立 commit；
  功能分支 Pipeline `#423/#441` staging 与默认分支 `#426/#442` staging/
  production 均通过，回滚目标可由 Git 历史和 Cloudflare version 恢复
- 2026-08-04 按用户决策以发现能力而非固定时长收口：历史 Pipeline
  `#423/#426/#441/#442` 已覆盖功能分支、默认分支、staging、production、retry-safe
  evidence 与真实回滚；最终候选再执行一次完整默认分支流水线作为验收。
- 门禁审计仅发现一项真重复：verify 和 build 对同一候选重复执行 Astro check。
  build 改用 `build:ci`（只执行 `astro build`），CI contract 明确拒绝恢复重复检查；
  其他门禁均覆盖独立风险阶段，予以保留。

## Exceptions

任何临时降级为 warning 的硬门禁必须有负责人、原因和到期日期。
