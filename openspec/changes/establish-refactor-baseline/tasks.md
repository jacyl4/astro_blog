## 1. 捕获当前基线

- [x] 1.1 在当前 main 提交执行干净的 `npm ci`、`astro check` 和 `astro build`，保存完整日志
- [x] 1.2 导出当前 `dist/` 文件清单、页面总数和各页面类型数量
- [x] 1.3 从当前生产 sitemap、部署产物或爬取结果交叉生成公开 URL 清单
- [x] 1.4 建立源文章到现有 URL 的映射，标记任何无法解释的冲突或后缀
- [x] 1.5 记录当前评论 UI、脚本、网络请求、Worker 部署和 CI secret 的实际状态

## 2. 构建清单工具

- [x] 2.1 创建 route manifest 类型和路径规范化函数
- [x] 2.2 实现构建后 `dist/` 路由扫描器并区分首页、文章、分类、标签、归档和 404
- [x] 2.3 实现 route manifest hash 与差异报告
- [x] 2.4 创建 asset manifest，记录路径、大小和内容 hash
- [x] 2.5 创建 build manifest，记录 app/content SHA、lockfile hash 和两个 manifest hash
- [x] 2.6 将 build manifest 复制到可公开读取的版本路径或 CI artifact

## 3. URL 和内容失败策略

- [x] 3.1 为重复 slug 增加确定性检测和包含源文件的错误信息
- [x] 3.2 将 collection 整体读取失败从空数组降级改为构建失败
- [x] 3.3 区分单篇 frontmatter 错误与 collection 运行错误
- [x] 3.4 实现基线路由对比脚本和 redirect allowlist 文件格式
- [x] 3.5 为新增、删除、改变和已批准迁移编写单元测试

## 4. 评论能力完整退役

- [x] 4.1 记录现有评论代码、公开端点、Worker、D1、OAuth App、secret、DNS 和 CI 变量清单
- [x] 4.2 执行数据处置决定：所有者明确批准 D1 不备份直接删除，退役清单不得包含 secret
- [x] 4.3 删除 `CommentsPanel`、评论客户端脚本、样式、文案、配置、环境变量和页面生命周期代码
- [x] 4.4 删除仓库内评论 Worker、D1 migration/schema、Wrangler 配置和部署说明
- [x] 4.5 删除 GitHub/GitLab 中的评论变量、secret、自动部署配置和 OAuth App 凭据
- [x] 4.6 删除 Cloudflare Comments Worker、route/custom domain、D1 数据库及相关 secret
- [x] 4.7 删除 `astro-blog-comments.seso.icu` DNS 记录，并确认公开端点不再解析或返回服务
- [x] 4.8 删除所有 CommentsAdapter、No-op、future gateway、roadmap 等预设计接缝
- [x] 4.9 执行文本、文件、构建产物、浏览器网络和 Cloudflare 资源零残留扫描

## 5. CI 与测试

- [x] 5.1 将 CI 依赖安装改为 `npm ci` 并移除 lockfile restore
- [x] 5.2 添加 Vitest 最小配置和 release 工具单测
- [x] 5.3 添加静态页面 smoke 脚本
- [x] 5.4 添加浏览器检查：文章 DOM/资源/网络/Cookie 无评论痕迹
- [x] 5.5 在 CI 保存 route、asset、build manifest 和构建日志
- [x] 5.6 更新 README 中的本地验证命令

## 6. 验收与归档

- [x] 6.1 在候选分支重新生成路由并与基线比较
- [x] 6.2 当前语料仅 11 篇；已检查全部文章及所有页面类型
- [ ] 6.3 执行 `/opsx:verify establish-refactor-baseline`
- [ ] 6.4 完成 rollout 中的 production smoke 后归档 change
