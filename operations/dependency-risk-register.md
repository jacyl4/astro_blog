# 依赖风险登记

基线日期：2026-07-29  
证据：`.build/evidence/npm-audit.json` 与
`.build/evidence/npm-audit-fix-dry-run.json`

## Astro 5 升级前基线

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

## Astro 7 升级后复核

- 审计结果：17 high、0 critical、0 moderate、0 low，比升级前减少 6 项。
- `@swup/astro@1.8.0` 的遗留项来自发布包中未启用插件的
  microbundle/shelljs 工具链；npm 建议的所谓修复是降级到
  `@swup/astro@0.2.0`，与 Swup 4 和现有 Astro 集成不兼容。
- Astro 7 实测 `vite-plugin-pwa@1.3.0` 生成 `registerSW.js` 但缺失
  `/sw.js`，页面也没有实际引用注册脚本。已改用仓库内 Astro
  `build:done` 集成生成 revisioned 原生 Service Worker，删除
  `vite-plugin-pwa` / Workbox 依赖链；资产门禁和 Playwright 离线测试锁定该行为。
- `swup-morph-plugin@2.0.0` 在 Astro 配置加载时因
  `Element is not defined` 失败，锁定 1.3.0。这是经过实装验证的兼容性决定，
  不是遗漏升级。
- 删除未使用的 `@shikijs/themes@3.x` 根依赖。Astro 7 使用
  `shiki@4.3.1`，其内置 `@shikijs/themes@4.3.1` 已满足配置中的
  `gruvbox-dark-medium`；不允许同时安装两个 theme 主版本参与 Markdown 构建。
- 站点仍为 assets-only 静态部署；这些 Node 构建依赖不会被部署到
  Cloudflare 请求运行时。CI 继续以 critical 为硬阻断，并保留 high 项清单。

## 约束

1. 不使用 `npm audit fix --force`，因为它会跨主版本或改变发布行为。
2. 每组升级必须保留 lockfile diff、audit 前后对比、完整 staging 回归和回滚 commit。
3. Astro 主版本迁移必须覆盖 Content Layer、Swup、PWA、Markdown sanitization、
   route/HTML baseline 和 Cloudflare artifact。
4. 若出现可达的 critical、公开利用或静态部署假设失效，应立即阻断发布并升级本登记。
