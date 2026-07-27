## Purpose

在不混入视觉、内容或平台重构的前提下安全升级 Astro 主版本，并保持博客公开行为
和回滚能力。

## ADDED Requirements

### Requirement: Astro 主版本升级必须独立实施

系统 MUST 将 Astro 主版本升级作为独立 change，不得与评论、内容架构、Cloudflare
平台切换或视觉重设计混合发布。

#### Scenario: 升级需要无关架构改造
- **WHEN** 目标 Astro 版本要求超出兼容迁移范围的架构变化
- **THEN** 当前升级被阻断并拆分新的 change

### Requirement: 升级保持静态发布契约

系统 MUST 保持纯静态输出、既有永久 URL、内容身份和无动态 Worker 运行时的契约。

#### Scenario: 构建引入服务端运行时
- **WHEN** 升级后的配置或 adapter 引入 SSR、server island 或 Worker entrypoint
- **THEN** staging 发布被阻断

### Requirement: 升级必须通过完整回归与回滚演练

系统 SHALL 比较 route、HTML、asset、content 和 build manifests，执行浏览器/PWA
测试，并在 production 前完成 staging 回滚演练。

#### Scenario: HTML 基线存在未批准变化
- **WHEN** 候选版本的核心页面 HTML hash 与基线不同且没有批准记录
- **THEN** production job 不可执行
