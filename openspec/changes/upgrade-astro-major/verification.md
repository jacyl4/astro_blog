# Verification

| Claim | Command / Check | Pass Criteria | Evidence |
| --- | --- | --- | --- |
| 依赖安装 | `npm ci` | lockfile 无漂移 | install log |
| 静态与类型 | `npm run verify` | 全部退出 0 | `.build/evidence` |
| 浏览器 | `npm run test:browser` | 全部退出 0 | Playwright report/trace |
| URL/HTML | route 与 HTML baseline verifier | 无未批准变化 | manifests/diff |
| 安全基线 | `npm audit --json` | 无新增可达 critical | audit before/after |
| 回滚 | staging version rollback | 旧 manifest 与全路由恢复 | release record |
