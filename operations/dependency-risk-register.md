# 依赖风险登记

基线日期：2026-07-27  
证据：`.build/evidence/npm-audit.json` 与
`.build/evidence/npm-audit-fix-dry-run.json`

## 当前基线

- 23 项：1 low、22 high、0 critical。
- `npm audit fix --dry-run` 没有提供非破坏性变更。
- 站点输出是纯静态文件；Cloudflare 不运行仓库的 Node 依赖。
- CI 以 `npm audit --audit-level=critical` 阻断新增 critical，并保留完整 JSON。
  high 项必须登记和分组修复，不能静默忽略。

## 分类与决定

| 依赖链 | 可达面 | 当前决定 |
| --- | --- | --- |
| Astro 5 → sharp/esbuild | 构建期；当前无 SSR/server islands | Astro 7 是主版本迁移，按契约另建 OpenSpec change；切换前保持静态生成并禁止不可信构建输入 |
| `@swup/astro` → 未启用的 parallel/route-name plugin 构建依赖 | 安装/构建期；实际浏览器 bundle 使用 Swup 核心、Morph 与集成内置插件 | 上游暂无修复；不在本轮无验证地替换导航架构，单独评估移除集成或上游修复 |
| `vite-plugin-pwa` → Workbox build 工具 | 构建期；生成的 Service Worker 在浏览器运行 | 与 Service Worker 缓存行为一起分组升级/替换，并执行离线与更新回归 |
| Wrangler 4 | 仅部署工具，尚未加入根依赖 | 确定 Worker 名称后锁定 4.x、生成类型并 dry-run；不得依赖浮动 `npx` |

## 约束

1. 不使用 `npm audit fix --force`，因为它会跨主版本或改变发布行为。
2. 每组升级必须保留 lockfile diff、audit 前后对比、完整 staging 回归和回滚 commit。
3. Astro 主版本迁移必须覆盖 Content Layer、Swup、PWA、Markdown sanitization、
   route/HTML baseline 和 Cloudflare artifact。
4. 若出现可达的 critical、公开利用或静态部署假设失效，应立即阻断发布并升级本登记。
