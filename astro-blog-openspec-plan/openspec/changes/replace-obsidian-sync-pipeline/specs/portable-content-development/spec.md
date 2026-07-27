## Purpose

让本地开发、CI 和临时预览使用同一个确定性内容准备入口，消除对个人主机绝对路径、持久工作目录和手工复制步骤的依赖。

## ADDED Requirements

### Requirement: 本地内容源显式配置
系统 SHALL 通过命令参数或 `CONTENT_SOURCE_PATH` 接收本地内容目录，并使用与 CI 相同的编译器。

#### Scenario: 开发者使用本地 Vault
- **WHEN** 开发者提供合法的本地内容路径并运行 prepare 命令
- **THEN** 系统在 `.build/content` 生成预览输入，不修改 Vault

#### Scenario: 未提供本地内容源
- **WHEN** 开发者只运行测试
- **THEN** 系统使用仓库内最小 fixtures 或输出清晰配置提示，不访问 `/home/jacyl4/...`

### Requirement: 仓库不包含机器专属绝对路径
系统 MUST 在 CI、npm scripts 和运行配置中消除个人主机绝对路径。

#### Scenario: 执行架构路径检查
- **WHEN** CI 扫描脚本和配置
- **THEN** 不存在 `/home/jacyl4/` 等机器专属路径
