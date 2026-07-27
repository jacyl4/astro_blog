# Design: Astro Major Upgrade

## Source of Truth

升级目标、迁移步骤与兼容范围以 Astro 官方迁移文档和各集成的官方兼容说明为准。
仓库的 route、HTML、asset、content 和 build manifests 是行为基线。

## Dependency Direction

先升级 Astro 核心与官方工具，再处理 Content Layer，随后验证 Swup/PWA 和
Markdown 插件。不得通过页面组件内兼容分支绕过模块边界。

## Failure Behavior

任何 check、build、manifest、浏览器或 staging 差异都阻断升级。不得降低现有
质量门或静默刷新 HTML/URL 基线。

## Migration

1. 锁定明确目标版本并保存升级前 audit/lockfile。
2. 按官方迁移说明完成最小配置变更。
3. 执行全部 unit、strict content、route、HTML、asset 和 Playwright 测试。
4. 在 staging 验证静态 404、PWA 更新与完整 route sweep。
5. 单独发布并保留上一个生产 artifact/version。

## Rollback

恢复升级前 lockfile、配置和代码 commit，并部署已记录的稳定 artifact/version。
