# Verification

| Claim | Command / Check | Pass Criteria | Evidence |
| --- | --- | --- | --- |
| 依赖安装 | `npm ci` | lockfile 无漂移 | install log |
| 静态与类型 | `npm run verify` | 全部退出 0 | `.build/evidence` |
| 浏览器 | `npm run test:browser` | 全部退出 0 | Playwright report/trace |
| URL/HTML | route 与 HTML baseline verifier | 无未批准变化 | manifests/diff |
| 安全基线 | `npm audit --json` | 无新增可达 critical | audit before/after |
| 回滚 | staging version rollback | 旧 manifest 与全路由恢复 | release record |

## Actual Results

- Pipeline `#423` 的 Astro 7 候选在 staging 通过 `86 + 3` HTTP sweep、
  Playwright `11/11`、PWA 离线和桌面/移动抽样。
- staging version：`05193450-0648-4e68-8850-93e46eb93419`；应用/内容 SHA
  分别为 `cd94bda9…` / `c925ad44…`。
- smoke 由 HTML、manifest 和 runtime asset 三方身份门禁保护；候选发布在第
  14～16 次探测连续收敛。
- 两个 Astro 7 身份完整版本间的 N→N−1→N 演练通过：回退端第 5～7 次、
  恢复端第 6～8 次连续收敛，两端路由和恢复后的浏览器回归均通过。
- Astro 7 自 2026-07-27 起连续承载生产；最终 Pipeline `#442` 的 staging
  `#774` 和 production `#775` 成功，线上 app/content 为
  `24f97e05…` / `7a5b1257…`。
- 生产 `86 + 3`、Playwright `11/11`、86 route 控制台/页面错误扫描 0，
  观察期间未发现 URL、PWA、生命周期或静态资产回归。
