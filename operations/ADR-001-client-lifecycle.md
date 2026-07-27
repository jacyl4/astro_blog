# ADR-001：以 Astro/Swup 集成事件作为唯一页面生命周期

- 状态：已接受
- 日期：2026-07-27

## 背景

站点使用 `@swup/astro` 替换 `#swup` 内容。旧实现把
`DOMContentLoaded`、Swup、自定义事件、`resize`、Observer 和定时器分散在
多个组件中，无法证明站内切页后副作用已被清理。

## 决策

`src/client/runtime` 是浏览器副作用的唯一调度入口：

1. 首次文档加载时 mount；
2. `astro:before-swap` 时 destroy；
3. `astro:page-load` 时 mount；
4. 全站只注册一个 resize dispatcher；
5. 每次 mount 创建新的 generation 与 `AbortController`；
6. controller 逆序清理，异常彼此隔离；
7. 异步回调在写入页面前必须同时检查 `signal` 或 `context.isActive()`。

页面组件不得再次直接建立跨页面监听器、Observer 或持久 timer。新增交互应实现
`PageController` 并注册到 `src/client/runtime/index.ts`。

## 后果与验证

- 生命周期行为集中且可观测，开发模式可读取 debug snapshot。
- controller 必须显式拥有并清理自身资源。
- Playwright 连续执行 20 次站内导航、后退/前进和多次 resize；监听器与
  IntersectionObserver 计数不得增长，且不得产生 `/api/*` 或 `/auth/*` 请求。
