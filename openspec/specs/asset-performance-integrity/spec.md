# asset-performance-integrity Specification

## Purpose
TBD - created by archiving change harden-quality-and-operations. Update Purpose after archive.
## Requirements
### Requirement: Manifest 资产真实有效
系统 MUST 验证 PWA manifest 引用的图标存在、非空、格式正确且尺寸匹配声明。

#### Scenario: 图标为零字节
- **WHEN** manifest 引用空文件
- **THEN** asset quality gate 失败并指出文件和期望尺寸

### Requirement: 静态引用完整
系统 SHALL 验证 favicon、Open Graph、字体、preload 和页面静态资源引用存在于发布产物。

#### Scenario: preload 目标不存在
- **WHEN** 页面输出 preload 一个未生成文件
- **THEN** 静态产物检查失败

### Requirement: 字体和图片受性能预算约束
系统 SHALL 为关键字体、首屏图片、单个大图和总静态产物设置可审查的大小预算。

#### Scenario: 字体包超过预算
- **WHEN** 候选构建字体总量超过已批准预算
- **THEN** CI 失败或要求显式更新预算和原因

### Requirement: preload 只用于关键资源
系统 MUST 通过页面或网络测试确认全局 preload 的资源在当前页面首屏确实被使用。

#### Scenario: 文章页 preload 不使用的图片
- **WHEN** 关键加载窗口内没有请求或使用该资源
- **THEN** 性能检查报告无效 preload 并阻断高影响问题

