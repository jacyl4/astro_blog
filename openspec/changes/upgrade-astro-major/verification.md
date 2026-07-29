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

- Pipeline `#421` 的 Astro 7 候选在 staging 通过 `86 + 3` HTTP sweep、
  Playwright `11/11`、PWA 离线和桌面/移动抽样。
- staging version：`cc7a9a1e-db98-4def-87d8-f83da17925e2`；应用/内容 SHA
  分别为 `aa62a371…` / `c925ad44…`。
- 版本传播需要 22 次探测才连续三次收敛，因此 smoke 现在由 HTML、manifest 和
  runtime asset 三方身份门禁保护。
- 升级前的最近历史版本缺少 HTML 身份标记，不作为新契约的最终回滚验收目标；
  两个身份完整版本间的回滚仍待下一候选完成。
