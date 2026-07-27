# 固化质量与运维门禁

## Why

前六个 change 建立模块和流水线边界，但如果验证命令、性能预算、资产检查、观测和回滚演练只存在于一次性施工记录中，后续依赖更新和内容演化仍会重新积累风险。需要将关键契约纳入持续 CI 和运行手册。

## Current Behavior

- 现有质量闸门不足以覆盖 URL、内容编译、浏览器生命周期和 Cloudflare 发布。
- PWA 图标、字体、大图和 preload 等资产问题可能构建成功后才暴露。
- 依赖 audit 数量需要按运行影响分类，而不是一次性批量升级。
- Cloudflare deployment/version 记录需要与 GitLab manifest 关联。

## What Changes

- 建立分层测试矩阵和 CI DAG。
- 将 OpenSpec strict validation、content、routes、assets、browser smoke 纳入门禁。
- 建立静态资产格式、尺寸、引用和性能预算。
- 建立 Core Web Vitals / Lighthouse 或浏览器 trace 基线。
- 建立 Cloudflare deployment/version、manifest、HTTP smoke 与 Pipeline 的结构化证据链。
- 建立依赖分批升级和 audit 风险登记。
- 将发布与回滚演练纳入周期性运维。

## Capabilities

### New Capabilities

- `continuous-quality-gates`
- `asset-performance-integrity`
- `operational-observability`

### Modified Capabilities

无。

## Scope

### In Scope

CI、测试、资产、性能、日志、依赖治理、文档和演练。

### Out of Scope

- 追求任意单一 Lighthouse 满分。
- 在本 change 升级 Astro 主版本。
- 引入昂贵外部 APM 作为前置要求。
- 任何尚未批准的动态 API 可观测性。

## Dependencies

在前六个 change 基本稳定后执行，部分测试脚手架可提前建设。

## Impact

CI 时间、测试依赖、静态资产处理、Wrangler observability 和运行文档。

## Risk Summary

过重门禁会拖慢小博客迭代。测试按风险分层，PR 运行快速集，main/staging 运行完整浏览器和性能检查。

## Rollback Triggers

- 门禁大量误报并阻断正常内容发布；
- 日志采样或浏览器测试造成不可接受成本；
- 资产优化导致视觉或字体明显退化；
- 依赖升级混入无法定位的行为变化。
