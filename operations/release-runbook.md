# 发布手册

## 前置条件

1. 内容仓库提交已包含稳定 `id`/`slug`，`content-source.lock.json` 指向该
   40 位提交 SHA 且模式为 `strict`。
2. GitLab CI Job Token allowlist 已允许 Astro 项目读取内容项目。
3. Cloudflare Worker 名称、staging 域名和 production 域名已被批准。
4. `CLOUDFLARE_API_TOKEN` 与账户标识只存在于受保护的 deployment variables，
   token 权限仅覆盖目标 Worker/域名。
5. production job 受保护、手动执行，并使用
   `resource_group: astro-blog-production`。

当前批准值：

- staging Worker：`astro-blog-staging`
- production Worker：`astro-blog`
- staging：`https://blog-staging.seso.icu`
- production：`https://blog.seso.icu`

## 候选构建

```bash
npm ci
bash tools/ci/prepare-content.sh
npm run verify:full
```

构建必须只发生一次。staging 与 production 必须下载同一个 `dist/` artifact，
不得重新构建。核验 `.build/manifests/build.json` 中的 app SHA、content SHA、
lockfile、route 和 asset hash。

## Staging

1. 对配置执行 Wrangler dry-run，确认没有 Worker entrypoint、D1、KV、R2、
   Service Binding 或其他动态 binding。
2. 部署 staging。
3. 对 route manifest 中全部 URL 执行 HTTP sweep。
4. 请求 `/api/comments`、`/auth/session` 和随机 `/api/*`，必须得到静态 404。
5. 检查 404、trailing slash、字体、PWA 图标、manifest 和 Service Worker。
6. 保存 deployment/version ID、HTTP 结果和浏览器 trace。

## Production

1. 人工核对 staging 的 build manifest 与待发布 artifact 完全一致。
2. 记录切换前 Pages deployment、DNS/route 和可回滚版本 ID。
3. 在低流量窗口执行受保护的 production job。
4. 域名切换后立即执行首页、文章、分类、标签、归档、about、404 和全路由 sweep。
5. 保存 [发布证据模板](release-evidence-template.md)。
6. 旧 Pages 入口保留七天；完成三次内容发布和观察期后再移除旧 Action。

任何 production 部署、域名切换或资源删除都必须在执行点取得明确确认。
