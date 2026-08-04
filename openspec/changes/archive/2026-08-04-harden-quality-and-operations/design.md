# Design

## Context

质量体系服务于快速、安全发布，而不是堆积检查项。门禁应按反馈速度分层，并将已有 OpenSpec scenarios 映射为测试或明确人工证据。

## Goals

- 快速 PR 反馈与完整 staging 验证兼顾。
- 静态资产和性能问题构建期可见。
- 部署、版本和日志可追溯。
- 依赖升级可定位、可回滚。
- 运行手册持续有效。

## Non-Goals

- 不为低流量个人博客引入复杂企业级观测平台。
- 不让波动性性能分数轻易阻断所有内容发布。
- 不在同一 PR 批量升级全部依赖。

## Architecture and Boundaries

### CI 分层

```text
PR fast lane
  npm ci
  openspec validate
  astro check
  unit
  content validate/compile fixtures
  route/asset static checks
  build

main/staging full lane
  all fast checks
  full content compile
  browser lifecycle
  route HTTP sweep
  performance smoke
  wrangler dry-run/deploy staging

production
  protected manual or policy gate
  same artifact deploy
  smoke + evidence
```

### Evidence 目录

```text
.build/evidence/
├── content-diagnostics.json
├── route-diff.json
├── asset-report.json
├── browser-report/
├── performance-report.json
└── build-manifest.json
```

## Decisions

### 1. 风险驱动的门禁

URL、内容隐私、构建失败和部署错误为硬阻断。性能指标使用稳定预算和趋势阈值，避免公共 Runner 波动误报。

### 2. 资产验证使用确定性文件检查

尺寸、格式、引用和 hash 不依赖浏览器波动，进入 PR fast lane。LCP/网络链进入 staging。

### 3. 依赖升级独立 PR

Wrangler、Astro、PWA/Workbox、Swup 分组升级，每组运行完整回归并可单独回滚。

### 4. Observability 从发布身份开始

纯静态站点没有服务端业务日志。最重要的是 deployment→manifest→Pipeline→双 SHA 的链路，不为尚未批准的动态能力预设 trace 字段。

### 5. 定期演练而非只写手册

runbook 只有被实际执行才可信。每次发布模型重大变化后执行 staging rollback，之后按季度或关键升级执行。

## Alternatives Considered

- 所有检查每个 PR 全跑：反馈慢、资源浪费。
- 只运行 npm audit：不能解释实际暴露，也不验证行为。
- 只依赖 Lighthouse 分数：波动且不能替代 URL/内容契约。
- 引入复杂 APM：当前静态站点收益有限。

## Failure Modes

- 浏览器测试 flaky → 固定 viewport/数据，失败保存 trace，可针对非阻断指标重试一次。
- 性能预算过时 → 预算更新必须有差异和原因。
- artifact 过期太快 → 生产 evidence 保留期长于普通 PR。
- audit 自动 fix 破坏依赖 → 禁用无审查的 major fix。
- 日志含敏感信息 → 字段 allowlist 和测试。

## Security and Integrity

- CI 日志不输出 token、Cookie、完整本地路径或私有笔记正文。
- artifacts 按敏感程度设置可见性。
- 结构化日志对用户标识进行 hash 或省略。

## Observability

核心字段：

```text
applicationCommit
contentCommit
deploymentId
pipelineUrl
routeManifestHash
assetManifestHash
```

## Test Strategy

质量 change 本身通过故障注入验证：空 PWA 图标、断链、重复 slug、route 删除、controller 泄漏、staging 404 和依赖风险样例。

## Migration Plan

1. 建立报告但不阻断，用故障注入和完整候选流水线校验发现能力与误报。
2. 将确定性高风险项升级为硬门禁。
3. 将浏览器和性能放入 staging。
4. 建立生产 evidence 和回滚周期。
5. 分批处理现有依赖和资产债务。

## Rollback Design

门禁规则可独立降级为 warning，但保留报告；资产优化和依赖升级各自独立提交，可按组回滚。

## Risks and Mitigations

- [CI 时间增长] → cache、needs DAG、fast/full lane。
- [小项目流程过重] → 只保留能防止真实风险的检查，每季度清理零价值门禁。

## Open Questions

性能预算的具体数值需要在真实生产 trace 后确定，本 design 先固定建立基线和更新流程。
