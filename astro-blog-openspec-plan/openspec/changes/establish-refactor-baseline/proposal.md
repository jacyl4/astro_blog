# 建立架构重构基线

## Why

后续内容编译、模块拆分、流水线迁移和 Cloudflare 切换都会触及博客核心链路。当前缺少 URL、页面数量、静态产物和评论退役状态的自动化基线，任何重构都可能将行为漂移包装成“构建成功”。

## Current Behavior

- Astro 可以完成静态构建，但质量闸门主要依赖 `astro check` 和 build。
- 公开路由尚未形成机器可比的版本清单。
- slug 冲突、内容读取失败和空博客可能缺少 fail-fast 保护。
- 生产站点当前渲染评论 UI、加载客户端脚本并访问公开 Comments Worker；仓库还包含 Worker、D1 schema、OAuth、样式和配置。
- CI 需要统一到 lockfile 驱动的可重复安装。

## What Changes

- 生成并提交当前公开 URL 与页面类型基线。
- 完整退役评论能力：先记录/导出必要证据，再删除前端、仓库后端、CI 配置、Worker、D1、OAuth、secret、DNS 和预留接缝。
- 引入构建清单，记录 app SHA、content SHA、lockfile hash、路由 hash 和资产 hash。
- 使用 `npm ci`，并建立最小单元测试和静态页面 smoke test。
- 对重复 slug、内容集合读取失败和非预期空集合执行 fail-fast。

## Capabilities

### New Capabilities

- `release-baseline`：每次构建生成可比较的发布基线和清单。
- `url-stability`：公开 URL 变化被显式检测和审批。
- `comments-decommission`：评论能力零残留退役成为可验证的运行与基础设施契约。

### Modified Capabilities

无。

## Scope

### In Scope

- 路由快照、构建清单、基础 smoke test。
- 评论 UI、脚本、样式、文案、环境变量、后端代码与生产资源退役。
- `npm ci` 和基础 CI 门禁。
- slug/collection 的失败策略。

### Out of Scope

- 不实现评论后端。
- 不拆分 BlogService。
- 不迁移 Cloudflare 平台。
- 不升级 Astro 主版本。
- 不改变视觉和文章正文。

## Dependencies

无，是所有后续 change 的前置基础。

## Impact

- `package.json`、lockfile、CI 工作流。
- Blog 数据入口和路由生成。
- Layout/Components、public、styles、consts、CI 和 Cloudflare 中的评论实现。
- 新增 `tests/`、`.build/` 和 manifest 工具。

## Risk Summary

最大的风险是把现有 URL 生成中的偶然顺序固化为永久契约。执行时先记录生产可见 URL，再确认每条 URL 对应的源文章，基线本身不改变 slug 策略。

## Rollback Triggers

- 页面数量或 URL 在无迁移说明时发生变化；
- 页面或基础设施中残留评论 UI、脚本、请求、Cookie、Worker、D1、OAuth、secret、DNS 或 adapter；
- 新 CI 在干净环境无法复现当前成功构建。
