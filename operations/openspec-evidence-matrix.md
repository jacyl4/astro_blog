# OpenSpec Scenario → Evidence Matrix

生成日期：2026-07-29

本表由 `npm run openspec:evidence` 从所有活动 change 的 spec 生成。它保证每个
`#### Scenario` 都有证据入口，但“已映射”不等于“已通过”；`待验证` 与
`时间门` 必须保留到对应演练或观察窗口真实完成。

| Spec | Scenario | 状态 | 自动测试或人工证据 |
| --- | --- | --- | --- |
| `build-obsidian-content-compiler/specs/content-identity/spec.md` | 修改文章标题 | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:validate` |
| `build-obsidian-content-compiler/specs/content-identity/spec.md` | 发布文章缺少 slug | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:validate` |
| `build-obsidian-content-compiler/specs/content-identity/spec.md` | 历史文章缺少 id | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:validate` |
| `build-obsidian-content-compiler/specs/content-identity/spec.md` | 重复 slug | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:validate` |
| `build-obsidian-content-compiler/specs/content-integrity-validation/spec.md` | 两个目录存在同名笔记 | 已验证 | `tests/unit/content-compiler.test.ts`；`.build/diagnostics/content.json` |
| `build-obsidian-content-compiler/specs/content-integrity-validation/spec.md` | 目标文件不存在 | 已验证 | `tests/unit/content-compiler.test.ts`；`.build/diagnostics/content.json` |
| `build-obsidian-content-compiler/specs/content-integrity-validation/spec.md` | Blog 文章链接 Vault 其他目录 | 已验证 | `tests/unit/content-compiler.test.ts`；`.build/diagnostics/content.json` |
| `build-obsidian-content-compiler/specs/content-integrity-validation/spec.md` | 文章引用本地图片 | 已验证 | `tests/unit/content-compiler.test.ts`；`.build/diagnostics/content.json` |
| `build-obsidian-content-compiler/specs/content-integrity-validation/spec.md` | CI 输出错误 | 已验证 | `tests/unit/content-compiler.test.ts`；`.build/diagnostics/content.json` |
| `build-obsidian-content-compiler/specs/obsidian-content-normalization/spec.md` | 编译成功 | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:measure` |
| `build-obsidian-content-compiler/specs/obsidian-content-normalization/spec.md` | GFM fixture 编译 | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:measure` |
| `build-obsidian-content-compiler/specs/obsidian-content-normalization/spec.md` | 普通短链接 | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:measure` |
| `build-obsidian-content-compiler/specs/obsidian-content-normalization/spec.md` | 带别名和标题 | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:measure` |
| `build-obsidian-content-compiler/specs/obsidian-content-normalization/spec.md` | NOTE callout | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:measure` |
| `build-obsidian-content-compiler/specs/obsidian-content-normalization/spec.md` | 重复编译 | 已验证 | `tests/unit/content-compiler.test.ts`；`npm run content:measure` |
| `harden-quality-and-operations/specs/asset-performance-integrity/spec.md` | 图标为零字节 | 已验证 | `npm run assets:verify`；`tools/quality/fault-injection.sh`；`operations/performance-budget.md` |
| `harden-quality-and-operations/specs/asset-performance-integrity/spec.md` | preload 目标不存在 | 已验证 | `npm run assets:verify`；`tools/quality/fault-injection.sh`；`operations/performance-budget.md` |
| `harden-quality-and-operations/specs/asset-performance-integrity/spec.md` | 字体包超过预算 | 已验证 | `npm run assets:verify`；`tools/quality/fault-injection.sh`；`operations/performance-budget.md` |
| `harden-quality-and-operations/specs/asset-performance-integrity/spec.md` | 文章页 preload 不使用的图片 | 已验证 | `npm run assets:verify`；`tools/quality/fault-injection.sh`；`operations/performance-budget.md` |
| `harden-quality-and-operations/specs/continuous-quality-gates/spec.md` | 单元测试失败 | 已验证 | `tools/quality/fault-injection.sh`；CI DAG contract |
| `harden-quality-and-operations/specs/continuous-quality-gates/spec.md` | Playwright 生命周期检查失败 | 已验证 | `tools/quality/fault-injection.sh`；`.gitlab-ci.yml` browser → staging needs |
| `harden-quality-and-operations/specs/continuous-quality-gates/spec.md` | Spec scenario 缺失 | 已验证 | `npm run openspec:validate`；`npm run openspec:evidence:check` |
| `harden-quality-and-operations/specs/continuous-quality-gates/spec.md` | 生产回归调查 | 待验证 | `.gitlab-ci.yml`；JUnit/Playwright trace；本矩阵的 `npm run openspec:evidence:check` |
| `harden-quality-and-operations/specs/operational-observability/spec.md` | 查询线上版本 | 已验证 | `operations/staging-rollback-evidence-2026-07-29.md`；公开 build manifest；Wrangler version |
| `harden-quality-and-operations/specs/operational-observability/spec.md` | 生产部署完成 | 已验证 | Pipeline `#407` production release evidence；公开 production build manifest |
| `harden-quality-and-operations/specs/operational-observability/spec.md` | 回滚演练 | 已验证 | `wrangler.jsonc` observability；release evidence；`operations/staging-rollback-evidence-2026-07-29.md` |
| `harden-quality-and-operations/specs/operational-observability/spec.md` | audit 报告含高危开发依赖 | 已验证 | `operations/dependency-risk-register.md`；Astro 7 npm audit baseline |
| `migrate-cloudflare-static-deployment/specs/cloudflare-release-rollback/spec.md` | staging smoke 失败 | 已验证 | Pipeline `#419` staging smoke 阻断；production job 不可达 |
| `migrate-cloudflare-static-deployment/specs/cloudflare-release-rollback/spec.md` | 功能分支需要真实候选验证 | 已验证 | Pipeline `#423` / Job `#709`；`operations/staging-rollback-evidence-2026-07-29.md` |
| `migrate-cloudflare-static-deployment/specs/cloudflare-release-rollback/spec.md` | staging 部署成功 | 已验证 | Pipeline `#423` / Job `#709`；`86 + 3` HTTP sweep；Playwright `11/11` |
| `migrate-cloudflare-static-deployment/specs/cloudflare-release-rollback/spec.md` | 发布完成 | 已验证 | 三方 deployment identity 收敛；Generic Package staging evidence |
| `migrate-cloudflare-static-deployment/specs/cloudflare-release-rollback/spec.md` | 新版本路由异常 | 已验证 | `05193450-… → cc7a9a1e-… → 05193450-…`；两端 `86 + 3` HTTP sweep；恢复后 Playwright `11/11` |
| `migrate-cloudflare-static-deployment/specs/cloudflare-release-rollback/spec.md` | Worker 回滚不可用 | 待验证 | `operations/rollback-runbook.md`；Worker version rollback 已验证；Pages 平台级回退待演练 |
| `migrate-cloudflare-static-deployment/specs/cloudflare-static-delivery/spec.md` | CI 部署 | 已验证 | `.gitlab-ci.yml`；`npm run cloudflare:verify-static`；`npm run http:sweep` |
| `migrate-cloudflare-static-deployment/specs/cloudflare-static-delivery/spec.md` | production job 开始 | 已验证 | `.gitlab-ci.yml`；`npm run cloudflare:verify-static`；`npm run http:sweep` |
| `migrate-cloudflare-static-deployment/specs/cloudflare-static-delivery/spec.md` | 请求既有文章 URL | 已验证 | `.gitlab-ci.yml`；`npm run cloudflare:verify-static`；`npm run http:sweep` |
| `migrate-cloudflare-static-deployment/specs/cloudflare-static-delivery/spec.md` | 请求不存在路径 | 已验证 | `.gitlab-ci.yml`；`npm run cloudflare:verify-static`；`npm run http:sweep` |
| `migrate-cloudflare-static-deployment/specs/cloudflare-static-delivery/spec.md` | 访问任意 API 路径 | 已验证 | `.gitlab-ci.yml`；`npm run cloudflare:verify-static`；`npm run http:sweep` |
| `replace-obsidian-sync-pipeline/specs/atomic-cross-repo-release/spec.md` | 生产发布成功 | 待验证 | `tools/ci/prepare-content.sh`；双仓连续提交和失败传播演练 |
| `replace-obsidian-sync-pipeline/specs/atomic-cross-repo-release/spec.md` | 两个内容提交快速连续触发 | 待验证 | `tools/ci/prepare-content.sh`；双仓连续提交和失败传播演练 |
| `replace-obsidian-sync-pipeline/specs/atomic-cross-repo-release/spec.md` | 旧 Pipeline 排队后内容分支继续前进 | 已验证 | `tests/unit/ci-contract.test.ts` freshness rejection；deployment resource groups |
| `replace-obsidian-sync-pipeline/specs/atomic-cross-repo-release/spec.md` | 同一证据 job 被 retry | 已验证 | `npm run ci:verify`；evidence package version includes `CI_JOB_ID` |
| `replace-obsidian-sync-pipeline/specs/atomic-cross-repo-release/spec.md` | 内容存在断链 | 待验证 | `tools/ci/prepare-content.sh`；双仓连续提交和失败传播演练 |
| `replace-obsidian-sync-pipeline/specs/atomic-cross-repo-release/spec.md` | 下游构建失败 | 待验证 | `tools/ci/prepare-content.sh`；双仓连续提交和失败传播演练 |
| `replace-obsidian-sync-pipeline/specs/immutable-content-build-input/spec.md` | 内容仓库触发下游 Pipeline | 待验证 | `tools/ci/prepare-content.sh`；Generic Package Registry 双 SHA 证据；删除文章演练 |
| `replace-obsidian-sync-pipeline/specs/immutable-content-build-input/spec.md` | 内容仓库随后出现新提交 | 待验证 | `tools/ci/prepare-content.sh`；Generic Package Registry 双 SHA 证据；删除文章演练 |
| `replace-obsidian-sync-pipeline/specs/immutable-content-build-input/spec.md` | CI 构建完成 | 已验证 | `tools/ci/prepare-content.sh`；source path read-only checks |
| `replace-obsidian-sync-pipeline/specs/immutable-content-build-input/spec.md` | 一篇文章在内容提交中被删除 | 已验证 | Content Compiler clean-output integration test；route manifest diff |
| `replace-obsidian-sync-pipeline/specs/portable-content-development/spec.md` | 开发者使用本地 Vault | 已验证 | `operations/content-authoring.md`；`npm run paths:verify`；Content Compiler source-path tests |
| `replace-obsidian-sync-pipeline/specs/portable-content-development/spec.md` | 未提供本地内容源 | 已验证 | `operations/content-authoring.md`；`npm run paths:verify`；Content Compiler source-path tests |
| `replace-obsidian-sync-pipeline/specs/portable-content-development/spec.md` | 执行架构路径检查 | 已验证 | `operations/content-authoring.md`；`npm run paths:verify`；Content Compiler source-path tests |
| `unify-client-page-lifecycle/specs/client-async-cancellation/spec.md` | 请求期间切换文章 | 已验证 | `tests/unit/page-lifecycle.test.ts` 的 generation、destroy 和 AbortSignal 测试 |
| `unify-client-page-lifecycle/specs/client-async-cancellation/spec.md` | 取消信号延迟生效 | 已验证 | `tests/unit/page-lifecycle.test.ts` 的 generation、destroy 和 AbortSignal 测试 |
| `unify-client-page-lifecycle/specs/page-lifecycle-consistency/spec.md` | 首次页面加载 | 已验证 | `tests/browser/lifecycle.spec.ts`；`.build/evidence/lifecycle-event-order.json` |
| `unify-client-page-lifecycle/specs/page-lifecycle-consistency/spec.md` | 客户端切换页面 | 已验证 | `tests/browser/lifecycle.spec.ts`；`.build/evidence/lifecycle-event-order.json` |
| `unify-client-page-lifecycle/specs/page-lifecycle-consistency/spec.md` | 连续导航二十次 | 已验证 | `tests/browser/lifecycle.spec.ts`；`.build/evidence/lifecycle-event-order.json` |
| `unify-client-page-lifecycle/specs/page-lifecycle-consistency/spec.md` | 浏览器后退 | 已验证 | `tests/browser/lifecycle.spec.ts`；`.build/evidence/lifecycle-event-order.json` |
| `unify-client-page-lifecycle/specs/page-lifecycle-consistency/spec.md` | 连续调整窗口大小 | 已验证 | `tests/browser/lifecycle.spec.ts`；`.build/evidence/lifecycle-event-order.json` |
| `upgrade-astro-major/specs/astro-major-upgrade-safety/spec.md` | 升级需要无关架构改造 | 已验证 | `operations/astro-7-upgrade.md`；route/HTML/static/PWA/browser gates |
| `upgrade-astro-major/specs/astro-major-upgrade-safety/spec.md` | 构建引入服务端运行时 | 已验证 | `operations/astro-7-upgrade.md`；route/HTML/static/PWA/browser gates |
| `upgrade-astro-major/specs/astro-major-upgrade-safety/spec.md` | HTML 基线存在未批准变化 | 已验证 | `operations/astro-7-upgrade.md`；route/HTML/static/PWA/browser gates |

## 门禁

- `npm run openspec:evidence:check`：检测 spec 新增、删除或矩阵漂移。
- `npm run openspec:validate`：验证 OpenSpec 结构和 requirement/scenario 格式。
- 只有状态为“已验证”且其命令在候选提交上通过，才可关闭对应任务。
