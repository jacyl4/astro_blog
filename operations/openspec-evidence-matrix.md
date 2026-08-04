# OpenSpec Scenario → Evidence Matrix

生成日期：2026-07-29

本表由 `npm run openspec:evidence` 从所有活动 change 的 spec 生成。它保证每个
`#### Scenario` 都有证据入口，但“已映射”不等于“已通过”；`待验证` 与
`时间门` 必须保留到对应演练或观察窗口真实完成。

| Spec | Scenario | 状态 | 自动测试或人工证据 |
| --- | --- | --- | --- |


## 门禁

- `npm run openspec:evidence:check`：检测 spec 新增、删除或矩阵漂移。
- `npm run openspec:validate`：验证 OpenSpec 结构和 requirement/scenario 格式。
- 只有状态为“已验证”且其命令在候选提交上通过，才可关闭对应任务。
