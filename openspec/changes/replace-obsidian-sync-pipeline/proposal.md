# 替换 Obsidian 提交式同步流水线

## Why

当前 `jacyl4/obsidian-digital` 的 GitLab shell Runner 在 `Blog/**` 变化时 clone `jacyl4/astro_blog` 到 `/tmp/astro_blog`，使用 `rsync --delete` 写入 `src/content/blog`，再以 GitLab CI Bot 提交并推送 `main`。该链路能处理删除且不依赖持久共享目录，但会把内容镜像提交混入应用历史，无法从部署直接定位原始内容 SHA，并存在并发 push、凭据 URL 和上下游状态割裂问题。

## Current Behavior

- 内容仓库 `jacyl4/obsidian-digital` 以 `Blog/` 目录作为发布边界。
- 当前 job 通过 `rsync --delete` 后提交、推送 Astro 仓库；目标提交不记录原始内容 SHA。
- 同步 Pipeline 不等待或反映最终博客部署状态。
- OAuth token 被拼入 clone URL；并发内容提交可能争用目标 `main`。

## What Changes

- `jacyl4/obsidian-digital` 只负责验证 `Blog/` 并触发 Astro Blog 的下游 Pipeline。
- 上游传递不可变 `CONTENT_SHA` 和内容项目路径。
- Astro Pipeline 在临时工作区精确拉取该 commit。
- Content Compiler 输出通过带 SHA-256 sidecar 的不可变 Generic Package
  传递，源码目录保持只读，且不依赖 GitLab Job Artifacts 服务。
- Build manifest 同时记录 app SHA 和 content SHA。
- 生产部署使用 `resource_group` 串行化，旧 Pipeline 不得覆盖新版本。
- 本地开发通过显式 `CONTENT_SOURCE_PATH` 或固定测试 fixture 使用相同编译入口。

## Capabilities

### New Capabilities

- `immutable-content-build-input`
- `atomic-cross-repo-release`
- `portable-content-development`

### Modified Capabilities

无。

## Scope

### In Scope

- 两个 GitLab 项目的 Pipeline 合同。
- CI_JOB_TOKEN allowlist 或只读 Deploy Token 兜底。
- 临时工作区、Generic Package、manifest 和串行部署。
- 旧同步任务的观察期和下线。

### Out of Scope

- 将两个仓库合并为 monorepo。
- 使用运行时 CMS。
- 使用 OpenSpec Stores beta 管理计划。
- 修改文章格式；内容转换由 Content Compiler 负责。

## Dependencies

依赖内容编译器和构建基线。

## Impact

- 内容仓库 `.gitlab-ci.yml`。
- Astro Blog `.gitlab-ci.yml`。
- GitLab Job Token 权限和 protected variables。
- 旧 `.gitlab-ci.yml` 的 rsync/commit/push job、OAuth token 和临时 clone 约定。

## Risk Summary

主要风险为跨项目 token 权限、并发 Pipeline 乱序和切换期间内容提交积压。通过 staging trigger、双 SHA manifest、resource group 和短时内容冻结控制。

## Rollback Triggers

- 下游 Pipeline 无法精确 checkout 指定内容 SHA；
- 生产 manifest 的 content SHA 与触发提交不一致；
- 删除文章后旧文件仍出现在候选构建；
- 失败 Pipeline 对生产或源码目录产生修改。
