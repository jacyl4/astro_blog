# 重新部署 Cloudflare Pages 以应用环境变量

## 问题
在 Cloudflare Pages 中添加或修改环境变量后，**必须重新构建**才能使变量生效。

## 方法 1: 通过 Git 推送（推荐）

```bash
# 在项目根目录执行

# 1. 创建一个空提交来触发重新部署
git commit --allow-empty -m "chore: trigger rebuild for env vars"

# 2. 推送到远程仓库
git push

# 3. Cloudflare Pages 会自动检测并开始构建
# 访问 Cloudflare Dashboard 查看构建进度
```

## 方法 2: 在 Dashboard 手动重试

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pages → 选择你的项目
3. Deployments 标签
4. 点击最新部署旁边的三个点 `···`
5. 选择 "Retry deployment"

或者：
1. 在 Deployments 页面点击 "Create deployment"
2. 选择 Production 分支
3. 点击 "Save and Deploy"

## 验证环境变量是否生效

部署完成后，运行以下命令验证：

```bash
# 1. 检查页面源代码中是否包含正确的 apiBase
curl -s "https://blog.seso.icu" | grep -o "astro-blog-comments.seso.icu"

# 2. 如果有输出，说明环境变量已生效
# 如果没有输出，说明需要再次检查配置
```

## Cloudflare Pages 环境变量配置

确保在 **Production** 和 **Preview** 环境都添加：

| 变量名 | 值 |
|--------|-----|
| `PUBLIC_COMMENTS_API_BASE` | `https://astro-blog-comments.seso.icu` |

### 配置步骤
1. Cloudflare Dashboard → Pages → 你的项目
2. Settings → Environment variables
3. 点击 "Add variable"
4. Variable name: `PUBLIC_COMMENTS_API_BASE`
5. Value: `https://astro-blog-comments.seso.icu`
6. 环境选择: **Production** (勾选)
7. 点击 "Save"
8. 重复步骤 3-7，但环境选择 **Preview**

### ⚠️ 重要
配置完成后**必须重新部署**（使用上述方法 1 或 2）。

## 常见问题

### Q: 我已经添加了环境变量，为什么还是不生效？
A: 环境变量只在构建时注入，必须触发新的构建才能生效。

### Q: 本地 preview 可以看到评论窗，但线上看不到？
A: 这正是因为线上环境变量没有生效。请按照上述步骤重新部署。

### Q: 如何确认环境变量是否正确配置？
A: 
1. 在 Cloudflare Pages 的 Settings → Environment variables 中查看
2. 确认变量名拼写完全正确（大小写敏感）
3. 确认值中没有多余的空格或引号
4. 确认 Production 环境已勾选

### Q: 重新部署需要多久？
A: 通常 2-5 分钟。可以在 Deployments 页面实时查看构建日志。

## 部署后测试

```bash
# 1. 访问你的博客文章页面
# 例如: https://blog.seso.icu/posts/某篇文章/

# 2. 打开浏览器开发者工具 (F12)
# 3. 查看 Console 标签，不应该有 "评论服务未配置" 的错误
# 4. 查看 Network 标签，应该能看到对 astro-blog-comments.seso.icu 的请求

# 5. 右侧应该能看到评论窗
```
