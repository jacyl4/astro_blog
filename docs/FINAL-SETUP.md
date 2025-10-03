# 评论系统最终配置指南

## ✅ 当前状态

Worker 已成功部署并正常工作！

- Worker URL: `https://astro-blog-comments.cfoa.workers.dev`
- `/auth/session` ✓ 正常
- `/auth/github/login` ✓ 正常（返回 302 重定向到 GitHub）
- `/auth/github/callback` ✓ 正常（等待 OAuth 参数）

## 🔧 必须完成的配置步骤

### 1. 更新 .env 文件

```bash
# 编辑 .env 文件
PUBLIC_COMMENTS_API_BASE="https://astro-blog-comments.cfoa.workers.dev"
```

### 2. 确认 GitHub OAuth App 回调地址

访问 [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)

确认 **Authorization callback URL** 为：
```
https://astro-blog-comments.cfoa.workers.dev/auth/github/callback
```

⚠️ **注意**：必须是 `.cfoa.workers.dev` 而不是 `.seso.icu`（自定义域名暂时有路由问题）

### 3. 重新构建前端

```bash
npm run build
```

### 4. 配置 Cloudflare Pages 环境变量

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pages → 你的博客项目 → Settings → Environment variables
3. 添加或更新：
   - Variable name: `PUBLIC_COMMENTS_API_BASE`
   - Value: `https://astro-blog-comments.cfoa.workers.dev`
   - 环境: Production ✓ 和 Preview ✓

### 5. 重新部署 Cloudflare Pages

**方法 A: 通过 Git 推送**
```bash
git add .env
git commit -m "fix: update comments API to workers.dev domain"
git push
```

**方法 B: 手动重试**
1. Cloudflare Dashboard → Pages → 你的项目 → Deployments
2. 点击最新部署旁的 `···` → "Retry deployment"

## 🧪 测试步骤

### 本地测试

```bash
# 1. 构建并预览
npm run build
npm run preview

# 2. 打开浏览器访问一篇文章
# http://localhost:4321/posts/某篇文章/

# 3. 检查评论窗是否显示
# 4. 点击"使用 GitHub 登录"测试登录流程
```

### 线上测试

部署完成后：

1. **访问文章页面**
   - 例如：`https://blog.seso.icu/posts/某篇文章/`
   
2. **检查评论窗是否显示**
   - 桌面端：右侧应该能看到评论面板
   - 如果看不到，打开开发者工具（F12）查看 Console 是否有错误

3. **测试登录流程**
   - 点击"使用 GitHub 登录"
   - 应该跳转到 GitHub 授权页面
   - 授权后应该返回原文章页面
   - 评论窗显示"已登录：你的用户名"

4. **测试发表评论**
   - 在评论框输入内容
   - 点击"发送"
   - 评论应该出现在列表中

## 🔍 快速诊断命令

```bash
# 测试 Worker API
curl "https://astro-blog-comments.cfoa.workers.dev/auth/session"
# 预期输出: {"authenticated":false}

# 测试登录端点
curl -I "https://astro-blog-comments.cfoa.workers.dev/auth/github/login?redirect_uri=https://blog.seso.icu"
# 预期: HTTP/2 302 和 Location: https://github.com/...

# 测试回调端点（会返回 400 因为缺参数，这是正常的）
curl "https://astro-blog-comments.cfoa.workers.dev/auth/github/callback"
# 预期输出: Invalid OAuth response

# 检查本地构建是否包含正确的 API 地址
grep -r "cfoa.workers.dev" dist/ | head -3
```

## ⚠️ 常见问题

### Q: 为什么不用 astro-blog-comments.seso.icu？

A: 自定义域名的路由配置有问题，所有请求都返回 404。暂时使用 `.cfoa.workers.dev` 域名。

### Q: 线上还是看不到评论窗？

A: 
1. 确认 Cloudflare Pages 环境变量已配置
2. 确认已重新部署（环境变量修改后必须重新部署）
3. 清除浏览器缓存后重试

### Q: 显示"获取登录状态失败"？

A: 检查浏览器开发者工具 Console，查看具体错误。常见原因：
- CORS 错误：确认 Worker 的 ALLOWED_ORIGINS 包含你的博客域名
- 网络错误：检查 Worker 是否可访问

### Q: GitHub 登录后显示 404？

A: 检查 GitHub OAuth App 的回调地址是否正确：
```
https://astro-blog-comments.cfoa.workers.dev/auth/github/callback
```

## ✨ 预期效果

配置完成后：
- ✅ 文章页面右侧显示评论窗（桌面端，屏幕宽度 ≥ 1280px）
- ✅ 评论窗有展开/收起动画
- ✅ 可以通过 GitHub 登录
- ✅ 登录后可以发表评论
- ✅ 评论支持 Markdown 格式
- ✅ 页面刷新后评论仍然显示

## 📚 相关文档

- [Worker 配置指南](./worker-setup.md)
- [问题诊断](./debug-deployment.md)
- [部署检查清单](./deployment-checklist.md)
- [重新部署指南](./redeploy-pages.md)
