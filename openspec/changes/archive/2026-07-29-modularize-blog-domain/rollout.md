# Rollout

## Preconditions

- URL 基线和 BlogService characterization tests 已完成。
- 内容标准模型已经稳定，或本 change 保持与当前输入兼容。

## Staging

1. 按提取批次持续部署 preview。
2. 每批比较 route manifest 和页面抽样。
3. 完成 façade 迁移后执行完整 browser smoke。

## Production

该 change 无基础设施和数据迁移。合并后按普通静态站点流程发布。

## Smoke Checks

- 页面数和全部 URL 不变。
- 首页、分类、标签、归档排序一致。
- 文章详情标题、日期、标签和正文一致。
- 构建时间和输出体积无异常增长。

## Observation Window

观察一个内容发布周期，验证新增和修改文章正常进入所有 selector。

## Rollback Triggers

任何页面、URL、排序或派生聚合结果变化。

## Rollback Procedure

回滚该 change 的模块化提交，恢复旧 BlogService façade 指向原实现，并发布最后稳定版本。

## Cleanup

观察期结束后删除旧 façade、旧测试辅助代码和临时兼容 exports。
