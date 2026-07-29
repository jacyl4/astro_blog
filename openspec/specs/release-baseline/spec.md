# release-baseline Specification

## Purpose
TBD - created by archiving change establish-refactor-baseline. Update Purpose after archive.
## Requirements
### Requirement: 构建生成发布清单
系统 SHALL 在成功构建时生成机器可读的 `build-manifest.json`，至少记录应用提交、内容提交、lockfile hash、路由清单 hash、资产清单 hash 和构建时间。

#### Scenario: CI 构建具有双提交信息
- **WHEN** GitLab Pipeline 提供应用提交和内容提交环境变量
- **THEN** 构建清单包含两个提交值并随发布产物保存

#### Scenario: 本地构建缺少 CI 变量
- **WHEN** 开发者在本地执行构建且没有 CI 环境变量
- **THEN** 清单使用明确的 `local` 或当前 Git 提交值，而不是静默留空

### Requirement: 干净工作区可重复构建
系统 MUST 使用 lockfile 驱动的依赖安装，并在 lockfile 与 package manifest 不一致时失败。

#### Scenario: lockfile 一致
- **WHEN** 在干净工作区执行 `npm ci`
- **THEN** 依赖安装成功且不修改 lockfile

#### Scenario: lockfile 漂移
- **WHEN** package manifest 与 lockfile 不一致
- **THEN** CI 在构建前失败并输出依赖一致性错误

### Requirement: 发布基线包含静态页面清单
系统 SHALL 在构建后输出全部静态页面的规范化路径与页面类型。

#### Scenario: 构建成功
- **WHEN** Astro 完成静态生成
- **THEN** route manifest 包含首页、文章、分类、标签、归档和 404 等可发布页面

