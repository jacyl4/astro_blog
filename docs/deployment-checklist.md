# 部署检查清单

## 评论系统配置

### 1. Worker 部署配置 ✓

#### Cloudflare Worker 设置
- Worker 名称：`astro-blog-comments`
- 自定义域名：`astro-blog-comments.seso.icu`
- 数据库：D1 (`astro-blog-comments-db`)

#### 环境变量（在 Cloudflare Dashboard 设置）
必须在 Cloudflare Worker 设置中配置以下环境变量：
- `GITHUB_CLIENT_ID`: GitHub OAuth App 的 Client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth App 的 Client Secret  
- `JWT_SECRET`: 用于签名 session token 的密钥（随机生成的强密码）
- `ALLOWED_ORIGINS`: `https://blog.seso.icu`（允许的跨域来源）

#### wrangler.toml 已配置 ✓
```toml
ALLOWED_ORIGINS = "https://blog.seso.icu"
```

### 2. GitHub OAuth App 配置 ✓

在 GitHub Settings > Developer settings > OAuth Apps 中：
- **Application name**: Astro Blog Comments
- **Homepage URL**: `https://blog.seso.icu`
- **Authorization callback URL**: `https://astro-blog-comments.seso.icu/auth/github/callback`

### 3. 前端环境变量配置 ✓

`.env` 文件已正确配置：
```env
PUBLIC_COMMENTS_API_BASE="https://astro-blog-comments.seso.icu"
```

## 部署步骤

### Worker 部署

```bash
cd cloudflare
npm install
wrangler deploy
```

### 验证 Worker 部署
访问以下 URL 应该返回 JSON：
```
https://astro-blog-comments.seso.icu/auth/session
```
应返回：`{"authenticated":false}`

### 前端部署

```bash
npm run build
# 然后部署 dist/ 目录到 Cloudflare Pages 或其他托管平台
```

## 测试流程

### 1. 测试评论系统登录
1. 访问任意文章页面（如 `/posts/xxx`）
2. 在右侧评论面板点击"使用 GitHub 登录"
3. GitHub 授权后应返回文章页面
4. 评论面板应显示"已登录：你的GitHub用户名"

### 2. 测试发表评论
1. 登录后，在评论框输入内容
2. 点击"发送"
3. 评论应出现在列表中

### 3. 测试评论加载
1. 刷新页面
2. 之前发表的评论应该正常显示

## 故障排查

### 问题：点击登录后跳转 404
**解决方案**：
- 检查 GitHub OAuth App 的回调地址是否为 `https://astro-blog-comments.seso.icu/auth/github/callback`
- 确认 Worker 已正确绑定到自定义域名 `astro-blog-comments.seso.icu`

### 问题：显示"获取登录状态失败"
**可能原因**：
- Worker 的 `ALLOWED_ORIGINS` 环境变量未包含 `https://blog.seso.icu`
- Worker 的 `JWT_SECRET` 环境变量未设置
- CORS 配置问题

**解决方案**：
1. 在 Cloudflare Dashboard 检查 Worker 环境变量
2. 确保 `ALLOWED_ORIGINS=https://blog.seso.icu`
3. 确保已设置 `JWT_SECRET`

### 问题：发送评论失败
**可能原因**：
- 未登录
- D1 数据库连接问题

**解决方案**：
1. 确认已成功登录
2. 检查 Worker logs 中的错误信息
3. 确认 D1 数据库已正确绑定

## 本次更新内容

### 修复项
1. ✅ 修复了 JWT base64url 解码问题，避免登录状态验证失败
2. ✅ 优化了 OAuth state cookie 存储，使用 JSON 格式避免解析错误
3. ✅ 确保 GitHub 登录回调流程正确

### 新增功能
1. ✅ 表格字体优化（缩小并支持移动端横向滚动）
2. ✅ 文章正文平滑显示动画
3. ✅ 全部 JavaScript 文件转换为 TypeScript

## 部署后验证

- [ ] Worker 可访问
- [ ] 前端页面可访问
- [ ] GitHub 登录流程正常
- [ ] 可以发表评论
- [ ] 评论可以正常显示
- [ ] 页面刷新后评论仍然显示
- [ ] 表格在移动端可横向滚动
- [ ] 文章内容有淡入动画
