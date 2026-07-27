# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| PR 门禁 | Fault injection | 令 unit/content/route 各失败一次 | PR 阻断，deploy 不运行 | pipeline links | Planned |
| OpenSpec | CLI | `openspec validate --all --strict` | 成功 | CI log | Planned |
| 资产有效 | Fault injection | 放入空 PWA 图标 | asset gate 失败 | asset report | Planned |
| preload | Browser/network | 抽样页面 trace | 无高影响无效 preload | perf report | Planned |
| 生命周期 | Browser | 20 次导航 | 无增长泄漏 | Playwright trace | Planned |
| 发布身份 | Manifest/log | 查询生产 deployment | 定位双 SHA 和 Pipeline | release evidence | Planned |
| 回滚演练 | Staging | N→N+1→N | 路由与 manifest 恢复 | rollback report | Planned |
| 依赖分类 | Audit review | 生成分类报告 | 每项有暴露/处理结论 | dependency-risk.md | Planned |

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

填写 CI 中位耗时、门禁失败样例、资产节省、性能基线、日志查询和回滚结果。

## Exceptions

任何临时降级为 warning 的硬门禁必须有负责人、原因和到期日期。
