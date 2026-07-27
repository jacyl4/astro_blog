## 1. 当前发布盘点

- [ ] 1.1 记录 Pages 项目、生产域名、DNS、构建设置和最后稳定 deployment
- [x] 1.2 记录当前 headers、redirects、404 和 Service Worker 行为
- [ ] 1.3 确认 Cloudflare API Token 最小权限和 GitLab protected variables
- [x] 1.4 确认当前 Wrangler 4.x 版本和 config schema

## 2. Wrangler 配置

- [x] 2.1 创建 `wrangler.jsonc` 并引用本地 config schema
- [x] 2.2 配置 `assets.directory=./dist`
- [x] 2.3 配置 staging/production 环境名称
- [x] 2.4 配置当前审核日期的 compatibility_date
- [x] 2.5 建立结构化 deployment metadata、manifest 和外部 HTTP smoke 证据
- [x] 2.6 添加 `wrangler types`、生成类型漂移检查、dry-run 和 deploy scripts

## 3. Staging Worker

- [x] 3.1 创建 staging Worker/域名
- [x] 3.2 用当前稳定 dist artifact 发布 staging
- [x] 3.3 对 route manifest 全量请求并记录状态码
- [x] 3.4 对比 Pages 与 Worker 的 headers、redirects、trailing slash 和 404
- [x] 3.5 测试字体、图片、PWA manifest 和 Service Worker 更新
- [x] 3.6 确认任意 `/api/*` 路径按静态 404 处理，且配置无 Worker entrypoint 或动态 binding

## 4. CI Deployment

- [ ] 4.1 将 deployment job 改为下载不可变 build artifact，不重新构建（当前用 pipeline-scoped cache 临时传递，等待 GitLab artifact 服务修复）
- [ ] 4.2 staging job 先执行 dry-run 再 deploy
- [ ] 4.3 staging smoke 通过后才允许 production manual job
- [ ] 4.4 production job 记录 Cloudflare deployment/version ID
- [ ] 4.5 将 build manifest 和部署身份保存为 release evidence

## 5. Production Cutover

- [ ] 5.1 在 production Worker 发布与 staging 相同 artifact
- [ ] 5.2 记录域名切换前 DNS/route 状态
- [ ] 5.3 在低流量窗口切换自定义域名或 route
- [ ] 5.4 立即执行关键路径和全路由 smoke
- [ ] 5.5 观察错误、404 和缓存指标
- [ ] 5.6 保留 Pages 旧入口七天

## 6. 回滚演练与清理

- [ ] 6.1 在 staging 演练 Wrangler 上一版本回滚
- [ ] 6.2 记录 production 回滚命令和版本 ID 获取方法
- [ ] 6.3 验证将域名恢复到 Pages 的应急步骤
- [ ] 6.4 观察期结束后停止 Pages 自动部署
- [ ] 6.5 删除废弃 Action、重复 secret 和旧文档
- [ ] 6.6 执行 `/opsx:verify migrate-cloudflare-static-deployment` 并归档
