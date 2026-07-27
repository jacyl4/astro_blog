# Astro Blog OpenSpec 规划核验报告

> 核验日期：2026-07-27  
> 核验范围：博客架构、仓库结构、CI/CD、Cloudflare 交付、评论退役和 OpenSpec 工件完整性  
> 明确排除：文章正文内容与写作质量分析

## 1. 结论

本规划包经过 OpenSpec 1.5.0 严格校验、实际仓库对照和用户契约定案后，已经具备进入实施阶段的结构完整性。

最终结论：

- OpenSpec 自定义 schema 有效。
- 7 个 active changes 均通过 `--strict`。
- OpenSpec root 健康，主 specs 与 archive 目录存在。
- 原规划中错误的评论状态、内容同步实现、内容发布目录和附件假设已纠正。
- 高犹豫度决策已全部定案，没有剩余的架构决策阻塞项。
- Worker 名称、staging 域名、Cloudflare resource ID 等实施参数仍需在有权限的环境中补录，但不改变架构合同。

## 2. 使用的校验工具

| 工具 | 版本/来源 | 用途 |
|---|---|---|
| OpenSpec CLI | `1.5.0` | schema、delta specs、change 与 root 健康校验 |
| Git | 当前本地 CLI | 仓库、分支、提交与同步历史核验 |
| npm/package-lock | lockfile v3 | 实际 Astro 与依赖版本核验 |
| curl | 当前本地 CLI | 生产站点与评论公开端点只读探测 |
| Wrangler | 本地 `4.41.0` | 现有评论 Worker 配置核验；账户未认证，未执行资源修改 |

OpenSpec 的核心校验命令：

```bash
openspec schema validate astro-engineering-change --json
openspec validate --all --strict --json --no-interactive
openspec doctor --json
./scripts/verify-package.sh
sha256sum -c MANIFEST.sha256
```

## 3. 初始 OpenSpec 缺口

### 3.1 纯重构 change 无 delta spec

初始严格校验结果为 6/7 通过，`modularize-blog-domain` 失败：

```text
No delta specs found
```

原因：

- change 使用了自定义 `.openspec.yaml` 字段 `skip_specs: true`；
- OpenSpec 1.5 的 `--skip-specs` 是 archive 命令参数，不是 strict validator 识别的 change 元数据；
- 自定义 schema 同时把 specs 定义为必需工件。

修复：

- 删除无效的 `skip_specs` 元数据；
- 增加 `blog-module-boundary` 工程契约；
- 只规范公开入口、Astro 隔离、Content Collection adapter 和行为保持，不虚构新的产品功能。

### 3.2 OpenSpec root 目录不完整

初始 `openspec doctor --json` 报告：

- 缺少 `openspec/specs/`；
- 缺少 `openspec/changes/archive/`。

修复后 root 为 healthy。

### 3.3 自校验脚本错误统计 archive

创建 `changes/archive/` 后，原 `verify-package.sh` 会把 archive 当作第八个 active change，并要求其中存在 proposal/design/tasks。

修复：

- active change 遍历显式排除 `archive`；
- 包自检增加 `openspec doctor --json`。

## 4. 实际仓库事实

### 4.1 Astro 应用仓库

| 项目 | 实际值 |
|---|---|
| GitLab 项目 | `jacyl4/astro_blog` |
| Remote | `https://gitlab.seso.icu:32221/jacyl4/astro_blog.git` |
| 默认分支 | `main` |
| 当前 Astro | `5.18.2` |
| Node 目标 | `24.x` |
| 包管理器 | npm / package-lock v3 |
| 构建模式 | Astro 静态生成 |
| 当前静态 HTML | 86 |
| 生产域名 | `https://blog.seso.icu` |
| 当前 Pages project | workflow 声明为 `blog`，待 Cloudflare API 权限下再次确认 |

当前应用仓库没有 `.gitlab-ci.yml`，但存在 `.github/workflows/deploy-to-cloudflare.yml`：

- 只监听 `src/content/blog/**`；
- 使用 `npm install`；
- 使用旧 `cloudflare/pages-action@v1`；
- 发布到 Cloudflare Pages project `blog`。

因此将交付合同迁移到 GitLab CI、`npm ci`、build-once/deploy-many 和 Wrangler 配置是合理方向。

### 4.2 Obsidian 内容仓库

