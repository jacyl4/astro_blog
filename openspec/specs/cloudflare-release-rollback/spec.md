# cloudflare-release-rollback Specification

## Purpose
TBD - created by archiving change migrate-cloudflare-static-deployment. Update Purpose after archive.
## Requirements
### Requirement: 生产发布前完成 staging 验证
系统 MUST 在 production 部署之前发布相同 artifact 到 staging 并通过自动 smoke checks。

#### Scenario: staging smoke 失败
- **WHEN** 任一关键 URL、404、资产或 manifest 检查失败
- **THEN** production job 不允许继续

#### Scenario: 功能分支需要真实候选验证
- **WHEN** 非默认分支通过 build 与 browser 门禁
- **THEN** Pipeline 提供显式 manual staging job，按该分支 HEAD 校验 freshness，
  且不创建 production job

#### Scenario: staging 部署成功
- **WHEN** 候选发布到 staging 自定义域名
- **THEN** 系统对真实域名执行全路由、404、trailing slash、PWA、桌面/移动
  生命周期和性能检查，并将证据写入 Generic Package Registry

### Requirement: 每次生产发布可识别
系统 SHALL 记录 Cloudflare deployment/version 标识、GitLab Pipeline、app SHA、content SHA 和 manifest hash。

#### Scenario: 发布完成
- **WHEN** production deploy 成功
- **THEN** 运维人员可以从发布记录定位全部版本身份

### Requirement: 上一稳定版本可恢复
系统 MUST 在生产切换前验证回滚到上一稳定 Cloudflare 版本或 Pages 回退入口的过程。

#### Scenario: 新版本路由异常
- **WHEN** 发布后触发回滚条件
- **THEN** 运维人员按手册恢复上一稳定版本并验证 manifest 与关键 URL

### Requirement: Pages 在观察期保留
系统 SHALL 在 Workers Static Assets 切换后保留原 Pages 项目一个有限观察期，作为平台级应急回退。

#### Scenario: Worker 回滚不可用
- **WHEN** Worker 版本恢复无法及时完成
- **THEN** 运维人员先验证 DNS Write 权限和已知稳定 Pages 直连部署，再恢复
  自定义域名；权限预检失败时安全中止且不先解除健康 Worker

