# Operations Index

本目录是博客构建与发布的操作契约。所有发布证据写入
`.build/evidence/`，所有可复现清单写入 `.build/manifests/`。

- [ADR-001：统一客户端生命周期](ADR-001-client-lifecycle.md)
- [内容作者与编译规范](content-authoring.md)
- [Legacy 内容适配层清理计划](legacy-content-removal-plan.md)
- [内容 Trigger 迁移与连续发布证据](content-trigger-migration-evidence-2026-07-30.md)
- [发布手册](release-runbook.md)
- [回滚手册](rollback-runbook.md)
- [内容故障手册](content-incident-runbook.md)
- [资产故障手册](asset-incident-runbook.md)
- [依赖风险登记](dependency-risk-register.md)
- [性能与网络预算](performance-budget.md)
- [发布证据模板](release-evidence-template.md)

## 证据目录约定

| 路径 | 内容 | 保留要求 |
| --- | --- | --- |
| `.build/evidence/` | check、测试、audit、HTTP smoke、部署身份 | 不可变 Generic Package；按项目保留策略清理 |
| `.build/manifests/` | route、asset、build manifest | 与候选 artifact 一起保留 |
| `dist/_meta/build-manifest.json` | 可从已部署站点读取的构建身份 | 随部署产物 |
| `baselines/` | 已批准 URL/HTML/资产基线 | 版本控制，变更需评审 |

任何证据都不得包含 CI token、Cloudflare token、OAuth secret、Cookie 或文章正文。
`npm run evidence:privacy` 在 verify lane 对高确定性凭据和私有 Vault 路径执行阻断扫描。
