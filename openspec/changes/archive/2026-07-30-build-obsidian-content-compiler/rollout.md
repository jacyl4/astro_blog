# Rollout

## Preconditions

- URL 基线已经建立。
- 内容仓库可以在只读目录被 Pipeline 拉取。
- compat inventory 报告已经人工审查。

## Staging

1. 编译器以 compat 模式运行全量内容。
2. 修复全部 error 和高风险 warning。
3. staging Astro 改读 `.build/content`。
4. 与 legacy 构建比较 route manifest、文章数量和抽样 HTML。
5. 切换 strict 模式并重新验证。

## Production

1. 保留 legacy source adapter 开关。
2. main Pipeline 使用 strict 编译输出。
3. 发布后读取 content/build manifest。
4. 抽查 20 篇文章和所有页面类型。

## Smoke Checks

- 文章正文、代码块、脚注、目录和 callout 正常。
- 所有抽样内部链接到达目标 permalink。
- 页面和 URL 数量与基线一致。

## Observation Window

至少观察三个内容提交，覆盖新增、修改和删除文章。

## Rollback Triggers

- 内容缺失或普遍渲染异常；
- 内部链接大面积错误；
- Pipeline 无法确定性重建。

## Rollback Procedure

将内容 source adapter 切回 legacy `src/content/blog`，重新发布上一稳定 app/content 组合。保留失败编译 artifact 和 diagnostics。

## Cleanup

观察期结束后删除 legacy 内容读取路径，保留迁移报告和编译 fixtures。
