# 评论系统（Cloudflare D1 + Workers）部署手册

本文档指导你在 Cloudflare 上创建并配置评论服务（支持 GitHub 登录与 Markdown 渲染），并与本博客前端完成对接。

## 总览
- 存储：Cloudflare D1
- 计算：Cloudflare Workers
- 登录：GitHub OAuth App
- CORS：仅允许你的博客域名

最终会得到一个 Worker 基地址（例如 `https://astro-blog-comments.yourname.workers.dev`），博客前端会通过该地址读取/提交评论、完成登录。

---

## 一、准备 GitHub OAuth App
1. 访问 https://github.com/settings/developers ，创建一个 “OAuth Apps”。
2. 填写：
   - Application name：任意
   - Homepage URL：你的博客主页，例如 `https://blog.example.com`
   - Authorization callback URL：`https://<你的-workers-域名>/auth/github/callback`
3. 创建完成后记下：`Client ID` 与 `Client Secret`。

注意：部署 Worker 后再回来更新回调地址也可以，先记住需要的路径 `/auth/github/callback`。

---

## 二、创建 D1 数据库并导入表结构
1. 打开 Cloudflare 控制台 → `D1` → `Create database`，取名 `comments-db`（或任意名称）。
2. 在新数据库的 `Data` 或 `Query` 页面，执行 repo 中 `cloudflare/schema.sql` 的内容，创建 `users` / `comments` 两张表与索引。

---

## 三、部署 Workers 服务
1. 进入本仓库 `cloudflare/` 目录：
   - 安装依赖：`npm i`
2. 修改 `cloudflare/wrangler.toml`：
   - `name`: Worker 名称（例如 `astro-blog-comments`）
   - `[[d1_databases]].binding = "DB"` 保持不变
   - `[[d1_databases]].database_name` 与你在 D1 创建的名字一致
   - `[[d1_databases]].database_id` 填入控制台里该 D1 的 `ID`
   - `[vars].ALLOWED_ORIGINS` 设置为你的博客域名，多个以逗号分隔，例如：
     - `ALLOWED_ORIGINS = "https://blog.example.com"`
      - 登录回跳地址会强校验是否落在此列表内，非法域名会回退到 `/`
3. 设置 Secrets（在 `cloudflare/` 目录运行下列命令并按提示输入）：
   - `npx wrangler secret put GITHUB_CLIENT_ID`
   - `npx wrangler secret put GITHUB_CLIENT_SECRET`
   - `npx wrangler secret put JWT_SECRET`（随意生成一串强随机字符串）
4. 绑定 D1：
   - 如果你是通过 `wrangler d1 create` 创建的数据库，则 `wrangler.toml` 会被自动写入；
   - 如果是控制台创建，确保 `database_id` 与 `database_name` 正确填写。
5. 部署：
   - `npx wrangler deploy`
6. 部署完成后，记录 Worker 的域名（类似 `https://astro-blog-comments.yourname.workers.dev`）。

---

## 四、前端配置（Astro 博客）
1. 在博客项目根目录创建或更新 `.env`：
   - `PUBLIC_COMMENTS_API_BASE=https://astro-blog-comments.yourname.workers.dev`
2. 重新构建博客：
   - `npm run build && npm run preview`（或按照你的部署流程）。
3. 访问任一文章页（`/posts/...`）：
   - 右侧会出现“评论”面板；
   - 未登录时显示“使用 GitHub 登录”，跳转到 GitHub 完成授权；
   - 登录后可输入 Markdown 并提交评论。

---

## 五、跨域与 Cookie 说明
- Worker 通过 `ALLOWED_ORIGINS` 精确允许你的站点域名；
- Worker 设置 `Set-Cookie: SameSite=None; Secure; HttpOnly`，前端请始终使用 `fetch(..., { credentials: 'include' })`；
- CORS 响应中包含 `Access-Control-Allow-Credentials: true`，并将 `Access-Control-Allow-Origin` 精确返回为请求来源。

---

## 六、手动验证清单
- GET `https://<worker>/auth/session` 返回 `{ authenticated: false }`（未登录）。
- 访问 `https://<worker>/auth/github/login?redirect_uri=https%3A%2F%2Fblog.example.com%2F` 完成 GitHub 授权后重定向至指定页面。
- POST `https://<worker>/api/comments`（带 Cookie）创建评论，成功返回 `201` 与新评论数据。
- GET `https://<worker>/api/comments?postId=/posts/xxx` 返回对应文章评论列表。

---

## 七、维护建议
- 如需调整 Markdown 渲染或白名单，修改 `cloudflare/src/worker.ts` 中 `renderMarkdown` 逻辑；
- 如需扩展用户字段或评论结构，先变更 `schema.sql`，再部署；
- 注意限制单条评论长度（代码中默认 8000 字符）。

---

## 八、常见问题
- 评论面板显示“评论服务未配置”：检查 `.env` 中 `PUBLIC_COMMENTS_API_BASE` 是否设置并已重建站点；
- 登录后仍显示未登录：确认 Worker 的域名已加入 `ALLOWED_ORIGINS`，并检查浏览器是否允许第三方 Cookie；
- 403/401：通常是未带上 Cookie 或域名未在白名单中。
