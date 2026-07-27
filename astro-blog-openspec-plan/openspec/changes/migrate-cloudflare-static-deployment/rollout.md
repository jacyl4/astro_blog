# Rollout

## Preconditions

- 双仓 Pipeline 已稳定。
- staging 和 production secrets/permissions 已确认。
- 当前 Pages 部署和 DNS 状态已备份。
- route baseline 和完整 smoke 工具可用。

## Staging

1. dry-run。
2. 发布 build artifact。
3. 执行全路由、404、headers、静态资产和 PWA 检查。
4. 演练 N→N+1→N 回滚。

## Production

1. 创建 production Worker 并发布同一 artifact。
2. 记录 deployment/version ID。
3. 在低流量窗口切换自定义域名/route。
4. 执行 15 分钟密集 smoke。
5. 持续观察 24 小时，并保留 Pages 七天。

## Smoke Checks

- build manifest 双 SHA 正确。
- 所有历史路由状态正确。
- 404、字体、图片、JS、CSS、manifest、SW 正常。
- 页面控制台无新错误。
- 无 Worker entrypoint、动态 API 或 service/data binding。

## Observation Window

密集观察 24 小时，平台回退窗口七天。

## Rollback Triggers

- 关键页面不可用超过 2 分钟；
- 大量历史 URL 404；
- 资产或 PWA 更新系统性失败；
- Worker deployment 不可确认或日志异常。

## Rollback Procedure

1. 执行已验证的 Wrangler rollback 到上一稳定版本。
2. 读取恢复版本 build manifest 并执行 smoke。
3. 无法恢复时，将域名/route 恢复到 Pages。
4. 保留失败 deployment 和 Pipeline artifacts。

## Cleanup

七天后停止 Pages 自动构建；确认无需平台兜底后再删除旧项目或保留为冻结归档。
