# Rollout

## Preconditions

- 基线 browser smoke 可运行。
- 评论能力退役 change 已完成且零残留。
- 当前权威导航事件已经从源码和 trace 确认。

## Staging

1. 按 controller 分批迁移并发布 preview。
2. 开发 debug counters 开启。
3. 执行直接加载、切页、history、快速导航和 resize。
4. 对比基线视觉与网络行为。

## Production

1. 合并完整 migration PR。
2. 发布静态站点。
3. 抽查长文章、目录、移动导航和历史操作。
4. 观察浏览器错误日志。

## Smoke Checks

- Navigation active state 正确。
- TOC 出现、跟随滚动并在离页时清理。
- 浏览器后退/前进正常。
- 连续切页无重复行为。

## Observation Window

至少一个正常访问日，并覆盖桌面和移动设备。

## Rollback Triggers

- 导航或 TOC 在主要场景失效；
- 重复监听造成明显行为或性能问题；
- history navigation 异常；
- 页面竞态影响内容显示。

## Rollback Procedure

按 controller 回滚对应迁移提交，恢复旧初始化入口；保留 lifecycle adapter 但暂时不注册该 controller。

## Cleanup

删除旧 public scripts、全局 bound flag、重复 DOMContentLoaded/Swup/Astro listeners 和 debug 临时日志。
