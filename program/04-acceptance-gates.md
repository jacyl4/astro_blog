# 验收门禁

## G0：基线可信

- `npm ci` 在干净工作区成功。
- `astro check` 与 `astro build` 成功。
- 基线静态页面数量已记录。
- 公开 URL 快照已提交。
- 生产无评论 UI、脚本、样式、请求、Cookie、环境变量、Worker、D1、OAuth、secret、DNS 和休眠适配器。

## G1：内容编译可信

- 同一输入重复编译的 manifest hash 一致。
- 重复 slug、断链、越出 `Blog/` 发布边界和本地附件引用会使 CI 失败。
- 所有诊断含文件路径，能够定位到具体笔记。
- 迁移模式与严格模式均有测试。
- 原始内容目录从未被编译器写回。

## G2：模块边界可信

- `src/pages/**` 无直接 `getCollection()`。
- 模块外禁止导入 `src/modules/blog/**` 内部路径。
- 纯领域测试无需 Astro runtime。
- 路由和文章集合结果与基线一致。

## G3：双仓流水线可信

- 每次构建记录 `CONTENT_SHA` 与 `CI_COMMIT_SHA`。
- Pipeline 按 `CONTENT_SHA` 拉取 `jacyl4/obsidian-digital:Blog/`，使用临时目录和 artifact 传递内容产物。
- 相同双 SHA 可重建同一清单。
- 生产部署使用 `resource_group` 串行化。
- 上游内容 Pipeline 能看到下游部署最终状态。

## G4：Cloudflare 发布可信

- `wrangler deploy --dry-run` 成功。
- staging 域名通过 smoke、404 和缓存检查。
- 生产部署后 build manifest 可读取。
- 上一 Worker 版本可在演练中恢复。
- Pages 旧入口在观察期内可作为应急回退。

## G5：客户端生命周期可信

- 首次加载和客户端切换的 UI 行为相同。
- 旧 Observer、事件监听器和请求得到清理。
- resize 不触发内容重新加载。
- Playwright 连续 20 次导航无增长性泄漏。

## G6：运维闭环可信

- CI 任一门禁失败均阻断部署。
- 发布证据可按 app SHA、content SHA 和 deployment ID 查询。
- 事故回滚手册已经实际执行一次。
- 依赖风险按生产影响和开发工具影响分类。