| 项目 | 实际值 |
|---|---|
| 本地路径 | `/home/jacyl4/1base/@obsidian/digital` |
| GitLab 项目 | `jacyl4/obsidian-digital` |
| Remote | `https://gitlab.seso.icu:32221/jacyl4/obsidian-digital.git` |
| 默认分支 | `main` |
| 发布目录 | `Blog/` |
| 当前发布文件类型 | Markdown |
| 独立附件目录 | 无 |
| Runner | shell tag |

现有 `.gitlab-ci.yml` 的真实动作：

```text
Blog/** 变化
  → shell Runner
  → clone jacyl4/astro_blog 到 /tmp/astro_blog
  → rsync --delete Blog/ 到 src/content/blog/
  → GitLab CI Bot commit
  → push astro_blog main
```

原规划中的“固定 `/home/jacyl4/...` 共享目录同步”和“删除可能残留”并不准确：

- job 使用的是临时 `/tmp/astro_blog`；
- `rsync --delete` 与 `git add -A` 已处理删除。

实际风险是：

1. 原始内容 SHA 没有进入部署身份；
2. 内容镜像提交混入应用历史；
3. 并发 Pipeline 可能争用目标 `main`；
4. 长期 OAuth token 被拼入 clone URL；
5. 上游内容 Pipeline 不反映最终部署结果；
6. 失败或延迟发生时，app/content 组合不够直观。

规划已改为：

```text
jacyl4/obsidian-digital @ CONTENT_SHA
  → validate Blog/
  → downstream trigger(strategy: mirror)
  → jacyl4/astro_blog checkout 精确 CONTENT_SHA
  → content compiler
  → immutable artifact
  → staging
  → protected production
```

### 4.3 内容编译边界

实际 CI 已证明 `Blog/` 目录本身就是发布选择规则，不需要再引入 `publish` 属性、标签或 `Publish/` 目录假设。

当前发布树只有 Markdown，因此本轮合同为：

- `Blog/` 是唯一输入根；
- Vault 其他目录不得被扫描或发布；
- 支持 frontmatter、GFM、wikilink、heading link 和 callout；
- 生成标准 Markdown 与 content manifest；
- 本地附件发布不在本轮预设计；
- 如出现本地图片、音频、视频或 PDF 引用，编译器必须明确失败并提示另开 change；
- 外部 URL 静态资源仍按普通 Markdown 链接处理。

这比提前设计不存在的 `Attachments/`、asset copy 和 asset manifest 更符合当前项目规模。

## 5. 评论系统事实与最终契约

### 5.1 核验到的实际状态

规划原先声明“评论未在生产启用”，该声明错误。

只读核验结果：

- `https://blog.seso.icu` 当前包含 `CommentsPanel`；
- 页面加载 `/scripts/comments-panel.js`；
- 构建配置包含 `PUBLIC_COMMENTS_API_BASE`；
- 评论 API 指向 `https://astro-blog-comments.seso.icu`；
- `/auth/session` 当前返回有效 JSON；
- `/api/comments` 当前返回有效 JSON；
- 仓库存在 Comments Worker、D1 schema、GitHub OAuth、JWT/Cookie、CORS 和 Wrangler 配置。

### 5.2 用户定案

**完整退役评论功能，以后从零重新设计。**

该决定已转化为 `comments-decommission` 能力合同：

1. 记录现有代码与生产资源清单；
2. 按数据保留决定导出 D1 和必要审计证据；
3. 删除评论组件、脚本、样式、文案、配置、环境变量和生命周期代码；
4. 删除仓库中的评论 Worker、D1 migration/schema、Wrangler 配置和说明；
5. 撤销 GitHub/GitLab OAuth、variables、secrets 和自动部署；
6. 删除 Cloudflare Worker、route/custom domain、D1、secret；
7. 删除 `astro-blog-comments.seso.icu` DNS；
8. 删除 CommentsAdapter、No-op controller、future gateway 和 roadmap 等预设计接缝；
9. 通过代码、构建产物、浏览器网络、Cookie、Cloudflare、OAuth、CI 和 DNS 共同证明零残留。

删除基础设施属于不可逆操作，因此合同要求：

- 先记录资源身份；
- 先完成已批准的数据导出；
- 应用代码可以回滚；
- 已删除的评论基础设施不作为普通回滚路径恢复；
- 未来评论必须创建新的 OpenSpec change，不继承旧接口和数据模型。

