# 生产切换手册

## A. 内容流水线切换

1. 冻结生产内容更新窗口。
2. 记录最后一次旧同步任务的内容 commit。
3. 运行新 Pipeline，以同一个 content SHA 构建。
4. 比较：
   - 页面数量；
   - URL 清单；
   - 分类、标签和归档数量；
   - 内容清单；
   - 首页和抽样文章 HTML。
5. 新 Pipeline 只发布到 staging。
6. 完成人工抽查后，将内容仓库 trigger 指向新 Pipeline。
7. 禁用旧的绝对路径同步任务，但保留配置七天。
8. 连续观察三次内容发布后删除旧任务。

## B. Cloudflare 静态发布切换

1. 记录当前 Pages deployment、域名、DNS 和构建产物。
2. 使用 `wrangler deploy --env staging` 发布同一 `dist/`。
3. 对 staging 执行：
   - 全路由请求；
   - 404；
   - `_headers` 或 Worker 响应头；
   - 静态资源缓存；
   - PWA/Service Worker 更新；
   - build manifest。
4. 将生产 Worker 发布并记录 version/deployment ID。
5. 在低流量窗口切换自定义域名或 route。
6. 执行 15 分钟密集检查和 24 小时观察。
7. Pages 保留七天作为回退入口。
8. 观察期结束后冻结或删除旧 Pages 自动部署。

## C. 放行检查

- [ ] 首页、文章、分类、标签、归档和 404 全部正常。
- [ ] 随机抽取 20 篇文章，正文、目录、脚注和外部资源正常。
- [ ] 搜索引擎核心 URL 未变化。
- [ ] 浏览器无评论请求。
- [ ] 评论域名、Worker、D1、OAuth、secret 和 DNS 已按退役清单关闭且无残留入口。
- [ ] 页面多次切换无重复监听或错误日志。
- [ ] manifest 中 app/content SHA 与本次 Pipeline 一致。
