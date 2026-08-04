# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 精确内容 SHA | CI | 输出 `git -C $CONTENT_WORKTREE rev-parse HEAD` | 等于 CONTENT_SHA | prepare log | Passed in pipelines `#434/#437/#440` |
| 源码目录不写入 | Git diff | build 前后 `git status --porcelain` | 只出现允许的构建目录 | CI log | Passed |
| 删除无残留 | Integration | commit A 有文件、commit B 删除后分别构建 | B 产物无旧文件 | manifest diff | Passed in unit and final clean content release |
| 双 SHA | Package | 检查 build manifest | 两 SHA 正确 | build manifest | Passed in production |
| 失败不部署 | Negative CI | 旧候选在新内容 HEAD 后到达 staging | production job 不运行 | pipeline graph | Passed: app `#432`, staging `#735`, production `#736` skipped |
| 并发顺序 | Concurrency | 快速触发 C、D | resource group 串行，旧候选 freshness 失败，最终为 D | deployment log | Passed live |
| 上游状态 | Cross-project | 下游成功/失败经 mirror 回传 | 内容 Pipeline 状态等于下游 | upstream log | Passed live |
| 无绝对路径 | Static check | `npm run paths:verify` | 零匹配 | report | Passed, 355 tracked files |
| 无 Job Artifacts 依赖 | Static check | `npm run ci:verify` | 无 job artifacts，package/version/retry 契约有效 | CI contract log | Passed, 21 checks |

## Blocking Checks

- checkout HEAD 不是 CONTENT_SHA。
- app/content SHA 未进入发布清单。
- production job 可绕过 verify/build release package。
- 多 Pipeline 能并行覆盖生产。
- 应用仓重新出现内容镜像或旧同步凭据。

## Manual Checks

- 在 GitLab 确认旧 `GITLAB_TOKEN` 已删除、deployment variables 仍受保护。
- 从 build manifest 链接回对应 Pipeline 和两个 commit。
- 在一台没有旧绝对路径的新 Runner 上完成完整构建。

## Actual Results

- 内容 CI 分支 `refactor/astro-blog-openspec` 将完整 `CI_COMMIT_SHA` 和目标项目写入
  Pipeline 名称；`strategy: mirror` 提供原生下游链接。
- App CI contract 21 项检查通过。
- 快速候选 C/D 的旧候选 staging `#735` 被 freshness 拒绝，production 未运行。
- 内容 `#433/#436/#438` 分别镜像到应用 `#434/#437/#440`，三次 staging 和
  production 均成功；最终线上 content SHA 为 `7a5b125…`。
- 旧 rsync job 已退出默认分支，长期 `GITLAB_TOKEN` 删除后剩余数量为 0。
- 完整表格见 `operations/content-trigger-migration-evidence-2026-07-30.md`。

## Exceptions

若 CI_JOB_TOKEN 因组织策略不可用，记录 Deploy Token 权限、轮换和撤销流程。
