# 来源与版本说明

本施工包根据以下材料形成：

1. 用户提供的 `ARCHITECTURE_REFACTOR_REPORT.md`，作为当前架构和已发现风险的基线。
2. Fission-AI/OpenSpec 当前 artifact-guided 工作流：proposal、specs、design、tasks，以及 brownfield delta-first 原则。
3. Cloudflare `skills` 仓库中的 Wrangler、Workers Best Practices、Pages 与 web-perf 指导。
4. Remark / Unified 生态以及 `@flowershow/remark-wiki-link` 对 Obsidian wikilink 的支持情况。
5. 实际内容仓库 `/home/jacyl4/1base/@obsidian/digital/.gitlab-ci.yml`：自托管项目 `jacyl4/obsidian-digital`、`Blog/` 发布目录、shell Runner、rsync/commit/push 同步链路。
6. 生产探测：`https://blog.seso.icu` 当前加载评论前端，`https://astro-blog-comments.seso.icu` 当前提供 session/comments 接口。
7. 用户决策：完整退役现有评论能力，未来通过新的 OpenSpec change 从零设计。

检索日期：2026-07-27。

建议实际开工前执行：

```bash
npm install -g @fission-ai/openspec@latest
npm install -D wrangler@latest
openspec update
wrangler --version
```

Wrangler 参数、Cloudflare binding 和兼容日期属于持续变化项，每次修改配置前应重新核对当前官方文档和本地 `node_modules/wrangler/config-schema.json`。
