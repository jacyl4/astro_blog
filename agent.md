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
- ~~表格字体缩小，以便更好地展示内容。同时移动界面表格支持左右滑动，以便看到隐藏部分~~ ✅ 已完成
- ~~评论系统需要完整排查，总是显示获取登录状态失败，获取评论失败。而且 使用github按钮点击，通过github登录后，会跳转404~~ ✅ 已完成（需重新部署 Worker）
- ~~文章正文的平滑显示的特效没有了，需要修复~~ ✅ 已完成
- ~~项目中还有不少 javascript 部份，尽量以 typescript 实现。~~ ✅ 已完成

### 最近更新（2025-10-03）
1. 表格样式优化：字体从 0.9375rem 缩小到 0.875rem，移动端 0.8125rem 并增强横向滚动
2. 评论系统完整修复：
   - 修复 JWT base64url 解码问题
   - 修复 OAuth state cookie 格式不一致导致的 "Invalid state cookie" 错误
   - 移除阻止评论窗显示的 401 状态检查
   - 添加评论面板展开/收起动画
   - **已重新部署 Worker** (Version: a59d2b41)
3. 文章内容添加 fadeIn 动画（0.6s 淡入 + 向上平移）
4. TypeScript 迁移：remark-callouts.js → remark-callouts.ts
   - 注：public/scripts/ 下的脚本保留为 .js（浏览器直接执行）
5. 新增测试脚本：`docs/test-comments.sh` - 快速验证评论系统配置

### 评论系统配置
- Worker 域名: `https://astro-blog-comments.seso.icu`
- GitHub OAuth 回调: `https://astro-blog-comments.seso.icu/auth/github/callback`
- 前端环境变量: `PUBLIC_COMMENTS_API_BASE="https://astro-blog-comments.seso.icu"`
- **重要**：必须在 Cloudflare Dashboard 配置 Worker 环境变量（GITHUB_CLIENT_ID、GITHUB_CLIENT_SECRET、JWT_SECRET）
- **重要**：必须在 Cloudflare Pages 配置环境变量（PUBLIC_COMMENTS_API_BASE）并重新部署
- 详细配置指南: [docs/worker-setup.md](./docs/worker-setup.md)
- 部署检查清单: [docs/deployment-checklist.md](./docs/deployment-checklist.md)
