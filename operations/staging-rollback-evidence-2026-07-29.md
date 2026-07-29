# Staging 发布与回滚证据（2026-07-29）

## 1. 范围

本记录只覆盖 Cloudflare staging Worker `astro-blog-staging`。production
`blog.seso.icu` 未在本轮改变。

## 2. 身份完整版本

| 字段 | 上一候选 N−1 | 当前候选 N |
| --- | --- | --- |
| 应用分支 | `refactor/complete-astro-blog-openspec` | `refactor/complete-astro-blog-openspec` |
| 应用 SHA | `aa62a37100d1bd60bded83d710c0adabc050c6d5` | `cd94bda91d33e3f0fe8973d9452cb6a9174f4d05` |
| 内容 SHA | `c925ad442b8389376728e792c4a8dc31bf365227` | `c925ad442b8389376728e792c4a8dc31bf365227` |
| Pipeline | `#421` | `#423` |
| staging Job | `#699` | `#709` |
| Cloudflare version | `cc7a9a1e-db98-4def-87d8-f83da17925e2` | `05193450-0648-4e68-8850-93e46eb93419` |
| route manifest SHA-256 | `329af7493fe0890082c028c56ef6173544f7a769f5e4b3b9e1879f608cc7b853` | `23459401b8bb52ea871834a44e4c9e97fce1e9394ebdbd9fea186e2fab9ee20c` |
| asset manifest SHA-256 | `384bcd1726b8fad91f5bc776f72910dc492b85f86864647835776a2ae75c236b` | `be893c0b0eb9cfdb48f435966b3847847a585af7d07b3b1d70cb8ff65d59ef9a` |

N 的 release evidence 为
`astro-blog-staging-evidence/423-cd94bda91d33e3f0fe8973d9452cb6a9174f4d05-709/staging-evidence.tar.gz`。

## 3. 当前候选发布结果

1. Pipeline `#423` 的 prepare、verify、build、browser Jobs `#705`～`#708`
   全部成功。
2. Job `#709` 从不可变 Generic Package 下载 release，不在 deploy job 重建。
3. Wrangler dry-run 成功，随后发布 version `05193450-…`。
4. 发布身份在第 14～16 次探测连续确认：
   - 根 HTML `build-app-sha` 为 `cd94bda9…`；
   - `/_meta/build-manifest.json.appSha` 为 `cd94bda9…`；
   - 根 HTML 引用的 runtime asset 返回 `200`。
5. 身份收敛后，HTTP sweep 通过 `86` 条公开路由和 `3` 条静态 404。
6. 外部 Playwright `11/11` 通过，覆盖生命周期、20 次导航、history、resize、
   键盘、PWA 离线、桌面/移动视口、全路由和动态 API-shaped 404。

## 4. 构建漂移发现与修复

Pipeline `#422` 在 build 阶段被 HTML 基线门禁阻断：一个 MDX 代码块的 Shiki
高亮输出发生 hash 漂移。内容 SHA、内容包 hash 和 Node `24.15.0` 均相同，因此
没有把漂移加入 allowlist。

依赖图核验发现 Astro 使用 Shiki `4.3.1`，项目又直接安装了未使用的
`@shikijs/themes@3.23.0`，形成两个 Shiki 主版本。commit `cd94bda` 删除该直接
依赖并新增依赖契约测试；Pipeline `#423` 的确定性 build 随后通过。

## 5. 最终 N→N−1→N 演练

### 5.1 N → N−1

执行 Wrangler rollback，将 `05193450-…` 切换到 `cc7a9a1e-…`：

- 第 1～4 次探测仍观察到 N 的 HTML 与 N−1 manifest 混合状态，门禁拒绝继续；
- 第 5～7 次探测连续确认 HTML、manifest 和 runtime asset 全部指向
  `aa62a371…`；
- build manifest 的 route/asset hash 与 N−1 记录完全一致；
- HTTP sweep 通过 `86 + 3`。

### 5.2 N−1 → N

执行 Wrangler rollback，将 staging 恢复到 `05193450-…`：

- 第 1～5 次探测观察到混合身份，门禁拒绝继续；
- 第 6～8 次探测连续确认 HTML、manifest 和 runtime asset 全部指向
  `cd94bda9…`；
- 恢复后的 build manifest 与回滚前 N 完全一致；
- HTTP sweep 再次通过 `86 + 3`；
- 完整外部 Playwright 回归 `11/11` 通过。

脚本带有失败 trap；若任一步失败，会优先恢复 N。实际流程正常完成，最终
staging 版本为 `05193450-0648-4e68-8850-93e46eb93419`。

## 6. 早期演练边界

先前使用身份门禁引入前的 `473f51b0-…` 做回滚时，新门禁按设计拒绝该版本：
它没有根 HTML `build-app-sha`，不能满足当前发布身份契约。脚本自动恢复
`cc7a9a1e-…`。该结果用于证明门禁不会把边缘混合状态误判为成功，但不计作最终
回滚验收。

最终验收只采用本记录第 5 节的两个身份完整版本，没有降低门禁或添加兼容开关。

## 7. 证据路径

- GitLab：Pipeline `#423`，Jobs `#705`～`#709`
- Generic Package：
  `astro-blog-staging-evidence/423-cd94bda91d33e3f0fe8973d9452cb6a9174f4d05-709/staging-evidence.tar.gz`
- 本机非提交原始记录：
  `.build/evidence/staging-rollback-final-2026-07-29/rehearsal.log`
- 两端 manifest：
  `.build/evidence/staging-rollback-final-2026-07-29/manifest-{previous,restored}.json`
- 两端 HTTP sweep：
  `.build/evidence/staging-rollback-final-2026-07-29/http-sweep-{previous,restored}.json`
- 运维命令：`operations/rollback-runbook.md`

## 8. 结论

- 功能分支 manual staging：**通过**
- 发布身份收敛门禁：**通过**
- staging 真实浏览器与 PWA：**通过**
- 身份完整版本间 N→N−1→N：**通过**
- staging 最终恢复当前候选：**通过**
- production：**未改变**
