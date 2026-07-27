## Purpose

将博客的内容完整性、永久 URL、模块边界、静态构建、浏览器生命周期和发布契约转化为持续执行、可定位证据的质量门禁。

## ADDED Requirements

### Requirement: Pull Request 运行快速阻断检查
系统 MUST 在每个影响应用、内容编译或发布配置的 Pull Request 上运行可重复安装、类型检查、单元测试、内容验证、路由检查和静态构建。

#### Scenario: 单元测试失败
- **WHEN** Pull Request 中任一阻断单测失败
- **THEN** 合并条件不满足且部署 job 不运行

### Requirement: Main 和 staging 运行完整验证
系统 SHALL 在默认分支候选版本上运行浏览器生命周期、全路由 smoke、资产和部署前检查。

#### Scenario: Playwright 生命周期检查失败
- **WHEN** staging 候选出现重复请求或控制器泄漏
- **THEN** production job 被阻断

### Requirement: OpenSpec change 在归档前严格验证
系统 MUST 对活动 change 执行严格结构和需求验证，并在实现后执行对应 `/opsx:verify` 证据检查。

#### Scenario: Spec scenario 缺失
- **WHEN** 活动 change 的 requirement 没有合法 scenario
- **THEN** OpenSpec strict validation 失败

### Requirement: CI 输出可定位证据
系统 SHALL 保存测试报告、route/content/build manifests、browser traces 和部署记录，并设置合理保留期。

#### Scenario: 生产回归调查
- **WHEN** 运维人员按 deployment ID 调查问题
- **THEN** 可以找到对应 Pipeline 的构建和测试证据
