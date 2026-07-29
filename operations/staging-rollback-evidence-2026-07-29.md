# Staging 发布与回滚证据（2026-07-29）

## 1. 范围

本记录只覆盖 Cloudflare staging Worker `astro-blog-staging`。production
`blog.seso.icu` 未在本轮改变。

## 2. 候选身份

| 字段 | 值 |
| --- | --- |
| 应用分支 | `refactor/complete-astro-blog-openspec` |
| 应用 SHA | `aa62a37100d1bd60bded83d710c0adabc050c6d5` |
| 内容 SHA | `c925ad442b8389376728e792c4a8dc31bf365227` |
| Pipeline | `#421` |
| staging Job | `#699` |
| Cloudflare version | `cc7a9a1e-db98-4def-87d8-f83da17925e2` |
| release evidence | `astro-blog-staging-evidence/421-aa62a37100d1bd60bded83d710c0adabc050c6d5-699/staging-evidence.tar.gz` |

## 3. 候选发布结果

1. prepare、verify、build、browser Jobs `#695`～`#698` 全部成功。
2. Job `#699` 从不可变 Generic Package 下载 release，不在 deploy job 重建。
3. Wrangler dry-run 成功，随后发布 version `cc7a9a1e-…`。
4. 发布后的前 19 次身份探测仍收到旧 HTML；第 20～22 次连续确认：
   - 根 HTML `build-app-sha` 为候选 SHA；
   - `/_meta/build-manifest.json.appSha` 为候选 SHA；
   - 根 HTML 引用的 `/_assets/page.DPou7kLm.js` 返回 `200`。
5. 身份收敛后，HTTP sweep 通过 `86` 条公开路由和 `3` 条静态 404。
6. 外部 Playwright `11/11` 通过，覆盖生命周期、20 次导航、history、resize、
   键盘、PWA 离线、桌面/移动视口、全路由和动态 API-shaped 404。
7. 性能采样通过全部硬预算；LCP `1932 ms`、CLS `0.000029`、26 个请求、
   `1,465,471 B`，交互代理 `1446 ms` 仅登记趋势告警。

## 4. 首次回滚演练发现

先前曾执行 `473f51b0-… → 184b0286-… → 473f51b0-…` 的真实回滚，并在两端
完成 `86 + 3` HTTP sweep。恢复后立刻运行浏览器测试时，一次请求仍命中更旧的
runtime asset，说明固定等待或单独读取 manifest 不能证明边缘已经完成版本切换。

因此候选 `aa62a37` 新增三方身份收敛门禁。再次尝试
`cc7a9a1e-… → 473f51b0-…` 时，门禁按设计拒绝目标：`473f51b0-…` 是
`build-app-sha` 引入前的历史版本，无法满足新契约。脚本随后自动恢复
`cc7a9a1e-…`，并在第 20～22 次探测连续确认候选已恢复。

该结果不计作最终 N→N−1→N 验收，也不以兼容开关降低门禁。最终演练将使用两个
都带 HTML 身份标记的新版本，并记录两次收敛、两次 HTTP sweep 和恢复后的完整
Playwright 结果。

## 5. 证据路径

- GitLab：Pipeline `#421`，Jobs `#695`～`#699`
- Generic Package：
  `astro-blog-staging-evidence/421-aa62a37100d1bd60bded83d710c0adabc050c6d5-699/staging-evidence.tar.gz`
- 本机非提交日志：
  `.build/evidence/staging-rollback-2026-07-29/rehearsal.log`
- 运维命令：`operations/rollback-runbook.md`

## 6. 当前结论

- 功能分支 manual staging：**通过**
- 发布身份收敛门禁：**通过**
- staging 真实浏览器与 PWA：**通过**
- 最终身份完整版本间回滚演练：**待下一候选版本**
- production：**未改变**
