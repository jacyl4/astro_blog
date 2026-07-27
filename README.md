# Astro 博客项目

使用 Astro 5 与 Tailwind CSS v4 搭建的个人博客，集成了内容集合、PWA、页面过渡等现代化特性。

## ✨ 特性亮点
- Astro Content Collections 管理博客与页面内容，自动校验 frontmatter。
- Tailwind CSS v4（通过 `@tailwindcss/vite`）+ 自定义设计令牌实现主题与暗色模式。
- Swup + Morph Plugin 带来页面转场，与目录滚动监听兼容。
- Vite PWA 注入式 Service Worker，离线缓存页面/静态资源。
- `src/modules/blog` 以公开入口隔离内容读取、领域规则和页面查询。

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
│   ├── modules/blog/         # 博客领域、应用服务与 Astro 内容适配器
│   ├── client/               # 统一页面生命周期与浏览器控制器
│   ├── styles/               # 全局与模块化样式
│   ├── utils/                # 工具函数（日期格式化、字符串处理等）
│   └── content/              # legacy 回退内容与独立页面内容
├── tools/content-compiler/   # 外部 Obsidian Blog/ 内容编译器
├── tools/release/            # 路由、资产、构建清单及质量验证
├── astro.config.mjs          # Astro + Vite 配置
├── tailwind.config.js        # Tailwind v4 配置
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目说明（当前文件）
```

> 发布内容的唯一来源是外部仓库 `jacyl4/obsidian-digital` 的 `Blog/`。
> `src/content/blog` 只在显式设置 `BLOG_CONTENT_SOURCE=legacy` 时作为观察期回退，不参与正常发布。

## 🚀 快速开始
```bash
# 安装依赖
npm ci

# 启动开发服务器
npm run dev

# 产出静态文件
npm run build

# 本地预览生产构建
npm run preview
```

默认包管理器是 npm，CI 必须使用 `npm ci`。

## 🧪 重构质量门禁

`baselines/routes.json` 保护已经公开的 URL。常规本地候选验证如下：

```bash
npm ci
npm run verify

# 安装一次 Chromium 后执行全量浏览器/HTTP 验证
npx playwright install chromium
npm run test:browser
```

候选清单和证据写入 `.build/`。构建产物中的
`dist/_meta/build-manifest.json` 记录应用 SHA、内容 SHA、lockfile、路由和
资产清单哈希。

## 🧱 关键模块说明
- `src/modules/blog/index.ts`：博客能力的唯一公开入口；页面和组件不得深层导入模块内部文件。
- `src/client/runtime`：Swup/Astro 页面切换唯一生命周期适配器，统一清理监听器、Observer 和 timer。
- `tools/content-compiler`：只读扫描外部 `Blog/`，输出规范化 Markdown、diagnostics 与 content manifest。
- `UI_TEXT` 与 `PAGE_TITLES`：集中维护站点文案与页面标题，便于国际化或统一修改。
- `dateUtils.ts`：提供宽容的日期格式化，防止无效日期导致崩溃。
- Tailwind 模块化样式位于 `src/styles/modules`，通过 `@import` 方式拼装。

## ✅ 开发小贴士
- 页面组件默认通过 `MainLayout` 输出基础结构（导航、侧栏、目录、主题切换）。
- 新增图标时在 `astro.config.mjs` 的 `icon` 集成中登记想要的图标名称。
- 若需自定义页面 `<head>` 信息，可在页面组件中向 `MainLayout` 传入 `title` 与 `description`。
- 运行 `npm run build` 会先执行 `astro check`，确保内容与类型安全。
- 内容源配置、故障处置、发布和回滚见 `operations/`。

## 📚 项目文档
- `openspec/changes/`：本轮重构的契约、场景和任务。
- `operations/`：发布、回滚、内容与资产故障手册及风险登记。

更多资料参考 [Astro 官方文档](https://docs.astro.build)。
