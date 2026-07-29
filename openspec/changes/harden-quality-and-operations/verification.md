# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| PR 门禁 | Fault injection | 令 unit/content/route 各失败一次 | PR 阻断，deploy 不运行 | pipeline links | Local fault gates passed; CI pending |
| OpenSpec | CLI | `openspec validate --all --strict` | 成功 | CI log | Passed, 8 changes |
| 资产有效 | Fault injection | 放入空 PWA 图标 | asset gate 失败 | asset report | Passed |
| preload | Browser/network | 抽样页面 trace | 无高影响无效 preload | perf report | Passed locally |
| 生命周期 | Browser | 20 次导航 | 无增长泄漏 | Playwright trace | Passed locally |
| 发布身份 | Manifest/log | 查询 production deployment | 定位双 SHA 和 Pipeline | release evidence | Previous release passed; candidate pending |
| 回滚演练 | Staging | N→N+1→N | 路由与 manifest 恢复 | rollback report | Planned |
| 依赖分类 | Audit review | 生成分类报告 | 每项有暴露/处理结论 | dependency-risk.md | Passed, 17 build-only high |
| CI 契约 | Static/unit | `npm run ci:verify` | package、retry、resource group、manual production 均受约束 | CI log | Passed, 19 checks |

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
- 本地候选：32 unit、11 browser、19 CI contract checks
- asset：178 dist files，约 6.83 MiB，PWA 155 precache entries
- CI 两周观察、staging rollback 和远端候选 Pipeline 仍未完成

## Exceptions

任何临时降级为 warning 的硬门禁必须有负责人、原因和到期日期。
