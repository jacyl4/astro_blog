# 风险登记表

| ID | 风险 | 概率 | 影响 | 预防 | 触发后的动作 |
|---|---|---:|---:|---|---|
| R01 | 历史文章缺少稳定 slug，迁移后 URL 漂移 | 中 | 极高 | 先生成 URL 快照；迁移表逐篇确认 | 停止上线，恢复旧内容入口 |
| R02 | Obsidian 最短路径链接存在同名歧义 | 高 | 高 | inventory 阶段检测多匹配并失败 | 为链接改用完整路径或显式 permalink |
| R03 | 当前 Markdown 引入尚未定义的本地附件 | 低 | 高 | 编译器明确拒绝本地附件并给出诊断 | 阻断构建，另开附件发布能力 change |
| R04 | 内容编译器输出格式改变 Astro 渲染 | 中 | 高 | fixture + HTML 快照 + 页面 smoke | 回退编译器版本，保留兼容转换 |
| R05 | 双仓 Pipeline 权限配置失败 | 中 | 中 | CI_JOB_TOKEN allowlist 与 staging 演练 | 使用专用只读 Deploy Token 兜底 |
| R06 | 多次内容提交触发部署乱序 | 中 | 高 | `resource_group` + 中断旧流水线策略 | 重新部署目标双 SHA |
| R07 | Workers Static Assets 路由与 Pages 不一致 | 中 | 高 | staging 对比所有路由、404、headers | 恢复 Pages 自定义域名 |
| R08 | Service Worker 缓存旧 HTML/JS | 中 | 中 | 缓存版本化与升级测试 | 发布缓存清理版本并提示刷新 |
| R09 | 模块拆分造成循环依赖 | 中 | 中 | 依赖方向检查与 barrel 入口 | 回退单个重构提交，重新切边界 |
| R10 | Astro 大版本升级混入重构 | 中 | 高 | 单独 change、单独分支、单独验收 | 撤销升级提交，维持当前主版本 |
| R11 | 评论退役不完整，旧 Worker、D1、OAuth、secret 或 DNS 继续暴露 | 中 | 高 | 代码、Cloudflare、GitLab、GitHub OAuth 和 DNS 零残留清单 | 阻断后续上线，完成撤销和删除 |
| R12 | 生产回滚恢复代码但未恢复内容组合 | 中 | 高 | build manifest 记录双 SHA | 按 deployment manifest 重建并部署 |
| R13 | 删除评论资源前未保留必要审计证据 | 低 | 中 | 先导出资源清单与可选数据快照，再删除生产资源 | 停止删除，补齐快照与责任人确认 |
