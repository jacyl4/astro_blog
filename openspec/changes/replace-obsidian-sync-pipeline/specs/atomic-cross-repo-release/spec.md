## Purpose

将应用代码和内容提交组合成一个可追溯发布单元，并确保并发流水线、失败构建和回滚都指向明确的双提交版本。

## ADDED Requirements

### Requirement: 发布记录双提交身份
系统 SHALL 在 build manifest 和 GitLab artifact 中记录 `applicationCommit` 与 `contentCommit`。

#### Scenario: 生产发布成功
- **WHEN** 候选版本部署到生产
- **THEN** 可从公开或受控的 build manifest 查询该版本的两个 commit

### Requirement: 生产部署串行执行
系统 MUST 防止多个生产部署任务同时修改同一博客环境。

#### Scenario: 两个内容提交快速连续触发
- **WHEN** 两个 Pipeline 都到达 production job
- **THEN** production resource group 按确定顺序串行执行，旧版本不会在新版本之后意外覆盖

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
