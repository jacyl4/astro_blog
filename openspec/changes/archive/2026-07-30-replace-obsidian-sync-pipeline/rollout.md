# Rollout

## Preconditions

- Content Compiler strict 模式通过。
- 两个 GitLab 项目权限和 trigger 已在 staging 分支验证。
- 旧同步脚本和最后稳定内容提交已记录。

## Staging

1. 新 Pipeline 使用与旧生产相同的 app/content SHA 构建。
2. 对比 route、asset、content 和 build manifests。
3. 测试内容新增、修改和删除。
4. 测试下游失败传播和并发顺序。

## Production

1. 宣布短时内容冻结。
2. 等待旧同步和部署队列清空。
3. 启用内容仓库 downstream trigger。
4. 以冻结点 CONTENT_SHA 执行首次 production Pipeline。
5. 校验公开 build manifest。
6. 禁用旧同步 job。
7. 解除内容冻结并依次发布积压提交。

## Smoke Checks

- 首次新链路部署与冻结点内容完全一致。
- 新文章、修改文章和删除草稿按预期。
- app/content SHA 可追溯。
- 旧 rsync/commit/push job 不再影响构建或目标仓库历史。

## Observation Window

七天或至少三次真实内容发布，以较长者为准。

## Rollback Triggers

- 跨项目触发持续失败；
- content SHA 漂移；
- 产物残留；
- 部署乱序；
- 新 Runner 无法构建。

## Rollback Procedure

1. 禁用新 trigger。
2. 恢复旧同步 job。
3. 将最后稳定 CONTENT_SHA 同步到 legacy 目录。
4. 发布最后稳定 app SHA。
5. 验证 route manifest。

## Cleanup

观察期结束后删除旧 `.gitlab-ci.yml` 同步 job、OAuth token、目标仓库镜像提交约定和无用 Runner 权限。
