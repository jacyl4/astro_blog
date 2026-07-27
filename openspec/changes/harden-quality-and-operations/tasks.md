## 1. 测试与证据矩阵

- [ ] 1.1 将所有活动 OpenSpec scenarios 映射到自动测试或人工证据
- [x] 1.2 创建统一 `.build/evidence` 输出约定
- [x] 1.3 配置 JUnit、Playwright trace、manifest 和报告 artifacts
- [x] 1.4 定义 PR、main/staging 和 production 三层 CI

## 2. PR Fast Lane

- [x] 2.1 执行 `npm ci` 和 lockfile 检查
- [x] 2.2 执行 OpenSpec strict validation
- [x] 2.3 执行 Astro check、unit tests 和内容 fixtures
- [x] 2.4 执行 route 和 asset 静态检查
- [x] 2.5 执行 Astro build 和 manifest generation
- [x] 2.6 使用 cache 和 DAG 控制反馈时间

## 3. Main / Staging Full Lane

- [x] 3.1 执行全量 Content Compiler strict 构建
- [x] 3.2 执行 Playwright 生命周期和网络测试
- [x] 3.3 执行全路由 HTTP sweep
- [x] 3.4 执行 Wrangler dry-run 和 staging deploy
- [ ] 3.5 执行稳定的性能/网络 smoke 并保存 trace

## 4. 静态资产完整性

- [x] 4.1 修复并验证真实 PWA 192/512 图标
- [x] 4.2 实现 PNG/尺寸/非空检查
- [x] 4.3 校验 favicon、Open Graph、preload 和页面静态资源引用
- [x] 4.4 评估 Intel One Mono TTF 转 WOFF2 和子集化
- [ ] 4.5 为 wallpaper/head 生成接近展示尺寸的响应式版本
- [x] 4.6 建立字体、关键图片、单文件和 dist 总量预算
- [x] 4.7 检查每个全局 preload 在目标页面真实使用

## 5. 性能基线

- [ ] 5.1 对生产和 staging 记录冷加载网络 trace
- [ ] 5.2 记录 LCP、CLS、INP/交互代理指标和关键请求链
- [ ] 5.3 选择稳定预算和允许波动范围
- [ ] 5.4 将高确定性退化设为阻断，波动指标设为趋势告警
- [ ] 5.5 文档化预算更新审批流程

## 6. Observability 与发布证据

- [ ] 6.1 配置 Wrangler observability 与合理采样
- [x] 6.2 统一 deployment/build manifest 字段
- [ ] 6.3 确认日志不含 secret 和私有内容
- [x] 6.4 创建 production release evidence 模板
- [ ] 6.5 在 staging 执行并记录一次完整回滚演练
- [ ] 6.6 将回滚演练加入季度或关键升级维护计划

## 7. 依赖治理

- [x] 7.1 输出 root 和 Cloudflare 项目的依赖/audit 基线
- [x] 7.2 按生产运行、构建、开发和不可达路径分类
- [x] 7.3 将 Wrangler 固定到已验证的 4.114.0 并执行 schema/types/dry-run
- [ ] 7.4 分组升级 PWA/Workbox 和 Swup 工具链
- [x] 7.5 为 Astro 主版本升级创建单独 OpenSpec change
- [ ] 7.6 每组升级运行完整 staging 回归并保留回滚 commit

## 8. 运维闭环

- [x] 8.1 更新发布、回滚、内容故障和资产故障手册
- [ ] 8.2 运行故障注入：空图标、断链、route 删除、生命周期泄漏
- [ ] 8.3 观察 CI 两周并调整误报/耗时
- [ ] 8.4 删除没有发现能力或重复的门禁
- [ ] 8.5 执行 `/opsx:verify harden-quality-and-operations` 并归档
