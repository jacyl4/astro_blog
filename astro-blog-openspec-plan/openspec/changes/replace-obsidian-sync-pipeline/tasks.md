## 1. 权限与现状盘点

- [x] 1.1 已记录内容仓库 `jacyl4/obsidian-digital`、Astro 仓库 `jacyl4/astro_blog`、shell Runner、`Blog/` 发布根和旧 rsync/commit/push job
- [ ] 1.2 确认两个项目的默认分支和保护规则
- [ ] 1.3 配置 CI_JOB_TOKEN allowlist，并用最小 job 验证指定 SHA clone
- [ ] 1.4 准备只读 Deploy Token 兜底方案但不默认启用

## 2. 内容仓库 Pipeline

- [ ] 2.1 添加快速内容验证 job
- [ ] 2.2 添加只在 `Blog/**` 变化时运行的 rules
- [ ] 2.3 添加 downstream trigger 并传递 CONTENT_PROJECT_PATH 与 CONTENT_SHA
- [ ] 2.4 使用 `strategy: mirror` 传播下游状态
- [ ] 2.5 在 Pipeline 页面输出目标下游链接和内容 SHA

## 3. Astro Prepare 阶段

- [ ] 3.1 创建隔离的 `.work/content-source` 和 `.build` 目录约定
- [ ] 3.2 clone 内容项目并 fetch/checkout 精确 CONTENT_SHA
- [ ] 3.3 校验实际 HEAD 与 CONTENT_SHA 一致
- [ ] 3.4 调用 Content Compiler strict 模式
- [ ] 3.5 保存 normalized content、diagnostics 和 content manifest artifacts
- [ ] 3.6 将 prepare job 设置为失败即终止后续阶段

## 4. Verify 和 Build 阶段

- [ ] 4.1 后续 job 通过 needs 下载当前 prepare artifacts
- [ ] 4.2 执行 npm ci、check、unit、content、route 和静态资产验证
- [ ] 4.3 构建 Astro dist
- [ ] 4.4 生成包含双 SHA 的 build manifest
- [ ] 4.5 保存 dist、route manifest 和 build manifest artifacts

## 5. Deployment 控制

- [ ] 5.1 创建 staging deployment job
- [ ] 5.2 创建受保护的 manual production job
- [ ] 5.3 配置 `resource_group: astro-blog-production`
- [ ] 5.4 配置可中断的旧 Pipeline 策略，验证不会逆序发布
- [ ] 5.5 将 Cloudflare token 限制在 deployment jobs

## 6. 本地开发

- [ ] 6.1 添加 `CONTENT_SOURCE_PATH`/CLI 参数支持
- [ ] 6.2 添加 prepare、dev 和 preview 文档
- [ ] 6.3 在无外部内容源时使用 fixtures 或清晰失败
- [ ] 6.4 添加机器专属绝对路径扫描

## 7. 并行验证与切换

- [ ] 7.1 新旧链路用同一 app/content SHA 生成产物并比较
- [ ] 7.2 测试删除文章没有残留
- [ ] 7.3 快速连续提交两个内容版本并验证部署顺序
- [ ] 7.4 短时冻结内容并切换到新 trigger
- [ ] 7.5 禁用旧 rsync/commit/push job，撤销其长期 OAuth token，并保留七天受控回退说明
- [ ] 7.6 三次成功内容发布后删除旧同步 job 和目标仓库内容镜像提交约定
- [ ] 7.7 执行 `/opsx:verify replace-obsidian-sync-pipeline` 并归档
