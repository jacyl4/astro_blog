# 部署问题诊断指南

## 问题 1: GitHub 登录跳转到根路径显示 404

### 可能原因
GitHub OAuth App 的回调地址配置可能不正确。

### 检查步骤
1. 访问 GitHub Settings → Developer settings → OAuth Apps
2. 找到你的 OAuth App
3. 确认 **Authorization callback URL** 精确为：
   ```
   https://astro-blog-comments.seso.icu/auth/github/callback
   ```
   
4. 如果是其他地址（如 `https://astro-blog-comments.cfoa.workers.dev/auth/github/callback`），请更新为自定义域名

### 测试命令
```bash
# 手动测试 callback 端点是否存在
curl -I "https://astro-blog-comments.seso.icu/auth/github/callback"
# 应该返回 400 (因为缺少参数)，不是 404
```

## 问题 2: Cloudflare Pages 不显示评论窗

### 根本原因
环境变量在 Cloudflare Pages 中配置后，**必须触发重新构建**才能生效。仅仅添加环境变量是不够的。

### 解决步骤

#### 方法 1: 通过 Git 推送触发重新部署
```bash
# 1. 在本地做一个小改动（或空提交）
git commit --allow-empty -m "Trigger rebuild for env vars"

# 2. 推送到远程仓库
git push

# 3. Cloudflare Pages 会自动检测到推送并重新构建
```

#### 方法 2: 在 Cloudflare Dashboard 手动重试部署
1. 访问 Cloudflare Dashboard → Pages → 你的项目
2. 点击 "Deployments" 标签
3. 找到最新的部署，点击 "Retry deployment"
4. 或者点击 "Create deployment" 创建新部署

### 验证环境变量是否生效
部署完成后，检查页面源代码：
```bash
# 查看部署后的页面是否包含 apiBase
curl -s "https://blog.seso.icu/posts/某篇文章/" | grep -i "apiBase"

# 应该能看到类似这样的内容：
# data-config='{"apiBase":"https://astro-blog-comments.seso.icu",...}'
```

如果没有看到，说明环境变量没有生效，需要：
1. 确认在 Pages 的 **Production** 环境中添加了 `PUBLIC_COMMENTS_API_BASE`
2. 重新触发构建

## 问题 3: 获取登录状态失败

### 可能原因及解决方案

#### 原因 1: Worker 环境变量未配置
检查 Worker 的环境变量：
1. Cloudflare Dashboard → Workers & Pages → astro-blog-comments
2. Settings → Variables
3. 确认以下变量存在且为 "Encrypted"：
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `JWT_SECRET`

如果缺少，添加后需要重新部署 Worker：
```bash
cd cloudflare
npx wrangler deploy
```

#### 原因 2: CORS 配置问题
测试 CORS：
```bash
curl -v -H "Origin: https://blog.seso.icu" \
  "https://astro-blog-comments.seso.icu/auth/session" 2>&1 | grep -i access

# 应该看到：
# access-control-allow-origin: https://blog.seso.icu
# access-control-allow-credentials: true
```

#### 原因 3: 浏览器控制台错误
打开浏览器开发者工具（F12）→ Console 标签，查看是否有错误信息。

常见错误：
- `CORS policy` → CORS 配置问题
- `Failed to fetch` → 网络问题或 API 地址错误
- `net::ERR_NAME_NOT_RESOLVED` → DNS 解析失败

## 问题 4: 页面跳转时动画效果消失

### 原因
Swup 页面转场时，CSS 类没有正确应用。

### 解决方案
已在代码中修复，但需要确保：
1. `src/styles/modules/animations.css` 包含 `is-visible` 类的定义
2. JavaScript 脚本在 `astro:after-swap` 事件中重新初始化

## 完整检查清单

### Worker 配置
- [ ] Worker 已部署到 `https://astro-blog-comments.seso.icu`
- [ ] Worker 环境变量已配置（GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, JWT_SECRET）
- [ ] `wrangler.toml` 中 `ALLOWED_ORIGINS = "https://blog.seso.icu"`
- [ ] 自定义域名 `astro-blog-comments.seso.icu` 已绑定

### GitHub OAuth
- [ ] OAuth App 回调地址为 `https://astro-blog-comments.seso.icu/auth/github/callback`
- [ ] Client ID 和 Secret 已添加到 Worker 环境变量

### Cloudflare Pages
- [ ] 环境变量 `PUBLIC_COMMENTS_API_BASE` 已添加到 Production 环境
- [ ] 值为 `https://astro-blog-comments.seso.icu`
- [ ] 已触发重新构建（推送代码或手动重试）
- [ ] 部署完成后验证页面源代码包含正确的 apiBase

### 前端代码
- [ ] `.env` 文件包含 `PUBLIC_COMMENTS_API_BASE="https://astro-blog-comments.seso.icu"`
- [ ] 本地构建测试通过：`npm run build && npm run preview`
- [ ] 本地能看到评论窗

## 快速测试流程

```bash
# 1. 测试 Worker API
curl "https://astro-blog-comments.seso.icu/auth/session"
# 预期: {"authenticated":false}

# 2. 测试 CORS
curl -H "Origin: https://blog.seso.icu" -I \
  "https://astro-blog-comments.seso.icu/auth/session" | grep -i access
# 预期: access-control-allow-origin: https://blog.seso.icu

# 3. 检查本地构建
npm run build
grep -r "astro-blog-comments.seso.icu" dist/ | head -3
# 预期: 应该能找到包含 apiBase 的文件

# 4. 检查线上部署
curl -s "https://blog.seso.icu" | grep -o "astro-blog-comments.seso.icu"
# 预期: 应该输出域名（如果看不到，说明环境变量没生效）
```

## 常见错误及解决

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| Invalid state cookie | OAuth state 格式不匹配 | 已在最新代码中修复，重新部署 Worker |
| 404 on callback | GitHub 回调地址错误 | 检查 GitHub OAuth App 设置 |
| 评论窗不显示 | Pages 环境变量未生效 | 重新触发 Pages 构建 |
| CORS error | Origin 不在允许列表 | 检查 Worker 的 ALLOWED_ORIGINS |
| 获取登录状态失败 | Worker 环境变量缺失 | 添加 GITHUB_CLIENT_ID 等变量 |

## 获取帮助

如果以上步骤都无法解决问题，请收集以下信息：

1. **浏览器控制台错误**（F12 → Console）
2. **Worker 日志**（Cloudflare Dashboard → Workers → astro-blog-comments → Logs）
3. **测试命令输出**：
   ```bash
   ./docs/test-comments.sh > test-result.txt 2>&1
   ```
4. **环境变量截图**（隐藏敏感信息）
