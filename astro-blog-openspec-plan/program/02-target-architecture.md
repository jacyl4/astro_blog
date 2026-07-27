# 目标架构

## 总体结构

```text
┌───────────────────────────────────────────────────────────────┐
│ Obsidian Content Repository                                  │
│ jacyl4/obsidian-digital @ CONTENT_SHA                        │
│ Blog/**/*.md                                                 │
└───────────────────────┬───────────────────────────────────────┘
                        │ CONTENT_SHA
                        ▼
┌───────────────────────────────────────────────────────────────┐
│ GitLab downstream pipeline                                   │
│ clone exact content SHA                                      │
│              │                                               │
│              ▼                                               │
│ tools/content-compiler                                       │
│ inventory → validate → transform → manifest → atomic output  │
│              │                                               │
│              ▼                                               │
│ .build/content + content-manifest.json                       │
└───────────────────────┬───────────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────────────┐
│ Astro Blog                                                    │
│ src/modules/blog                                              │
│ domain → application → infrastructure                         │
│ pages = composition root                                      │
│ client runtime = lifecycle controllers                        │
└───────────────────────┬───────────────────────────────────────┘
                        │ dist + build-manifest
                        ▼
┌───────────────────────────────────────────────────────────────┐
│ Cloudflare Worker Static Assets                              │
│ staging → smoke → production → version rollback              │
└───────────────────────────────────────────────────────────────┘
```

## 推荐代码布局

```text
astro_blog/
├── src/
│   ├── modules/
│   │   ├── blog/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── index.ts
│   │   ├── navigation/
│   │   ├── toc/
│   │   └── markdown/
│   ├── client/runtime/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   └── content/config.ts
├── tools/content-compiler/
├── .build/                       # Git ignored
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── browser/
│   └── fixtures/
├── openspec/
├── wrangler.jsonc
└── .gitlab-ci.yml
```

## 依赖方向

```text
pages/components
      ↓
module public API (`src/modules/<name>/index.ts`)
      ↓
application services
      ↓
domain + infrastructure adapters

content compiler ──produces──> normalized content
Astro runtime     ──consumes──> normalized content
```

## 原子性定义

一次生产发布由以下值唯一标识：

```text
applicationCommit
contentCommit
packageLockHash
contentCompilerVersion
routeManifestHash
assetManifestHash
```

这些值写入 `build-manifest.json` 并随静态产物发布。发布成功意味着全部值作为同一个 Cloudflare 版本生效。
