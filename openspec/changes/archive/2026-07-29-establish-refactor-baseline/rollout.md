# Rollout

## Preconditions

- 当前 main 构建和生产站点可访问。
- 已备份当前 dist、路由清单和 CI 配置。
- 评论当前生产状态和完整资源清单已经人工确认。
- D1 数据保留/销毁决定已经记录，必要导出已完成。

## Staging

1. 在候选分支运行全部检查。
2. 发布到现有预览环境或临时静态地址。
3. 比较全部 route manifest。
4. 执行浏览器评论零痕迹检查。
5. 在 staging 验证应用删减，不先删除生产评论资源。

## Production

1. 合并独立 PR。
2. 运行 main Pipeline。
3. 发布后读取 build manifest。
4. 执行首页、文章、分类、标签、归档和 404 smoke。
5. 先撤销 OAuth 与 CI secret，再删除 Worker route/domain、Worker、D1 和 DNS。
6. 执行仓库、生产站点和 Cloudflare 零残留检查。

## Smoke Checks

- 现有 URL 全部返回期望状态。
- 页面布局与内容无非预期变化。
- 控制台无新增错误。
- 评论相关请求为零。
- 评论公开端点、Worker、D1、OAuth、secret、DNS 和预留 adapter 为零。

## Observation Window

观察至少一个正常文章发布周期，确认新基线工具不会误阻断合法新增内容。

## Rollback Triggers

- 任何既有 URL 大量缺失；
- 评论 UI 或脚本意外出现；
- CI 无法在干净环境完成构建。

## Rollback Procedure

应用代码退役异常时回滚应用提交并重新部署最后稳定 commit。已删除的评论基础设施不会作为正常回滚路径恢复；仅在误删事故中使用预先导出的资源清单/数据按独立应急变更重建。保留生成的基线清单用于排查。

## Cleanup

- 删除退役过程中产生的临时兼容开关。
- 保留不含 secret 的退役证据；不保留 CommentsAdapter、future gateway 或 roadmap 实现蓝图。
