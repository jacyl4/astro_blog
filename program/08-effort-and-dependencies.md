# 工期与依赖矩阵

## 人日估算

| Change | 最低 | 常规 | 主要变量 |
|---|---:|---:|---|
| establish-refactor-baseline | 1 | 2 | 当前脚本和测试基础 |
| build-obsidian-content-compiler | 3 | 5 | 历史笔记语法、wikilink 和 callout 复杂度 |
| modularize-blog-domain | 2 | 4 | BlogService 隐含契约数量 |
| replace-obsidian-sync-pipeline | 3 | 5 | GitLab 权限、Runner 和仓库结构 |
| migrate-cloudflare-static-deployment | 2 | 3 | 域名切换和 PWA 缓存行为 |
| unify-client-page-lifecycle | 2 | 4 | Swup/Astro 实际事件组合 |
| harden-quality-and-operations | 2 | 3 | Playwright、资产和性能门禁 |
| **合计** | **15** | **26** | 包含现有评论能力退役，不含下一代评论系统与视觉改版 |

## 依赖图

```text
establish-refactor-baseline
   ├── build-obsidian-content-compiler
   │      ├── modularize-blog-domain
   │      └── replace-obsidian-sync-pipeline
   │             └── migrate-cloudflare-static-deployment
   ├── unify-client-page-lifecycle
   └───────────────────────────────┐
                                   ▼
                       harden-quality-and-operations
```

## 并行建议

可并行：

- 内容编译器 fixtures 与 GitLab Pipeline staging 权限准备；
- Blog 领域单测与 Cloudflare staging 项目创建；
- 客户端生命周期测试与静态资产质量脚本。

应串行：

- URL 基线完成前，不开始 slug 重构；
- 内容编译器稳定前，不切换 Obsidian Pipeline；
- 双仓构建稳定前，不切换 Cloudflare 生产发布；
- 所有核心 change 完成后，再统一升级 Astro 主版本。
