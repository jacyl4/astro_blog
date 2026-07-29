# Astro 7 Upgrade Contract

日期：2026-07-29  
升级前提交：`2ccf7ce19bbaaf6f8b2853974966267e51f72076`

## 1. 官方约束

- Astro 7 要求 Node.js `>=22.12.0`；本地和 CI 使用 Node 24。
- Astro 7 使用 Vite 8；当前锁文件已经解析到 Vite 8.1.5。
- Rust compiler 对未闭合或语义无效 HTML 更严格。
- 默认 Markdown processor 改为 Sätteri；本站依赖多个 remark/rehype plugin，
  因此显式安装 `@astrojs/markdown-remark` 并配置 `unified()`。
- 默认 `compressHTML` 改为 `jsx`；公开 `<main>` 基线仍必须逐页比较，不能把
  whitespace 变化当作自动批准。

官方依据：

- <https://docs.astro.build/en/guides/upgrade-to/v6/>
- <https://docs.astro.build/en/guides/upgrade-to/v7/>
- <https://docs.astro.build/en/guides/markdown-content/#switching-to-the-unified-processor>

## 2. 升级前基线

| 项目 | 值 |
| --- | --- |
| Astro | 5.18.2 |
| Vite | 8.1.5 |
| Node | 24.15.0 |
| route count | 86 |
| asset count | 91 |
| `build:prepared` | Astro reported 3.33s; wall 13.954s（单次 warm-cache） |
| content SHA | `c925ad442b8389376728e792c4a8dc31bf365227` |
| lockfile SHA-256 | `73f54845d2f46793791dd6eb3ef6f7371671ee81584e1964b1f8765b4cc14630` |
| audit | 0 critical, 22 high, 0 moderate, 1 low |

完整 machine-readable 清单位于 `baselines/astro5-preupgrade/`。

## 3. 兼容矩阵

| 表面 | 升级前 | 目标/处理 |
| --- | --- | --- |
| Astro core | 5.18.2 | 7.1.5 |
| `@astrojs/check` | 0.9.9 | 0.9.10 |
| Markdown | Astro 内置 unified | `@astrojs/markdown-remark` 7.2.2 + 显式 `unified()` |
| Content Layer | glob loader + `astro:content` | 保持公开 API，按编译错误迁移 |
| `@swup/astro` | 1.8.0 | 1.8.0；浏览器事件 trace 决定兼容性 |
| Swup | 4.9.2 | 4.9.2 |
| morph plugin | 1.3.0 | 保持 1.3.0；2.0.0 在 Astro 配置装载时访问浏览器全局并报 `Element is not defined` |
| PWA/Workbox | `vite-plugin-pwa` 1.3.0 + Workbox | 移除；Astro `build:done` 生成原生、revisioned `sw.js`，Playwright 验证注册和离线首页 |
| Tailwind Vite | 4.3.3 | 4.3.3，官方 peer 覆盖 Vite 8 |
| astro-icon | 1.1.5 | 1.1.5 |
| 输出模型 | static | 必须保持 static assets-only |

## 4. 放行与回退

放行要求：

1. strict content compile、Astro check、26+ unit tests；
2. 86 → 86 routes，无未批准增删；
3. 公开页面 `<main>` hash 全部一致，或只有逐页、逐 hash 审批的非语义差异；
4. asset/PWA、HTTP、lifecycle、评论零残留和 Cloudflare dry-run 通过；
5. staging 发布与实际 version rollback 成功。

本地任何一项失败，回退到升级前提交并保留失败日志；不得通过删除测试、放宽
route/HTML baseline 或切换到动态 runtime 规避迁移问题。

## 5. 已批准差异

Astro 7 将 Shiki 3 升级到 Shiki 4。仅
`posts/astro-systematic-blog-construction-guide/index.html` 的一个 `mdx`
代码块出现 token `<span>` 划分差异：

- 候选 `<main>` SHA-256：
  `20b43a0981a3e0f06f3e03327bfa54355d01bace65df2c3d16e649ae78273bc5`
- Playwright 逐页读取实际 `main.innerText`，85 个公开页面均与 Astro 5 相同。
- 审批被锁定在 `baselines/html-differences.json` 的精确路径和精确 hash；
  任一后续内容变化都会使门禁失败，不能被这次审批掩盖。
- `data-astro-cid-*` 仅是编译器生成的 scoped CSS 标识，比较器会归一化；
  回归测试同时证明正文语义变化仍会失败。

## 6. 依赖审计结论

升级并执行非破坏性 `npm audit fix` 后：

- 17 high，0 critical，0 moderate，0 low；相较升级前减少 6 项。
- 剩余问题属于安装/构建工具链，不进入 Cloudflare 静态运行时。
- `@swup/astro` 的修复建议是降级到 `0.2.0`，会破坏现有 Swup 4
  集成，拒绝执行。
- Astro 7 下 `vite-plugin-pwa` 只留下 `registerSW.js`，却没有生成被引用的
  `/sw.js`；并且生成的注册脚本没有被页面引用。资产门禁已复现并阻断该断链。
- 采用无新增依赖的 Astro `astro:build:done` 集成生成 revisioned 原生
  Service Worker，显式注入 manifest/registration，并移除
  `vite-plugin-pwa` / Workbox 构建链。Playwright 已验证 Worker 接管和离线首页。
- `swup-morph-plugin@2.0.0` 已实装试验，但其依赖在 Astro
  服务端配置加载阶段访问 `Element`，因此回退并锁定 `1.3.0`。

完整审计证据由 CI 写入 Generic Package Registry；本地原始结果位于
`.build/evidence/astro7-npm-audit.json`。

## 7. 本地验收结果

| 检查 | 结果 |
| --- | --- |
| strict content compile | 11 articles，0 warning，0 error |
| Astro check | 84 files，0 error/warning/hint |
| unit | 8 files，32 tests passed |
| route | 86 → 86，无增删 |
| `<main>` | 85 个公开页面 rendered text 相同；1 个精确 hash 的 Shiki token 差异 |
| asset | 92 release assets；178 dist files；6.83 MiB，预算内 |
| PWA | 155 precache entries；Worker 接管与离线首页 Playwright 通过 |
| browser | 11 tests passed；Swup 20 次导航无 listener/observer 增长；桌面/移动响应式抽样通过 |
| comments | 源码与 dist 零运行时残留，动态 API 路径均为 404 |
| Cloudflare | staging/production assets-only dry-run 均通过，0 bindings |
| OpenSpec | 8 changes strict validation passed；79 scenarios evidence matrix current |
| audit | 17 high，0 critical/moderate/low |
| `build:prepared` | Astro reported 2.24s；wall 12.621s（单次 warm-cache） |

以上是本地候选证据；`staging` 发布、真实 version rollback、production
观察窗口仍是远端放行门，未以本地结果替代。
