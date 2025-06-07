# Astro 博客

使用 Astro 构建的个人博客网站，内容来源于 @posts 目录下的 Markdown 文件。

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

## 设计原则

本项目遵循以下设计原则：

- 单一职责原则 (Single Responsibility Principle)
- 开放封闭原则 (Open/Closed Principle)
- 里氏替换原则 (Liskov Substitution Principle)
- 依赖倒置原则 (Dependency Inversion Principle)
- 接口隔离原则 (Interface Segregation Principle)
- 迪米特法则 (Law of Demeter)
- 组合复用原则 (Composite Reuse Principle)
- 高内聚低耦合原则 (High Cohesion and Low Coupling)

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

## 添加内容

要添加新的博客文章，只需在 `src/content/blog/` 目录下相应的类别文件夹中创建新的 Markdown 文件即可。

```text
src/content/blog/
├── HomeLab/           # HomeLab 类别的文章
├── Programming/       # 编程类别的文章
└── Other/             # 其他类别的文章
```

## 其他

- 所有页面文件建议顶部加一句注释说明用途。
- 业务/工具/服务类文件建议文件头加模块职责注释。
- Markdown 文章无需注释，结构清晰即可。

---

> 如需了解更多，参见 [Astro 官方文档](https://docs.astro.build)
