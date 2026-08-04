# atomic-cross-repo-release Specification

## Purpose
TBD - created by archiving change replace-obsidian-sync-pipeline. Update Purpose after archive.
## Requirements
### Requirement: 发布记录双提交身份
系统 SHALL 在 build manifest 和 GitLab Generic Package 中记录
`applicationCommit` 与 `contentCommit`。

#### Scenario: 生产发布成功
- **WHEN** 候选版本部署到生产
- **THEN** 可从公开或受控的 build manifest 查询该版本的两个 commit

### Requirement: 生产部署串行执行
系统 MUST 防止多个生产部署任务同时修改同一博客环境。

#### Scenario: 两个内容提交快速连续触发
- **WHEN** 两个 Pipeline 都到达 production job
- **THEN** production resource group 按确定顺序串行执行，旧版本不会在新版本之后意外覆盖

#### Scenario: 旧 Pipeline 排队后内容分支继续前进
- **WHEN** 旧候选获得 deployment resource group
- **THEN** freshness check 比较 app/content ref HEAD，并拒绝不再最新的候选

### Requirement: 阶段传递不依赖 Job Artifacts
系统 MUST 通过不可变 Generic Package 和 SHA-256 sidecar 传递内容、release
与 evidence，不得要求 GitLab Job Artifacts 服务可用。

#### Scenario: 同一证据 job 被 retry
- **WHEN** retry 产生新的 `CI_JOB_ID`
- **THEN** 新证据写入独立不可变版本，且不会覆盖或冲突于上一次尝试

### Requirement: 失败 Pipeline 不改变生产
系统 SHALL 在内容验证、测试、构建或 staging 检查失败时停止在生产部署之前。

#### Scenario: 内容存在断链
- **WHEN** Content Compiler strict validation 失败
- **THEN** production job 不运行且当前生产版本保持不变

### Requirement: 上游获得下游最终状态
系统 SHALL 让内容仓库的触发 Pipeline 反映博客下游 Pipeline 的成功或失败。

#### Scenario: 下游构建失败
- **WHEN** Astro Blog Pipeline 返回失败
- **THEN** 内容仓库对应 Pipeline 同步显示失败并可定位下游链接

