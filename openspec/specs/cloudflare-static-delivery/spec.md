# cloudflare-static-delivery Specification

## Purpose
TBD - created by archiving change migrate-cloudflare-static-deployment. Update Purpose after archive.
## Requirements
### Requirement: Wrangler 配置是发布事实源
系统 MUST 在版本控制中的 `wrangler.jsonc` 定义 Worker 名称、兼容日期、静态资产目录和环境。

#### Scenario: CI 部署
- **WHEN** Pipeline 执行 Cloudflare 发布
- **THEN** 发布命令从仓库配置读取公开配置，secret 仅来自受保护变量

### Requirement: 发布使用构建阶段的不可变 dist artifact
系统 SHALL 将已通过验证的 `dist/` artifact 部署到 Cloudflare，不在 deployment job 中重新生成不同内容。

#### Scenario: production job 开始
- **WHEN** production job 下载 build artifact
- **THEN** 部署的 route/build manifest hash 与 build job 一致

### Requirement: 静态路由行为保持兼容
系统 MUST 在迁移后保持首页、文章、分类、标签、归档、静态资产和 404 的预期状态码、路径和 HTML 处理。

#### Scenario: 请求既有文章 URL
- **WHEN** 客户端访问 route baseline 中的文章路径
- **THEN** Worker Static Assets 返回成功页面且不产生额外路径漂移

#### Scenario: 请求不存在路径
- **WHEN** 客户端访问不存在页面
- **THEN** 返回项目的 404 页面和预期状态码

### Requirement: 当前发布保持纯静态边界
系统 SHALL 仅发布静态资产，不配置 Worker entrypoint、`run_worker_first`、Service Binding 或数据 binding。

#### Scenario: 访问任意 API 路径
- **WHEN** 当前版本收到 `/api/*` 请求
- **THEN** 请求按静态不存在路径处理，不执行动态 Worker 代码或访问外部服务

