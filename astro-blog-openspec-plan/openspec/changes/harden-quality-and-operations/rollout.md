# Rollout

## Preconditions

- 前序 change 的核心测试可独立运行。
- GitLab artifacts 和 Cloudflare observability 权限已确认。
- 现有 CI 耗时基线已记录。

## Staging

1. 首周全部新检查以 report/warning 模式运行。
2. 修复误报和不稳定 fixture。
3. 将 URL、内容完整性、构建和资产有效性升级为硬门禁。
4. 将浏览器和性能检查放入 staging gate。
5. 执行故障注入和回滚演练。

## Production

门禁本身不改变生产业务代码。生产 release evidence 和日志字段随下一次正常部署启用。

## Smoke Checks

- PR 失败能正确阻断。
- 合法内容新增不会被误阻断。
- production manifest 和 deployment evidence 可读取。
- 日志无 secret/private content。

## Observation Window

至少两周，统计 CI 耗时、flaky rate、误报和真实缺陷发现数。

## Rollback Triggers

- 合法内容发布被高频误阻断；
- CI 时间超过团队可接受阈值且无并行优化；
- 日志或 artifact 泄漏敏感信息；
- 资产优化导致明显视觉回归。

## Rollback Procedure

将有问题的单项 gate 降级为 warning 或回滚对应优化提交；保留报告生成和问题登记，避免完全失去可见性。

## Cleanup

两周后删除重复、无价值或长期 flaky 的检查；固定最终门禁和责任人。
