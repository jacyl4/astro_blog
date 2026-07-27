# Verification

## Evidence Matrix

| Requirement / risk | Method | Command or procedure | Expected result | Evidence path | Status |
|---|---|---|---|---|---|
| 精确内容 SHA | CI | 输出 `git -C $CONTENT_WORKTREE rev-parse HEAD` | 等于 CONTENT_SHA | prepare log | Planned |
| 源码目录不写入 | Git diff | build 前后 `git status --porcelain` | 只出现允许的构建目录 | CI log | Planned |
| 删除无残留 | Integration | commit A 有文件、commit B 删除后分别构建 | B 产物无旧文件 | manifest diff | Planned |
| 双 SHA | Artifact | 检查 build manifest | 两 SHA 正确 | build manifest | Planned |
| 失败不部署 | Negative CI | 提交断链内容 | production job 不创建/不运行 | pipeline graph | Planned |
| 并发顺序 | Concurrency | 快速触发 A、B | production 串行且最终为 B | deployment log | Planned |
| 上游状态 | Cross-project | 令下游测试失败 | 内容 Pipeline 失败并链接下游 | upstream log | Planned |
| 无绝对路径 | Static check | `npm run architecture:paths` | 零匹配 | report | Planned |

## Blocking Checks

- checkout HEAD 不是 CONTENT_SHA。
- app/content SHA 未进入发布清单。
- production job 可绕过 verify/build artifact。
- 多 Pipeline 能并行覆盖生产。
- `src/content/blog` 仍由外部同步写入。

## Manual Checks

- 在 GitLab UI 确认 protected variables 和 environment 权限。
- 从 build manifest 链接回对应 Pipeline 和两个 commit。
- 在一台没有旧绝对路径的新 Runner 上完成完整构建。

## Actual Results

填写项目路径、Pipeline IDs、测试内容 SHA、最终部署顺序和 artifact hash。

## Exceptions

若 CI_JOB_TOKEN 因组织策略不可用，记录 Deploy Token 权限、轮换和撤销流程。