## 6. Cloudflare 目标架构核验

Workers Static Assets 能直接托管 SSG 输出，并支持：

- `assets.directory`；
- `html_handling`；
- `not_found_handling`；
- 同一构建 artifact 的 staging/production 发布；
- Worker version/deployment 管理。

规划模板使用：

```jsonc
"assets": {
  "directory": "./dist",
  "not_found_handling": "404-page",
  "html_handling": "auto-trailing-slash"
}
```

它与当前 Astro 的 `build.format = "directory"`、`trailingSlash = "always"` 和自定义 404 方向一致，但切换前仍必须通过全路由 staging 对比。

相关官方资料：

- [Cloudflare Pages 迁移到 Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Static Assets 配置](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [静态站点生成与自定义 404](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)

评论退役后，目标 Wrangler 配置保持纯静态：

- 无 Worker `main`；
- 无 `run_worker_first`；
- 无 Service Binding；
- 无 D1/KV/R2 binding；
- 任意 `/api/*` 按静态不存在路径处理。

Workers Static Assets 的选择不再依赖“未来评论 gateway”假设，而由仓库化配置、build-once/deploy-many、版本证据和回滚能力支撑。

## 7. 其他实际风险

### 7.1 PWA 图标为空

当前：

```text
public/pwa-192x192.png  0 bytes
public/pwa-512x512.png  0 bytes
```

规划中的 asset gate 必须在 Wave 1/7 阻断空文件进入发布。

### 7.2 测试基础不足

当前 package scripts 只有 dev/build/preview/astro/serve，没有 unit、browser、route、asset 或 smoke scripts。规划已经按 change 分阶段建立，而不是假定这些命令已存在。

### 7.3 BlogService 隐含契约

当前 BlogService：

- 直接访问 `astro:content`；
- 负责标题、category、tags、slug、排序、缓存和 selectors；
- slug 冲突根据遍历顺序追加序号；
- collection 错误会降级为空数组。

因此模块化 change 必须先建立 characterization tests，并由 `blog-module-boundary` 约束公开入口、框架隔离和行为保持。

## 8. 已落成的架构决策

| ID | 决策 | 状态 |
|---|---|---|
| D01 | 完整退役当前评论能力，不保留未来 adapter/gateway | 已定案 |
| D02 | `jacyl4/obsidian-digital:Blog/` 是唯一发布边界 | 已由实际 CI 证明 |
| D03 | 用 downstream Pipeline + 精确 `CONTENT_SHA` 替代 rsync 后 commit/push | 已定案 |
| D04 | 内容 artifact 不再提交回 Astro 源码目录 | 已定案 |
| D05 | 当前不设计本地附件发布，出现时明确失败 | 已定案 |
| D06 | 目标 Cloudflare 发布为纯 Workers Static Assets | 已定案 |
| D07 | 下一代评论系统必须建立全新 OpenSpec change | 已定案 |

## 9. 剩余实施参数

以下是部署参数，不是架构决策：

| 参数 | 状态 | 获取方式 |
|---|---|---|
| 当前 Pages project 的 Cloudflare 侧确认 | workflow 声明为 `blog` | Cloudflare API/Dashboard |
| 目标静态 Worker 名称 | 待创建 | 实施前命名并写入 Wrangler |
| staging Worker/域名 | 待创建 | Cloudflare staging 环境 |
| Cloudflare account/resource IDs | 待权限 | API/Dashboard，不写入公开报告 |
| GitLab Job Token allowlist | 待配置 | 两项目 Settings |
| 性能预算数值 | 待基线 | 生产 trace 后建立 |

这些参数不得以 `<填写>` 留在最终生产配置中，但不阻塞当前计划归档为施工契约。

## 10. 最终 OpenSpec 状态

最终实测结果：

```text
Schema: astro-engineering-change valid
Changes: 7 passed / 0 failed
Doctor: healthy
Manifest: 96/96 files OK
Package verifier: passed
YAML parse: 11 files passed
Shell syntax: 2 scripts passed
Wrangler static template: staging dry-run passed, no bindings found
Astro check: 0 errors / 0 warnings / 0 hints
Astro build: 86 pages, completed
```

后续施工必须按 `START_HERE.md` 与 `program/03-execution-sequence.md` 顺序执行。任何 change 只有完成对应 verification、rollout、回滚证据和 OpenSpec archive 后才算完成。
