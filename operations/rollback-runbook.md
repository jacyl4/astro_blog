# 回滚手册

## 触发条件

- 公开 URL 出现未批准 404；
- build manifest 的 app/content SHA 与计划不一致；
- 静态资源、Service Worker 或核心页面大面积失败；
- 发布顺序倒置，旧内容覆盖新内容；
- production smoke 或错误观测超过既定阈值。

## 优先顺序

1. 暂停后续 production job，记录故障 deployment/version ID。
2. 使用 Cloudflare 版本历史回滚到发布前记录的稳定版本。
3. 重新执行关键路径和全路由 HTTP sweep。
4. 若 Worker 回滚不可用，将自定义域名恢复到保留的 Pages 项目。
5. 清理或更新 Service Worker 缓存只作为后续措施，不得用它掩盖错误 artifact。

## 数据与内容

静态发布不包含数据库迁移。若问题来自内容提交，创建新的内容仓库修复提交并触发
新 pipeline；不得 force-push 或重新使用错误 SHA。若需临时回到 legacy 内容，
只能构建一个明确标记 `BLOG_CONTENT_SOURCE=legacy` 的候选并走完整 staging。

## 证据

记录触发时间、操作者、旧/新 deployment ID、app/content SHA、回滚命令输出、
DNS 状态和 smoke 结果。首次正式发布前必须在 staging 完成一次实际回滚演练。
