# agent.md

面向后续开发者（或自动化 Agent）的快速上手说明。

## 环境概览
- 框架：Astro 5 + TypeScript。
- 样式：Tailwind CSS v4 通过 `@tailwindcss/vite` 集成，自定义设计令牌在 `src/styles/global.css` 与 `src/styles/modules/*` 中维护。
- 动画/过渡：Swup + Morph Plugin（`astro.config.mjs` 集成）。
- PWA：`vite-plugin-pwa` 以 InjectManifest 模式注册 `src/sw.ts`。

## 关键约束
- **禁止修改** `src/content/blog` 下的 Markdown 文件 —— 该目录由外部同步更新。
- 如果新增图标，记得同步更新 `astro.config.mjs` 中 `icon` 集成的白名单。
- 修改 `BlogService` 后，如需重新读取内容，可调用 `resetBlogCache()` 清空缓存（在同一进程内）。

## 代码指南
- 全局入口布局位于 `src/layouts/MainLayout.astro`；页面在 slot 中渲染，侧边栏通过 `CategoryList` / `TagList` / `ArchiveList` 组件生成。
- 格式化日期请使用 `formatDate`（位于 `src/utils/dateUtils.ts`），避免重复实现。
- UI 文案统一维护在 `src/consts.ts`；如需新增文案，请保持命名一致性。
- Tailwind v4 使用 JIT，请确保新类名可被扫描（位于 `tailwind.config.js` 的 `content` 数组覆盖范围内）。

## 测试/验证建议
- `npm run build` 会自动执行 `astro check`，用于验证 Markdown frontmatter 与 TypeScript 类型。
- 构建后建议访问 `npm run preview`，确认 PWA 与页面转场正常；`sw.ts` 为 InjectManifest，需要重新构建才能看见更新。

## 其他备注
- `src/services/BlogService.ts` 维护分类、标签、归档缓存；如需新增聚合逻辑，请复用现有缓存结构或记得清理。
- 目录组件 `TableOfContents` 依赖 `astro:page-load` / `astro:after-swap` 事件，修改时请确认 Swup 兼容性。
- 代码风格倾向于简洁注释，避免过度说明显而易见的逻辑。

## 新需求
- 我需要给我的博客搭建一个评论系统，要求支持 Markdown 语法，并且可以通过 GitHub 账号登录。请帮我设计一个解决方案。
- 使用 cloudflare D1 存储评论数据，使用 cloudflare workers 进行处理，
- 评论系统界面放置在打开文章后的右侧，像TOC类似。
