# Astro Blog OpenSpec Program Completion Plan

日期：2026-07-29

## 1. 目标

将当前八个活动 change 从“核心实现已上线、部分任务未登记或未完成”推进到：

1. 每项 requirement 都能定位到自动测试或人工证据；
2. 所有非观察期任务完成并通过严格验证；
3. Astro 从 5 升级到 7，保持纯静态交付、86 条公开路由和既有页面语义；
4. staging、回滚和 production 发布证据完整；
5. 只有满足 `program/09-definition-of-done.md` 的 change 才归档；
6. 三次内容发布、七天 Pages 保留和两周 CI 观察等时间门不得提前伪造。

## 2. 当前事实（2026-07-29 23:10 CST）

- production 已由 Cloudflare Static Assets Worker `astro-blog` 提供。
- Pipeline `#407` 已完成 prepare、verify、build、browser、staging 和 production。
- GitLab Job Artifacts 的 UID/GID 漂移已在 2026-07-28 修复，并以 Job `#644`
  的上传 `201`、下载 `200` 验证。
- 候选分支 `refactor/complete-astro-blog-openspec` 已升级到 Astro `7.1.5`；
  当前候选通过 35 个 unit、11 个 browser、86 条 route、PWA 离线、21 项 CI
  contract 和 OpenSpec strict validation。
- 八个 change 在本轮补强前共 265 项任务，233 项已登记完成，32 项未完成；
  未完成项主要是 staging、真实回滚、观察窗口、旧链路清理和归档。
- 本轮将 feature staging、retry evidence 和 responsive sampling 拆成 5 个新任务，
  并已关闭 10 个已有/新增实现或 staging 任务；当前为 243/270，27 项保持未完成。
- Runner `endure` 已恢复。候选 Pipeline `#421` 的 Jobs `#695`～`#698`
  全部成功，功能分支 manual staging Job `#699` 成功。
- staging version 为 `cc7a9a1e-db98-4def-87d8-f83da17925e2`；证据包为
  `astro-blog-staging-evidence/421-aa62a37100d1bd60bded83d710c0adabc050c6d5-699/staging-evidence.tar.gz`。
- 发布身份门禁在前 19 次探测拒绝旧 HTML，第 20～22 次才连续确认 HTML、
  build manifest 与 runtime asset 一致；之后 `86 + 3`、Playwright `11/11`
  和性能硬预算通过。
- 直接回滚到身份门禁引入前的 `473f51b0-…` 被新门禁正确拒绝，且 staging 已
  自动恢复到 `cc7a9a1e-…`。最终演练必须使用两个身份完整版本，不能降低门禁。
- `openspec validate --all --strict` 通过只证明工件结构有效，不证明施工完成。
- `openspec/changes/archive/` 为空。

## 3. 决策

### 3.1 施工策略

采用“现有 change 就地对账和收口”，不新建重复的总括 change：

- 实现细节仍由八个现有 change 的 `tasks.md`、`verification.md` 和 `rollout.md`
  负责；
- 本文件只规定跨 change 顺序、共同门禁和时间门；
- 已完成但未登记的任务必须先找到当前证据，再勾选；
- 缺少证据的任务即使功能看似存在，也保持未完成。

### 3.2 Astro 7

目标版本为当前受支持的 Astro 7：

- 先保存 Astro 5 的 route、HTML、asset、audit、构建时间和浏览器基线；
- 使用官方升级路径逐步完成 Astro 5 → 6 → 7 的兼容检查；
- Astro 7 使用 Vite 8、Node `>=22.12.0`，并改变 Markdown 与 HTML 压缩默认值；
- 为保持当前 remark/rehype 行为，优先显式配置兼容 Markdown processor，而不是
  静默接受正文 HTML 漂移；
- 任何未批准 route 或 `<main>` 差异阻断 staging。

官方依据：

- <https://docs.astro.build/en/guides/upgrade-to/v6/>
- <https://docs.astro.build/en/guides/upgrade-to/v7/>
- <https://docs.astro.build/en/install-and-setup/>

### 3.3 Cloudflare

- staging 开启完整 Workers Logs；production 使用低采样率；
- 静态 Worker 不增加入口脚本或动态 binding；
- 使用 `wrangler deployments list` 获取候选版本，使用
  `wrangler rollback <VERSION_ID>` 在 staging 演练 N → N+1 → N；
- Pages 回退入口在观察期结束前保留，停止自动部署与删除项目是两个独立动作。

### 3.4 CI 证据与候选 staging

- 阶段间传递使用 Generic Package Registry，不依赖 GitLab Job Artifacts；
- content/release 包以 `pipeline ID + app SHA` 为不可变版本并携带 SHA-256
  sidecar；
- unit/browser/staging/production 证据额外包含 `job ID`，使 retry 产生新证据，
  不覆盖先前尝试；
- 默认分支通过完整门禁后自动发布 staging；其他分支只提供显式 manual staging，
  并按该分支 HEAD 执行 freshness check；
- staging 使用独立 `resource_group` 串行化，部署后对真实域名运行完整
  Playwright、PWA、响应式视口、HTTP sweep 和性能采集；
