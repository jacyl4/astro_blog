## 技术栈

- [Astro](https://astro.build) - 静态站点生成器
- [Tailwind CSS](https://tailwindcss.com/) - 实用至上型 CSS 框架
- TypeScript - 增强类型安全

## 项目结构

```text
astro_blog/
├── src/content/blog/   # 博客内容 Markdown 文件，按分类存放
├── public/             # 静态资源（如图片、favicon 等）
├── src/
│   ├── components/     # 可复用 UI 组件
│   ├── interfaces/     # TypeScript 接口定义
│   ├── layouts/        # 页面布局组件
│   ├── pages/          # 路由页面
│   ├── services/       # 业务逻辑
│   ├── styles/         # 全局样式
│   └── utils/          # 工具函数
├── astro.config.mjs    # Astro 配置
├── tsconfig.json       # TypeScript 配置
├── package.json        # 依赖与脚本
└── README.md           # 项目说明
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 其他

- 所有页面文件建议顶部加一句注释说明用途。
- 业务/工具/服务类文件建议文件头加模块职责注释。
- Markdown 文章无需注释，结构清晰即可。

---

> 如需了解更多，参见 [Astro 官方文档](https://docs.astro.build)
