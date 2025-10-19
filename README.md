# Astro 博客项目

使用 Astro 5 与 Tailwind CSS v4 搭建的个人博客，集成了内容集合、PWA、页面过渡等现代化特性。

## ✨ 特性亮点
- Astro Content Collections 管理博客与页面内容，自动校验 frontmatter。
- Tailwind CSS v4（通过 `@tailwindcss/vite`）+ 自定义设计令牌实现主题与暗色模式。
- Swup + Morph Plugin 带来页面转场，与目录滚动监听兼容。
- Vite PWA 注入式 Service Worker，离线缓存页面/静态资源。
- 博客服务层提供分类、标签、归档等聚合能力并带缓存，可通过 `resetBlogCache()` 手动刷新。

## 🛠 技术栈
- [Astro](https://astro.build)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite PWA](https://vite-pwa-org.netlify.app/)
- [Swup](https://swup.js.org/)

## 📁 目录结构
```text
astro_blog/
├── public/                   # 静态资源（favicon、PWA 图标、背景图等）
├── src/
│   ├── components/           # 可复用 UI 组件
│   ├── layouts/              # 页面布局（MainLayout 等）
│   ├── pages/                # Astro 路由页面
│   ├── services/             # 业务逻辑（BlogService 等）
│   ├── styles/               # 全局与模块化样式
│   ├── utils/                # 工具函数（日期格式化、字符串处理等）
│   └── content/              # Markdown 内容（通过 Collections 注册）
├── astro.config.mjs          # Astro + Vite 配置
├── tailwind.config.js        # Tailwind v4 配置
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目说明（当前文件）
```

> ⚠️ 内容同步提示：`src/content/blog` 下的 Markdown 文件来自外部同步源，请勿直接修改，以免打断同步流程。

## 🚀 快速开始
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 产出静态文件
npm run build

# 本地预览生产构建
npm run preview
```

If you prefer another package manager like `bun` or `yarn`, replace the command prefix accordingly. This project defaults to using npm.

## 🧱 关键模块说明
- `BlogService`：封装文章读取、排序、聚合逻辑，内置结果缓存；如需强制刷新，可在开发时调用 `resetBlogCache()`。
- `UI_TEXT` 与 `PAGE_TITLES`：集中维护站点文案与页面标题，便于国际化或统一修改。
- `dateUtils.ts`：提供宽容的日期格式化，防止无效日期导致崩溃。
- Tailwind 模块化样式位于 `src/styles/modules`，通过 `@import` 方式拼装。

## ✅ 开发小贴士
- 页面组件默认通过 `MainLayout` 输出基础结构（导航、侧栏、目录、主题切换）。
- 新增图标时在 `astro.config.mjs` 的 `icon` 集成中登记想要的图标名称。
- 若需自定义页面 `<head>` 信息，可在页面组件中向 `MainLayout` 传入 `title` 与 `description`。
- 运行 `npm run build` 会先执行 `astro check`，确保内容与类型安全。

更多资料参考 [Astro 官方文档](https://docs.astro.build)。
