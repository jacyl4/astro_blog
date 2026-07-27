# 分阶段施工顺序

## Wave 1：建立基线，1～2 人日

对应 change：`establish-refactor-baseline`

完成内容：

- 记录现有路由、页面数量、静态资产和构建命令；
- 捕获当前生产评论能力及资源清单；
- 从站点、仓库、CI 和 Cloudflare 完整退役评论能力；
- 当前构建不再包含评论 UI、脚本、样式、环境变量或网络请求；
- 建立 URL 快照和基础 smoke test；
- CI 改用 `npm ci`；
- 生成初版 build manifest。

放行门：当前线上行为保持一致，所有既有页面可访问。

## Wave 2：建设内容编译器，4～6 人日

对应 change：`build-obsidian-content-compiler`

完成内容：

- 建立两阶段 inventory/transform；
- 接入 Unified/Remark 成熟生态；
- 支持 GFM、frontmatter、Obsidian wikilink 和 callout；本地附件在当前契约中视为不支持输入并明确失败；
- 引入稳定 `id`、`slug`、公开状态和诊断；
- 输出标准 Markdown 和内容清单；
- 迁移现有文章并与原构建逐篇比较。

放行门：同一输入多次编译得到相同 manifest；历史页面数量和 URL 不减少。

## Wave 3：模块化 Blog 领域，2～4 人日

对应 change：`modularize-blog-domain`

完成内容：

- 将纯领域逻辑与 Astro adapter 分开；
- 页面只依赖模块公开入口；
- selector、slug 和归档逻辑拥有独立单测；
- BlogService 逐步退化为兼容 façade，最后移除。

放行门：路由快照、列表顺序、分类、标签和归档输出与基线一致。

## Wave 4：替换 Obsidian 同步链路，3～5 人日

对应 change：`replace-obsidian-sync-pipeline`

完成内容：

- `jacyl4/obsidian-digital` 的 `Blog/**` 变化触发下游 Astro Pipeline；
- Astro Pipeline 按 `CONTENT_SHA` 精确拉取；
- 内容进入临时工作区，不再通过提交同步副本写入 `src/content/blog`；
- 构建和部署记录双 SHA；
- 生产部署串行化。

放行门：旧 rsync/commit/push 同步链路删除，失败 Pipeline 不改变 Astro 仓库或生产环境。

## Wave 5：迁移 Cloudflare 静态发布，2～3 人日

对应 change：`migrate-cloudflare-static-deployment`

完成内容：

- Wrangler 配置成为发布事实源；
- 建立 staging Worker Static Assets；
- 验证路由、404、缓存、headers 和产物大小；
- 切换生产域名；
- 验证版本回滚；
- Pages 保留观察窗口后下线。

放行门：生产访问、搜索索引 URL 和缓存行为与基线一致。

## Wave 6：统一浏览器生命周期，2～4 人日

对应 change：`unify-client-page-lifecycle`

完成内容：

- 建立单一生命周期 adapter；
- Navigation、TOC 控制器提供 mount/destroy；
- 取消旧请求和 Observer；
- resize 只改变布局；
- 浏览器连续导航测试。

放行门：20 次连续导航后监听器与请求数量不增长。

## Wave 7：固化质量和运维能力，2～3 人日

对应 change：`harden-quality-and-operations`

完成内容：

- 单测、编译器集成、静态路由、浏览器测试进入 CI；
- 静态资产、字体、图片和 manifest 进入质量检查；
- Cloudflare observability、日志字段和运行手册完整；
- 依赖升级分批执行并留存风险说明。

放行门：CI 门禁、staging 验证、回滚演练全部通过。
