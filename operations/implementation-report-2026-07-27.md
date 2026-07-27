# Astro Blog 架构重构施工报告

日期：2026-07-27  
范围：博客架构、内容编译、CI/CD、Cloudflare 静态交付、客户端生命周期和评论能力退役。  
排除项：不分析文章正文；内容仓变更仅补充发布身份 frontmatter 和 CI。

## 1. 当前结论

本轮已完成可在 staging 验收的架构重构：

- Astro 保持纯静态输出，共 86 个公开路由。
- `jacyl4/obsidian-digital:Blog/` 成为唯一发布边界。
- 内容构建输入锁定到 40 位 content SHA，并采用 strict 模式。
- 旧 `BlogService` 已由分层 blog module 取代。
- Swup/Astro 页面副作用统一由 PageController lifecycle 管理。
- 评论前端、仓库后端及外部生产资源已完整删除。
- Cloudflare 目标为无入口脚本、无 binding 的 Static Assets Worker。
- staging Worker `astro-blog-staging` 已部署到
  `https://blog-staging.seso.icu`。
- GitLab 双仓链路使用精确 content SHA，不再向应用仓库 rsync 后提交镜像内容。

生产域名尚未切换。本报告把生产切换保留为单独、人工批准的发布动作。

## 2. 内容边界与编译器

### 2.1 发布边界

- 唯一来源：`jacyl4/obsidian-digital`
- 唯一目录：`Blog/`
- 当前语料：11 篇 Markdown
- 非 `Blog/` Vault 文件不会被编译、复制或检出
- 本轮未修改文章正文，只为 11 篇文章补充稳定 `id` 与 `slug`

### 2.2 两阶段编译

`tools/content-compiler` 先执行 inventory，再执行 transform：

1. 建立 source、id、slug、permalink 索引。
2. 检测重复身份、basename 歧义和越界引用。
3. 解析 Markdown/GFM、wikilink 和 Obsidian callout。
4. 对本地附件、transclusion 等未支持语法给出可定位诊断。
5. 输出规范化内容、diagnostics、migration report 和 content manifest。
6. 使用临时目录和原子替换避免半成品进入 Astro。

strict 构建结果：

- article count：11
- warning：0
- error：0
- manifest hash：
  `678015d9529d28efd760bf0a56d90f82177e89ebea67777ac6516ce483a65f6d`

### 2.3 双 SHA

`content-source.lock.json` 固定内容提交并启用 strict。构建清单包含：

- Astro application SHA
- Obsidian content SHA
- package-lock hash
- route manifest hash
- asset manifest hash

根仓直接运行的 Pipeline 会从 lock 读取 content SHA；由内容仓触发的
Pipeline 则使用传入的精确 `CONTENT_SHA`。

## 3. Blog 模块化

新边界位于 `src/modules/blog`：

```text
domain
  ├─ model
  ├─ normalize
  └─ selectors
application
  ├─ BlogRepository
  └─ BlogApplicationService
infrastructure
  └─ AstroBlogRepository
public entry
  └─ index.ts
```

只有 infrastructure adapter 可直接访问 `astro:content`。页面和组件仅从
模块公共入口读取文章、分类、标签、归档与详情。边界检查阻止深层导入和循环
依赖。

日期展示和归档路由固定采用 `Asia/Shanghai` 语义，不再继承构建主机时区。
归档月份的生成与文章筛选已统一进入 domain/application 边界。该契约在 UTC、
America/Los_Angeles 与 Asia/Shanghai 三种 Runner 时区下均保持既有 86
路由和页面主内容不变。

## 4. 客户端生命周期

原先分散的导航、目录、脚注和筛选脚本已合并到统一 runtime：

- 单一 lifecycle adapter
- PageController registry
- 每代页面独立 AbortController
- 逆序 destroy
- observer、timer、listener 清理
- 单一 resize dispatcher
- generation/active guard 防止旧异步结果回写

Playwright 已覆盖首次加载、20 次快速导航、resize、后退/前进和键盘导航。

## 5. 评论能力退役

### 5.1 仓库

已删除：

- `CommentsPanel`
- 评论浏览器脚本和样式
- 评论文案、配置、环境变量和生命周期调用
- `cloudflare/` 评论 Worker 项目
- D1 schema、Wrangler 配置和部署说明
- 任何 CommentsAdapter、No-op 或 future gateway 接缝

### 5.2 外部资源

经认证后执行并复核：

- Cloudflare Worker `astro-blog-comments`：删除
- D1 `astro-blog-comments-db`：按所有者决定直接删除，不导出、不备份
- `astro-blog-comments.seso.icu` custom domain/DNS：删除且不再解析
- GitHub OAuth App `astro-blog-oauth`：删除
- GitHub Actions secret `PUBLIC_COMMENTS_API_BASE`：删除
- GitLab 两项目：未发现评论专用变量残留

替代静态 Worker 上的 `/api/comments`、`/auth/session` 和任意 `/api/*`
均返回静态 404。

## 6. GitLab CI/CD

### 6.1 内容仓

内容仓 Pipeline：

1. 仅在 `Blog/**` 变化时验证。
2. 设置 `GIT_STRATEGY=none`。
3. 手动稀疏检出精确 commit 的 `Blog/`。
4. 避免 Vault 其他目录中的超长 Clippings 文件名触碰 Runner 文件系统。
5. 默认分支提交通过 downstream trigger 传递精确 content SHA。
6. 使用 `strategy: mirror` 传播下游状态。

