# Definition of Done

一个 change 只有同时满足以下条件才可归档：

## 规格

- [ ] proposal、specs、design、tasks、verification、rollout 相互一致。
- [ ] 所有 requirement 至少包含一个可验证 scenario。
- [ ] 范围外事项已明确记录。

## 实现

- [ ] `tasks.md` 全部完成或明确移出范围。
- [ ] 新代码遵循模块公开入口和依赖方向。
- [ ] 无新增固定主机绝对路径、隐式全局状态和未处理 Promise。

## 测试

- [ ] 单元、集成、静态产物或浏览器测试覆盖对应 scenarios。
- [ ] 干净环境执行 `npm ci`、检查、测试、构建成功。
- [ ] 路由和 build manifest 检查通过。

## 发布

- [ ] staging 已验证。
- [ ] rollout 与 rollback 均具有可执行命令。
- [ ] 生产发布记录 app SHA、content SHA 和部署 ID。

## 文档

- [ ] README、运行手册和配置示例已经同步。
- [ ] 变更归档后，OpenSpec 主 specs 与实际行为一致。
