# 当前状态与施工假设

## 当前链路

```text
jacyl4/obsidian-digital: Blog/**/*
    ↓ GitLab shell Runner
clone jacyl4/astro_blog → rsync --delete → src/content/blog
    ↓ GitLab CI Bot commit + push main
Astro build / 当前 Cloudflare Pages 发布工作流
```

## 已知状态

- Astro 当前可成功构建约 86 个静态页面。
- 内容读取大多经过 BlogService。
- 浏览器端使用 Swup/Astro 相关页面生命周期事件。
- 生产站点 `https://blog.seso.icu` 当前渲染评论 UI、加载评论脚本并访问 `https://astro-blog-comments.seso.icu`。
- 评论 Worker、D1、GitHub OAuth、跨域 Cookie、环境变量和公开域名均属于当前生产能力；已批准完整退役。
- 内容源为自托管 GitLab 项目 `jacyl4/obsidian-digital`，默认分支 `main`，以 `Blog/` 目录作为发布边界。
- 当前 `Blog/` 发布树只有 Markdown 文件；没有独立 `Attachments/` 发布目录。
- 当前内容 Pipeline 会将同步结果提交到 Astro 仓库，因此目标仓库提交不能直接表达原始内容 SHA。
- 当前部署触发范围、依赖安装方式和测试覆盖需要增强。

## 本计划使用的假设

1. Obsidian 内容位于独立 GitLab 仓库 `jacyl4/obsidian-digital`，能够产生独立内容 commit SHA。
2. Astro Blog 继续保持静态生成模式。
3. 现有 GitLab shell Runner 可运行同步；目标流水线需要在干净工作区验证 Node 24、npm 和 Wrangler 4。
4. Cloudflare API Token 可存放在 GitLab Protected Variable 中。
5. 生产域名可以在 Pages 与 Workers Static Assets 之间完成受控切换。
6. 当前评论能力允许完整退役；未来评论系统不复用本计划中的接口、Worker 或数据模型。
7. 现有文章中可能存在缺少稳定 `id` 或 `slug` 的历史数据，因此内容编译器需要兼容迁移期。

## 开工时需要补录的实际参数

| 参数 | 值 |
|---|---|
| Astro Blog GitLab 项目 | `jacyl4/astro_blog` |
| Obsidian Content GitLab 项目 | `jacyl4/obsidian-digital` |
| 内容发布目录 | `Blog/` |
| 生产域名 | `https://blog.seso.icu` |
| 当前 Pages 项目 | `blog`（来自现有 workflow；实施时用 Cloudflare API 再确认） |
| 当前评论 Worker/域名 | `astro-blog-comments` / `https://astro-blog-comments.seso.icu`（待退役） |
| 目标静态 Worker 名称 | `<实施前确认>` |
| staging 域名 | `<实施前创建并记录>` |
| Node 版本 | `24.x` |
| npm 包管理器 | `npm` |
| 当前 Astro 版本 | `5.18.2`（来自当前 package-lock.json） |
