# Design

## Context

内容与应用是两个独立演化的版本源。可靠发布需要在构建开始时固定两者，然后在干净工作区完成验证、编译和静态生成。

## Goals

- 精确复现任一 app/content 组合。
- 移除主机路径和同步中间态。
- 保持内容仓库编辑体验独立。
- 让发布失败、并发和回滚具有明确语义。

## Non-Goals

- 不引入运行时拉取内容。
- 不要求将内容仓库作为 Git submodule 提交到应用仓库。
- 不依赖 GitLab Runner 的持久工作目录。

## Architecture and Boundaries

```text
content repo pipeline
  validate Blog/**/*
  trigger-blog(
    CONTENT_PROJECT_PATH=jacyl4/obsidian-digital,
    CONTENT_SUBDIR=Blog,
    CONTENT_SHA,
    strategy: mirror
  )

astro repo pipeline
  prepare-content
    clone exact SHA → read-only source
    content compiler → .build/content + manifests
  verify
  build
  deploy-staging
  deploy-production(resource_group)
```

内容仓库与应用仓库之间的合同只有：

```text
CONTENT_PROJECT_PATH
CONTENT_SHA
CONTENT_SUBDIR=Blog
```

## Data and Artifact Flow

- `prepare-content` 生成 `.build/content`、`content-manifest.json` 和 diagnostics。
- 后续 job 使用 GitLab artifacts，不重复 clone 默认分支。
- `build` 合成 `dist` 和 `build-manifest.json`。
- deployment 只消费 build job artifact。

## Decisions

### 1. 跨项目 downstream pipeline

理由：内容提交天然成为上游事件，`strategy: mirror` 可让内容仓库看到最终结果。

### 2. CI_JOB_TOKEN 优先

同 GitLab 实例内，通过 Job Token allowlist 提供短生命周期最小权限。无法满足时使用只读 Deploy Token，并限制变量保护范围。

### 3. 不使用固定共享工作区

每个 Pipeline 从空目录开始，删除和重命名语义准确，Runner 可横向迁移。

### 4. Artifact 在阶段间传递

避免每个 job 重新解析内容仓库，保证 verify/build/deploy 使用同一准备结果。

### 5. 生产 deployment 串行化

使用 `resource_group: astro-blog-production`。可配置旧 Pipeline 自动取消，但已经进入不可取消发布步骤的 job 必须通过 resource group 排队。

## Alternatives Considered

- Git submodule：更新内容版本需要在应用仓库再提交一次，内容发布链路变重。
- rsync 后向 Astro 仓库提交、推送：当前链路可删除残留文件，但污染应用历史、丢失源 SHA、产生 push 并发和状态割裂。
- Astro Loader 在线读取 GitLab：网络鉴权进入构建逻辑，离线复现更差。
- 合并仓库：技术可行，但会破坏现有 Vault 独立管理，当前收益不足。

## Failure Modes

- Job Token 无权限 → prepare 阶段快速失败并提供 allowlist 诊断。
- commit 被浅克隆遗漏 → fetch 指定 SHA，校验 checkout HEAD。
- 上游重复触发 → pipeline interruptible + production resource group。
- artifact 被后续 job 混用 → needs 精确依赖当前 pipeline artifact。
- 本地路径误入配置 → CI grep/path policy。

## Security and Integrity

- 优先使用 `CI_JOB_TOKEN` allowlist；禁止将长期 OAuth token 拼接到 job 日志可见的 clone URL。
- 内容仓库访问为只读。
- Cloudflare token 只出现在 deploy jobs，且为 protected/masked。
- staging 和 production environment 权限分开。

## Observability

每个 job 输出 app SHA、content SHA、content manifest hash、route hash 和 Pipeline URL。生产 manifest 允许反向定位 GitLab Pipeline。

## Test Strategy

- 在测试项目或分支验证跨项目 trigger。
- 用连续两个内容 commit 测试固定 SHA 和部署顺序。
- 用删除文章测试无残留。
- 用内容校验失败测试生产不执行。
- 从 manifest 重新运行同一双 SHA 比较 hash。

## Migration Plan

1. 新 Pipeline 与旧同步并行，但只发布 staging。
2. 使用相同内容 SHA 比较产物。
3. 短时冻结内容，切换 trigger。
4. 禁用旧 rsync/commit/push job，保留其配置七天但移除长期 OAuth token。
5. 三次成功发布后删除旧同步 job 与目标仓库内容镜像提交约定。

## Rollback Design

观察期内如需回滚，临时恢复旧同步 job，以记录的稳定 content SHA 生成镜像提交并部署最后稳定 app commit。长期 OAuth token 仅在受控回滚窗口重新配置，完成后立即撤销。

## Risks and Mitigations

- [跨项目权限由管理员配置] → 开工前建立最小 staging spike。
- [内容仓库没有 Node 工程] → validate job 可调用独立轻量包或触发下游统一验证。
- [长 Pipeline 阻碍写作节奏] → 内容仓库先做快速语法预检，完整构建由下游完成。

## Open Questions

无。已确认自托管 GitLab `gitlab.seso.icu:32221`、内容项目 `jacyl4/obsidian-digital`、应用项目 `jacyl4/astro_blog`、默认分支 `main` 和发布目录 `Blog/`。
