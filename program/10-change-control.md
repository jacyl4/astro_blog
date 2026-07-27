# 变更控制规则

## 分支与提交

- 每个 OpenSpec change 使用独立 Git 分支。
- 推荐分支名：`refactor/<change-id>`。
- 提交按职责拆分，但每个提交保持可构建。
- 依赖升级、架构拆分、内容迁移和视觉改版分别提交。

## Pull Request 规则

PR 必须包含：

- OpenSpec change ID；
- 影响的模块和路由；
- app/content SHA 测试输入；
- 验证命令和结果；
- URL 变化清单；
- 回滚路径；
- 未完成或延期事项。

## 变更冻结

以下阶段设置短暂冻结：

- URL 快照生成到 slug 策略落定；
- 内容 Pipeline 切换窗口；
- Cloudflare 自定义域名切换窗口。

冻结期间允许安全修复和生产故障修复，普通文章发布进入队列，切换完成后按内容 SHA 顺序重放。
