# 回滚手册

## 触发条件

- 任何公开 URL 大规模 404；
- 文章数量异常减少；
- 关键静态资源无法访问；
- 生产构建清单与目标双 SHA 不一致；
- 页面脚本出现持续异常；
- Cloudflare 静态路由或缓存行为导致主要页面不可用。

## 内容流水线回滚

1. 禁用内容仓库的新下游 trigger。
2. 重新启用旧同步任务。
3. 以最后成功的 content SHA 恢复旧内容目录。
4. 使用最后成功的 Astro app SHA 构建并发布。
5. 对比恢复后的 route manifest。
6. 记录失败双 SHA 和诊断产物。

## Cloudflare 回滚

优先顺序：

1. 使用 Wrangler 将 Worker 回滚到上一稳定版本。
2. 验证 build manifest、首页和抽样路由。
3. Worker 版本不可用时，将自定义域名恢复到原 Pages 项目。
4. 清理或刷新错误缓存版本。
5. 保留失败版本与 Pipeline artifact 用于复盘。

## 应用代码回滚

- 每个 change 使用独立分支和可逆提交。
- 回滚完整 change，避免手工摘取多个互相依赖的小提交。
- 数据格式变化采用向前兼容的 expand/contract，确保旧版本仍能读取。

## 回滚后的闭环

- [ ] 生产恢复到已知 app/content SHA。
- [ ] URL 和页面数恢复。
- [ ] 事故时间线、触发信号和根因已记录。
- [ ] 对应 OpenSpec change 的设计、任务和风险已更新。
