## Purpose

将当前已在生产运行的评论能力完整退役，确保应用、仓库、CI、Cloudflare、OAuth、DNS 和未来架构接缝不再继承旧实现。

## ADDED Requirements

### Requirement: 应用不包含评论能力
系统 SHALL 删除评论编辑器、登录、列表、占位面板、脚本、样式、文案、配置、环境变量与生命周期处理器，不使用 feature flag 或 No-op adapter 保留休眠实现。

#### Scenario: 打开任意文章页面
- **WHEN** 构建并检查任意页面及其静态资源
- **THEN** DOM、JavaScript、CSS、配置和资源清单中不存在评论能力

### Requirement: 浏览器不保留评论运行边界
系统 MUST 不注册评论事件处理器、不设置评论 Cookie 并且不发起评论 session、列表、OAuth 或发布请求。

#### Scenario: 首次加载文章
- **WHEN** 浏览器打开任意文章页面
- **THEN** 网络请求中不存在评论 session、列表、登录或发布接口

#### Scenario: 客户端连续切换文章
- **WHEN** 用户通过站内导航切换多篇文章
- **THEN** 评论相关网络请求和监听器数量保持为零

### Requirement: 评论生产资源完整退役
系统 MUST 在记录必要资源清单并完成已批准的数据导出后，删除 Comments Worker、route/custom domain、D1、OAuth App 凭据、CI secret/变量和 DNS。

#### Scenario: 执行生产资源零残留核验
- **WHEN** 查询 Cloudflare、OAuth、GitHub/GitLab 和 DNS 的现行配置
- **THEN** 不存在评论 Worker、D1、公开端点、凭据、secret、变量、自动部署或 DNS 记录

### Requirement: 下一代评论系统不继承预设计接缝
系统 SHALL 删除 CommentsAdapter、No-op controller、future gateway 和评论 roadmap 实现蓝图；未来评论需求必须建立新的 OpenSpec change。

#### Scenario: 扫描当前架构与公共 API
- **WHEN** 对应用模块、模板和运行配置执行边界扫描
- **THEN** 不存在为未来评论预留的接口、binding、route 或数据模型
