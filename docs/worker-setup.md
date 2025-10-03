# Cloudflare Worker 配置指南

## ⚠️ 重要：Worker 环境变量配置

Worker 已部署到 `https://astro-blog-comments.cfoa.workers.dev`，但**必须**在 Cloudflare Dashboard 中配置以下环境变量，否则评论系统无法工作。

### 必需的环境变量

访问 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → astro-blog-comments → Settings → Variables

添加以下**加密变量**（Encrypted）：

1. **GITHUB_CLIENT_ID**
   - 值：你的 GitHub OAuth App 的 Client ID
   - 在 GitHub Settings → Developer settings → OAuth Apps 中获取

2. **GITHUB_CLIENT_SECRET**
   - 值：你的 GitHub OAuth App 的 Client Secret
   - ⚠️ 这是敏感信息，必须加密存储

3. **JWT_SECRET**
   - 值：一个随机生成的强密码（至少 32 字符）
   - 生成方式：`openssl rand -base64 32`
   - 或使用：`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### 已配置的环境变量

- ✅ `ALLOWED_ORIGINS` = `https://blog.seso.icu`（已在 wrangler.toml）
- ✅ `DB` = D1 数据库绑定

## 自定义域名配置

### 当前状态
- Worker URL: `https://astro-blog-comments.cfoa.workers.dev`
- 期望的自定义域名: `https://astro-blog-comments.seso.icu`

### 配置步骤

1. **在 Cloudflare Dashboard 添加自定义域名**
   - 进入 Workers & Pages → astro-blog-comments → Settings → Triggers
   - 点击 "Add Custom Domain"
   - 输入：`astro-blog-comments.seso.icu`
   - Cloudflare 会自动创建 DNS 记录

2. **验证域名配置**
   ```bash
   curl https://astro-blog-comments.seso.icu/auth/session
   # 应返回: {"authenticated":false}
   ```

3. **更新 GitHub OAuth App 回调地址**
   - 如果使用自定义域名，将回调地址改为：
     `https://astro-blog-comments.seso.icu/auth/github/callback`

## Cloudflare Pages 环境变量

你的博客部署在 Cloudflare Pages 上，需要配置环境变量。

访问 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → 你的项目 → Settings → Environment Variables

添加以下变量（Production 和 Preview 环境都需要）：

| 变量名 | 值 |
|--------|-----|
| `PUBLIC_COMMENTS_API_BASE` | `https://astro-blog-comments.seso.icu` 或 `.cfoa.workers.dev` |

⚠️ **注意**：修改环境变量后需要重新部署 Pages 才能生效！

## 故障排查

### 问题 1: "获取登录状态失败"

**可能原因**：
- Worker 环境变量未配置
- CORS 问题
- Worker 未正确部署

**解决方案**：
```bash
# 1. 检查 Worker 是否可访问
curl https://astro-blog-comments.seso.icu/auth/session

# 2. 检查 CORS
curl -H "Origin: https://blog.seso.icu" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://astro-blog-comments.seso.icu/auth/session

# 3. 确认环境变量已设置
# 在 Cloudflare Dashboard 检查
```

### 问题 2: "GitHub 登录后跳转 404"

**可能原因**：
- GitHub OAuth 回调地址配置错误
- Worker 自定义域名未配置

**解决方案**：
1. 确认 GitHub OAuth App 的回调地址与 Worker 地址一致
2. 确认 Worker 自定义域名已正确配置并可访问

### 问题 3: "本地 preview 能看到评论窗，部署后看不到"

**可能原因**：
- Cloudflare Pages 环境变量未配置
- 环境变量未生效（需要重新部署）

**解决方案**：
1. 在 Cloudflare Pages Dashboard 添加 `PUBLIC_COMMENTS_API_BASE` 环境变量
2. 重新部署 Pages：
   ```bash
   npm run build
   # 然后推送到 git，触发自动部署
   ```

## 部署检查清单

- [ ] Worker 已部署（`cd cloudflare && npx wrangler deploy`）
- [ ] Worker 环境变量已配置（GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, JWT_SECRET）
- [ ] Worker 自定义域名已配置（astro-blog-comments.seso.icu）
- [ ] GitHub OAuth App 回调地址已更新
- [ ] Cloudflare Pages 环境变量已配置（PUBLIC_COMMENTS_API_BASE）
- [ ] Pages 已重新部署
- [ ] 测试登录流程是否正常
- [ ] 测试发表评论是否正常

## 快速测试命令

```bash
# 测试 Worker 可访问性
curl https://astro-blog-comments.seso.icu/auth/session

# 测试 CORS
curl -v -H "Origin: https://blog.seso.icu" \
     https://astro-blog-comments.seso.icu/auth/session

# 测试评论 API
curl -H "Origin: https://blog.seso.icu" \
     "https://astro-blog-comments.seso.icu/api/comments?postId=/posts/test"
```