- production 继续限定默认分支、受保护 manual job 和独立 production
  `resource_group`。

官方依据：

- <https://developers.cloudflare.com/workers/observability/logs/workers-logs/>
- <https://developers.cloudflare.com/workers/wrangler/commands/#rollback>

## 4. 依赖顺序

### Wave A：契约和本地测试收口

1. 补齐 route diff 的新增、删除、kind 变化和 allowlist 测试。
2. 补齐内容编译器发布边界、重复 id/slug、歧义 wikilink 集成测试。
3. 补齐 `BlogApplicationService` 公共 API、缓存和错误传播测试。
4. 补齐 lifecycle 的 signal 使用契约和浏览器事件 trace 证据。
5. 建立 scenario → evidence 矩阵。

放行门：

```bash
npm run test:unit
npm run boundaries:verify
npm run openspec:validate
```

### Wave B：CI、资产、性能和运维

1. 配置 Vitest JUnit 与 Playwright trace 输出，并转存到 Generic Package Registry。
2. 添加机器绝对路径扫描、故障注入和稳定性能 smoke。
3. 生成 wallpaper/head 响应式资源并更新预算。
4. 配置 Cloudflare observability 和日志隐私检查。
5. 更新回滚、季度演练和证据文档。
6. 提交删除废弃 GitHub Action。

放行门：

```bash
npm run verify:full
npm run cf:dry-run -- --env staging
```

### Wave C：双仓和 Cloudflare 演练

1. 核验内容仓旧 rsync/commit/push 链路和凭据是否仍存在。
2. 补齐删除文章、双 SHA、连续提交、逆序发布和绝对路径测试。
3. 在 staging 执行 Worker 版本回滚演练；每次切换先等待 HTML、manifest 与
   runtime asset 连续三次身份一致，不使用固定 sleep。
4. 验证 Pages 回退步骤，但观察期结束前不删除回退入口。
5. 在功能分支 manual staging 先验证候选，不以合并默认分支换取 staging 证据。

放行门：

- 内容仓和应用仓 pipeline 均成功；
- staging 全路由 `86 + 3` 通过；
- 回滚前后 HTML app SHA、manifest、runtime asset、route hash 可定位。

### Wave D：Astro 7

1. 保存 Astro 5 基线与依赖兼容矩阵。
2. 升级 Astro、`@astrojs/check`、Swup、PWA/Workbox 兼容依赖。
3. 修复配置、Markdown、Content Layer、Vite 8 和类型问题。
4. 执行 unit、Astro check、build、route、HTML、asset 和 Playwright 全回归。
5. staging 发布、HTTP sweep、PWA 与回滚验证。

放行门：

- route `86 → 86`，无未批准增删；
- `<main>` 基线无未批准变化；
- 评论零残留；
- Static Assets Worker 无入口脚本和 binding；
- 两个身份完整版本间的 staging 回滚成功。

### Wave E：生产和归档

1. production manual job 发布已经通过 staging 的同一 release 包。
2. 记录 app SHA、content SHA、Cloudflare version 和 HTTP sweep。
3. 更新所有 `verification.md` 的 Planned 项为真实结果，不把迁移期旧版本缺少
   HTML 身份标记伪记为回滚通过。
4. 执行 OpenSpec verify/strict validation。
5. 仅归档所有任务完成或明确移出范围的 change。

## 5. 时间门

以下任务必须保持未完成，直到真实条件满足：

- 三次成功内容提交；
- Pages 七天回退观察期；
- CI 两周观察窗口；
- production 发布后的约定观察窗口。

这些任务应记录开始时间、累计样本和最早可关闭时间，不能用单次 smoke 替代。

## 5.1 基础设施门

远端 Runner 属于执行前置条件，不属于应用验收豁免。Runner 离线时：

1. 允许继续完成本地实现、测试和 OpenSpec 工件；
2. 允许推送功能分支并保留 pending Pipeline；
3. 不得勾选任何要求 GitLab job、staging、Cloudflare rollback 或 production
   observation 的任务；
4. Runner 恢复后必须由新提交触发新 Pipeline，不复用本地日志冒充 CI evidence。

2026-07-29 已按上述规则由新提交触发 Pipeline `#421` 并完成真实 staging；
该基础设施门现已关闭。

## 6. 失败与停止条件

出现任一情况立即停止后续部署：

- route 或 `<main>` 基线出现未批准变化；
- Astro 7 引入无法解释的 Markdown/HTML 漂移；
- critical audit、评论残留、动态 binding 或 secret 日志命中；
- staging 回滚失败；
- production 候选不是通过 browser 与 staging 的同一不可变 release 包。

## 7. 完成证据

最终报告至少包含：

- 每个 change 的任务完成数和未完成时间门；
- unit、browser、route、HTML、asset、audit、OpenSpec 结果；
- 内容与应用双 SHA；
- staging/production Cloudflare version；
- 回滚演练记录；
- GitLab pipeline/job 链接或 ID；
- 仍保留的 Pages 回退入口及其停止条件。
