# 统一客户端页面生命周期

## Why

当前浏览器脚本监听多个 Astro/Swup/DOMContentLoaded 事件，并在加载时立即执行。即使部分逻辑通过标记和 disconnect 防重，页面快速切换、resize 和重新初始化仍可能造成重复请求、重复监听、Observer 泄漏和旧页面结果覆盖新页面。

## Current Behavior

- Navigation、TOC 和脚注增强分别管理生命周期。
- 多个事件源触发相似初始化。
- resize 可能执行超出布局更新的工作。
- 请求 token 只阻止旧结果覆盖，未必真正取消网络请求。

## What Changes

- 建立单一 `navigationLifecycle` adapter，将外部路由事件转换为内部 mount/destroy 周期。
- Navigation 和 TOC 实现一致的 Controller 接口。
- 所有 Observer、事件监听和 AbortController 由 controller 实例拥有。
- 页面切换前 destroy，页面稳定后 mount。
- resize 只处理视口和可见性。
- Playwright 连续导航测试验证资源数量有界。

## Capabilities

### New Capabilities

- `page-lifecycle-consistency`
- `client-async-cancellation`

### Modified Capabilities

无。

## Scope

### In Scope

Navigation、TOC 和脚注/页面增强的生命周期框架。

### Out of Scope

- 更换路由库。
- 引入大型状态管理。
- 页面视觉改版。

## Dependencies

依赖基线浏览器 smoke；可与内容和 Cloudflare工作部分并行。

## Impact

公共脚本、Layout 注入、导航和目录组件、浏览器测试。

## Risk Summary

事件选择错误可能导致首次加载或客户端切页不初始化。先用 adapter 兼容当前权威路由事件，再逐步删除多余监听。

## Rollback Triggers

- 首次加载或任意客户端切页后导航/目录失效；
- 浏览器历史前进后退异常；
- 连续切页出现增长性请求、监听或 Observer；
- 可访问性焦点恢复退化。