### 6.2 Astro 仓

Pipeline stages：

```text
prepare → verify → build → browser → staging → production
```

- prepare：以 `CI_JOB_TOKEN` 精确检出内容 SHA 并 strict compile
- verify：audit critical gate、Astro check、unit、边界、评论零残留、
  Cloudflare 静态边界、Wrangler 类型漂移、OpenSpec strict
- build：只构建一次并保存 dist 与 manifests
- browser：Playwright 生命周期和全路由测试
- staging：dry-run、部署、HTTP sweep
- production：manual、protected、resource group 串行化

内容项目已将 `jacyl4/astro_blog` 加入 Job Token allowlist。
两项目默认分支均为 `main`；`main` 与本轮发布分支均为 protected branch，
禁止 force push。真实 prepare job 已使用 `CI_JOB_TOKEN` 从内容项目精确检出
锁定 SHA。

远端分支验证：

- 内容仓 Pipeline `#398` 成功，commit
  `c925ad442b8389376728e792c4a8dc31bf365227`
- Astro 仓 Pipeline `#403` 成功，commit
  `783201ef528e34bdfa1804ae1e9275599ff1d8b2`
- `#403` 的 prepare、verify、build、browser 四个 job 全部成功

远端实测发现 GitLab 19.1 的 artifact upload endpoint 对成功 job 返回 HTTP
500。为继续验证 shell Runner，本分支临时使用带 `CI_PIPELINE_ID` 的
pipeline-scoped local cache 在 jobs 间传递 normalized content 和 release
artifact；cache key 不跨 Pipeline 复用。生产切换前仍应修复 GitLab artifact
服务并恢复 7/14 天的持久证据归档。

## 7. Cloudflare Static Assets

`wrangler.jsonc` 固定：

- Wrangler `4.114.0`
- compatibility date `2026-07-27`
- assets directory `./dist`
- HTML handling `auto-trailing-slash`
- not found handling `404-page`
- staging `astro-blog-staging`
- production `astro-blog`

静态边界检查确认无 `main`、D1、KV、R2、Durable Object、Service Binding 或
其他动态 binding。staging 与 production dry-run 均显示 `No bindings found`。

现有 Pages 项目名为 `blog`，域名为 `blog-4la.pages.dev` 与
`blog.seso.icu`；生产域名仍由 Pages 提供。

最终 staging version：

`98b0332d-0194-48c5-9a8a-014d8896ef05`

staging 公开 build manifest 固定：

- app SHA：`783201ef528e34bdfa1804ae1e9275599ff1d8b2`
- content SHA：`c925ad442b8389376728e792c4a8dc31bf365227`

## 8. 验证证据

| 验证 | 结果 |
|---|---|
| Astro check | 75 files，0 error / warning / hint |
| Astro build | 86 pages |
| Unit tests | 6 files，17 tests passed |
| Browser tests | 7 passed |
| Date determinism | UTC、America/Los_Angeles、Asia/Shanghai 通过 |
| Route baseline | 86 → 86，无删除、无新增 |
| `<main>` baseline | 86 pages passed |
| Static smoke | 86 pages passed |
| Asset verification | 175 files，7,409,512 bytes |
| Staging HTTP sweep | 86 routes + 3 static 404 checks passed |
| OpenSpec | 8 changes passed，0 failed |
| Wrangler types | up to date |
| Wrangler dry-run | staging/production 均无 binding |
| npm audit gate | 0 critical；1 low、22 high 已登记风险 |
| GitLab content Pipeline | `#398` passed |
| GitLab application Pipeline | `#403` passed |

执行期原始证据位于 `.build/evidence/`，不会提交到仓库。

## 9. 已知差异与待办

1. Pages 对无尾斜杠路径返回 `308`，Workers Static Assets 当前返回 `307`；
   最终 URL 和页面内容一致。生产切换前需明确接受该平台差异，或另行引入
   redirect 规则；为了保持纯 Static Assets，本轮没有加入 Worker 入口脚本。
2. 生产域名仍由现有 Pages 提供，尚未切换到 `astro-blog`。
3. 旧 GitHub Pages Action 按计划保留七天作为受控回退入口。
4. production 回滚版本演练、观察窗口、三次真实内容发布和旧链路最终删除仍
   属于上线后任务。
5. 当前依赖审计存在 22 个 high，均未达到 critical 阻断阈值；不得使用
   `npm audit fix --force` 无差别升级。
6. 自托管 GitLab artifact upload 当前返回 HTTP 500；Pipeline 已有同一
   Runner 的 pipeline-scoped cache 临时传递方案，但这不替代持久发布证据，
   因而属于生产切换阻断项。

## 10. 生产切换门

以下条件全部满足后才能切换：

- 内容发布分支 Pipeline 成功
- Astro 发布分支 Pipeline 成功
- 两仓提交均可由远端精确 SHA 获取
- staging 使用最终 commit artifact 再部署并复核
- 307/308 差异取得明确决定
- GitLab artifact upload 恢复，或另行批准等价的不可变持久制品存储
- 记录 Pages 回退入口和 Cloudflare 当前版本
- 人工执行 production job
