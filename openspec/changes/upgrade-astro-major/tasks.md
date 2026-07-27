## 1. 版本与风险盘点

- [ ] 1.1 核对 Astro 官方迁移文档、目标版本、Node/Vite 要求和支持周期
- [ ] 1.2 保存升级前 npm audit、lockfile、构建时间和 route/asset/build manifest
- [ ] 1.3 列出 Astro、Content Layer、Swup、PWA、Markdown 与图片处理兼容矩阵

## 2. 分组升级

- [ ] 2.1 升级 Astro 核心与官方工具，保持纯静态输出
- [ ] 2.2 迁移配置和 Content Layer API
- [ ] 2.3 处理 Swup/Astro 集成兼容并验证生命周期事件
- [ ] 2.4 处理 Vite PWA/Workbox 兼容并验证更新策略
- [ ] 2.5 更新 lockfile 并重新分类 audit

## 3. 回归

- [ ] 3.1 执行 strict content compile、Astro check、unit 和 build
- [ ] 3.2 比较全部 route 与 `<main>` HTML 基线
- [ ] 3.3 执行静态资产、PWA、全路由 HTTP 和浏览器生命周期测试
- [ ] 3.4 在 staging 验证 404、trailing slash、缓存和 Service Worker 更新
- [ ] 3.5 演练回滚到升级前 artifact/version

## 4. 上线

- [ ] 4.1 记录批准的基线差异和依赖风险变化
- [ ] 4.2 发布生产并完成观察窗口
- [ ] 4.3 执行 `/opsx:verify upgrade-astro-major` 并归档
