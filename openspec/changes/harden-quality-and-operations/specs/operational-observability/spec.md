## Purpose

让每次构建、部署和线上异常都能通过统一身份和结构化证据被查询，并确保团队能够执行已经验证的回滚流程。

## ADDED Requirements

### Requirement: 发布日志包含统一身份
系统 SHALL 在 GitLab 和 Cloudflare 发布记录中包含 deployment ID、app SHA、content SHA、route hash 和 Pipeline URL。

#### Scenario: 查询线上版本
- **WHEN** 运维人员读取当前 build manifest 或 deployment log
- **THEN** 能定位两个源提交和对应 Pipeline

### Requirement: 发布证据机器可读
系统 MUST 将部署版本、manifest hash、Pipeline、环境和回滚结果保存为结构化发布证据，不依赖临时终端输出。

#### Scenario: 生产部署完成
- **WHEN** production job 完成 smoke 或回滚
- **THEN** evidence artifact 包含环境、deployment identity、app/content SHA、manifest hash、Pipeline URL 和结果，且不记录 secret

### Requirement: 回滚定期演练
系统 SHALL 在重大发布模型变更后和周期性维护窗口执行 staging 回滚演练。

#### Scenario: 回滚演练
- **WHEN** 运维人员按 runbook 恢复上一版本
- **THEN** 关键 URL、manifest 和版本身份恢复并留下证据

### Requirement: 依赖风险分类治理
系统 SHALL 将依赖漏洞按生产运行、构建工具、开发工具和不可达路径分类，并使用独立 PR 分批升级。

#### Scenario: audit 报告含高危开发依赖
- **WHEN** 风险只存在于不进入生产 bundle 的工具链
- **THEN** 风险登记说明实际暴露和升级计划，而不是与运行漏洞混为同一结论
