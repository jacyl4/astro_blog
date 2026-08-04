# immutable-content-build-input Specification

## Purpose
TBD - created by archiving change replace-obsidian-sync-pipeline. Update Purpose after archive.
## Requirements
### Requirement: 构建使用精确内容提交
系统 MUST 使用上游提供的 `CONTENT_SHA` checkout 内容仓库，而不是隐式使用默认分支最新状态。

#### Scenario: 内容仓库触发下游 Pipeline
- **WHEN** 内容仓库默认分支上的提交触发博客构建
- **THEN** 下游 Pipeline checkout 的 HEAD 等于触发时传递的 `CONTENT_SHA`

#### Scenario: 内容仓库随后出现新提交
- **WHEN** 下游 Pipeline 运行期间内容仓库默认分支继续前进
- **THEN** 当前构建仍然使用原始 `CONTENT_SHA`

### Requirement: 内容源进入临时只读工作区
系统 SHALL 将内容仓库 clone 到当前 Pipeline 的临时工作区，并且不写入 Astro 源码目录。

#### Scenario: CI 构建完成
- **WHEN** Pipeline 完成 prepare、build 和 deploy
- **THEN** `src/content/blog` 没有被外部同步修改，临时源目录可安全删除

### Requirement: 删除内容不会残留
系统 MUST 从全新的 checkout 和全新的编译输出生成候选站点。

#### Scenario: 一篇文章在内容提交中被删除
- **WHEN** 使用该提交构建
- **THEN** 候选产物中不存在上一个提交留下的对应文件，除非显式配置 redirect

